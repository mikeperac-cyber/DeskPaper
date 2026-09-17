import { buildBitmapPacket, buildPingPacket } from "./protocol";

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

class SerialManager {
  private port: any = null;
  private writer: any = null;
  private listeners: Set<StatusListener> = new Set();
  private isMockMode: boolean = false;

  private status: SerialStatus = {
    state: "disconnected",
    bytesTransferred: 0,
    totalBytes: 0,
    progressPercent: 0,
  };

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator;
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
    this.isMockMode = enabled;
    if (enabled && this.status.state === "disconnected") {
      this.updateStatus({
        state: "connected",
        portName: "Virtual COM (Desk Simulator)",
        errorMessage: undefined,
      });
    } else if (!enabled && this.isMockMode) {
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
      const navSerial = (navigator as any).serial;
      this.port = await navSerial.requestPort();
      await this.port.open({ baudRate });

      const info = this.port.getInfo ? this.port.getInfo() : {};
      const portName = info.usbVendorId
        ? `USB Device (VID: 0x${info.usbVendorId.toString(16)})`
        : "Connected USB Serial Port";

      this.isMockMode = false;
      this.updateStatus({
        state: "connected",
        portName,
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
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.warn("Error closing serial port:", e);
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

    if (this.isMockMode || !this.port) {
      // Simulate physical serial transfer timing (in ~512 byte chunks)
      const chunkSize = 512;
      let sent = 0;
      while (sent < totalBytes) {
        const nextChunk = Math.min(chunkSize, totalBytes - sent);
        sent += nextChunk;
        const progress = Math.round((sent / totalBytes) * 100);
        this.updateStatus({
          bytesTransferred: sent,
          progressPercent: progress,
        });
        await new Promise((r) => setTimeout(r, 20)); // realistic transfer delay
      }

      await new Promise((r) => setTimeout(r, 100)); // E-paper refresh time
      this.updateStatus({
        state: "connected",
        bytesTransferred: totalBytes,
        progressPercent: 100,
      });
      return true;
    }

    try {
      const writer = this.port.writable.getWriter();
      const chunkSize = 512;
      let sent = 0;

      for (let offset = 0; offset < totalBytes; offset += chunkSize) {
        const chunk = data.subarray(
          offset,
          Math.min(offset + chunkSize, totalBytes)
        );
        await writer.write(chunk);
        sent += chunk.length;
        const progress = Math.round((sent / totalBytes) * 100);
        this.updateStatus({
          bytesTransferred: sent,
          progressPercent: progress,
        });
        // Tiny 5ms delay to prevent buffer overrun on microcontrollers
        await new Promise((r) => setTimeout(r, 5));
      }

      writer.releaseLock();
      this.updateStatus({
        state: "connected",
        bytesTransferred: totalBytes,
        progressPercent: 100,
      });
      return true;
    } catch (err: any) {
      console.error("Serial transmission error:", err);
      this.updateStatus({
        state: "error",
        errorMessage: err.message || "Failed to send data over serial",
      });
      return false;
    }
  }
}

export const serialManager = new SerialManager();
