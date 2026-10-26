import { SerialTransport, SerialTransportConnectResult } from "./transport";
import { logger } from "../utils/logger";

export class WebSerialTransport implements SerialTransport {
  private port: any = null;
  private writer: any = null;

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  public async connect(baudRate: number): Promise<SerialTransportConnectResult> {
    if (!this.isSupported()) {
      throw new Error("Web Serial API is not supported in this environment");
    }

    const navSerial = (navigator as any).serial;
    this.port = await navSerial.requestPort();
    await this.port.open({ baudRate });

    const info = this.port.getInfo ? this.port.getInfo() : {};
    const portName = info.usbVendorId
      ? `USB Device (VID: 0x${info.usbVendorId.toString(16)})`
      : "Connected USB Serial Port";

    return { portName };
  }

  public async disconnect(): Promise<void> {
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
      logger.warn("Error closing serial port:", e);
    }
  }

  public async write(
    data: Uint8Array,
    onProgress?: (bytesTransferred: number, totalBytes: number) => void
  ): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error("Serial port is not writable or not connected");
    }

    const totalBytes = data.length;
    const chunkSize = 512;
    let sent = 0;

    const writer = this.port.writable.getWriter();
    this.writer = writer;

    try {
      for (let offset = 0; offset < totalBytes; offset += chunkSize) {
        const chunk = data.subarray(
          offset,
          Math.min(offset + chunkSize, totalBytes)
        );
        await writer.write(chunk);
        sent += chunk.length;
        if (onProgress) {
          onProgress(sent, totalBytes);
        }
        // Tiny 5ms delay to prevent buffer overrun on microcontrollers
        await new Promise((r) => setTimeout(r, 5));
      }
    } finally {
      writer.releaseLock();
      this.writer = null;
    }
  }
}
