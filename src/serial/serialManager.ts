import { buildBitmapPacket, buildPingPacket } from "./protocol";
import { SerialTransport } from "./transport";
import { WebSerialTransport } from "./webSerialTransport";
import { MockSerialTransport } from "./mockSerialTransport";
import { logger } from "../utils/logger";

export type SerialState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "transmitting"
  | "error";

export interface SerialStatus {
  state: SerialState;
  portName?: string;
  errorMessage?: string;
  bytesTransferred: number;
  totalBytes: number;
  progressPercent: number;
}

type StatusListener = (status: SerialStatus) => void;

export class SerialManager {
  private activeTransport: SerialTransport | null = null;
  private realTransport: SerialTransport;
  private mockTransport: SerialTransport;
  private listeners: Set<StatusListener> = new Set();
  private isMockMode: boolean = false;

  private status: SerialStatus = {
    state: "disconnected",
    bytesTransferred: 0,
    totalBytes: 0,
    progressPercent: 0,
  };

  constructor(
    realTransport?: SerialTransport,
    mockTransport?: SerialTransport
  ) {
    this.realTransport = realTransport || new WebSerialTransport();
    this.mockTransport = mockTransport || new MockSerialTransport();
  }

  public isSupported(): boolean {
    return this.realTransport.isSupported();
  }

  public getStatus(): SerialStatus {
    return { ...this.status };
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private updateStatus(patch: Partial<SerialStatus>) {
    this.status = { ...this.status, ...patch };
    for (const listener of this.listeners) {
      listener(this.getStatus());
    }
  }

  public setMockMode(enabled: boolean) {
    const previousMockMode = this.isMockMode;
    this.isMockMode = enabled;

    if (enabled && this.status.state === "disconnected") {
      this.activeTransport = this.mockTransport;
      this.updateStatus({
        state: "connected",
        portName: "Virtual COM (Desk Simulator)",
        errorMessage: undefined,
      });
    } else if (!enabled && previousMockMode) {
      this.activeTransport = null;
      this.updateStatus({
        state: "disconnected",
        portName: undefined,
      });
    }
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      // Fall back to virtual mode seamlessly
      this.setMockMode(true);
      return true;
    }

    try {
      this.updateStatus({ state: "connecting", errorMessage: undefined });
      const result = await this.realTransport.connect(baudRate);
      this.activeTransport = this.realTransport;
      this.isMockMode = false;
      this.updateStatus({
        state: "connected",
        portName: result.portName,
        errorMessage: undefined,
      });
      return true;
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        // User cancelled picker dialog
        this.updateStatus({ state: "disconnected" });
      } else {
        this.updateStatus({
          state: "error",
          errorMessage: err.message || "Failed to connect serial port",
        });
      }
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isMockMode) {
      this.setMockMode(false);
      return;
    }

    try {
      if (this.activeTransport) {
        await this.activeTransport.disconnect();
        this.activeTransport = null;
      }
    } catch (e) {
      logger.warn("Error closing serial port:", e);
    } finally {
      this.updateStatus({
        state: "disconnected",
        portName: undefined,
        bytesTransferred: 0,
        totalBytes: 0,
        progressPercent: 0,
      });
    }
  }

  public async sendPing(): Promise<boolean> {
    if (this.status.state !== "connected") return false;
    const packet = buildPingPacket();
    return this.sendRawBytes(packet);
  }

  public async sendBitmap(
    width: number,
    height: number,
    bitmapData: Uint8Array
  ): Promise<boolean> {
    const packet = buildBitmapPacket(width, height, bitmapData);
    return this.sendRawBytes(packet);
  }

  private async sendRawBytes(data: Uint8Array): Promise<boolean> {
    const totalBytes = data.length;
    this.updateStatus({
      state: "transmitting",
      totalBytes,
      bytesTransferred: 0,
      progressPercent: 0,
    });

    const transport = this.activeTransport || (this.isMockMode ? this.mockTransport : null);

    if (!transport) {
      this.updateStatus({
        state: "error",
        errorMessage: "No active serial transport connected",
      });
      return false;
    }

    try {
      await transport.write(data, (bytesTransferred, total) => {
        const progress = Math.round((bytesTransferred / total) * 100);
        this.updateStatus({
          bytesTransferred,
          progressPercent: progress,
        });
      });

      this.updateStatus({
        state: "connected",
        bytesTransferred: totalBytes,
        progressPercent: 100,
      });
      return true;
    } catch (err: any) {
      logger.error("Serial transmission error:", err);
      this.updateStatus({
        state: "error",
        errorMessage: err.message || "Failed to send data over serial",
      });
      return false;
    }
  }
}

export const serialManager = new SerialManager();
