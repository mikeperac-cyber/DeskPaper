import { SerialTransport, SerialTransportConnectResult } from "./transport";

export class MockSerialTransport implements SerialTransport {
  private connected: boolean = false;

  public isSupported(): boolean {
    return true;
  }

  public async connect(_baudRate: number): Promise<SerialTransportConnectResult> {
    this.connected = true;
    return {
      portName: "Virtual COM (Desk Simulator)",
    };
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  public async write(
    data: Uint8Array,
    onProgress?: (bytesTransferred: number, totalBytes: number) => void
  ): Promise<void> {
    const totalBytes = data.length;
    const chunkSize = 512;
    let sent = 0;

    while (sent < totalBytes) {
      const nextChunk = Math.min(chunkSize, totalBytes - sent);
      sent += nextChunk;
      if (onProgress) {
        onProgress(sent, totalBytes);
      }
      await new Promise((r) => setTimeout(r, 20)); // realistic transfer delay
    }

    await new Promise((r) => setTimeout(r, 100)); // E-paper refresh time
  }
}
