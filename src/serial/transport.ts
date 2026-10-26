export interface SerialTransportConnectResult {
  portName?: string;
}

export interface SerialTransport {
  isSupported(): boolean;
  connect(baudRate: number): Promise<SerialTransportConnectResult>;
  disconnect(): Promise<void>;
  write(
    data: Uint8Array,
    onProgress?: (bytesTransferred: number, totalBytes: number) => void
  ): Promise<void>;
}
