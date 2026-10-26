import assert from "assert";

const SYNC_BYTE_1 = 0xAA;
const SYNC_BYTE_2 = 0x55;
const CMD_PING = 0x01;
const CMD_DRAW_BITMAP = 0x10;

function calculateCRC16(buffer) {
  let crc = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

function buildPingPacket() {
  const packet = new Uint8Array(5);
  packet[0] = SYNC_BYTE_1;
  packet[1] = SYNC_BYTE_2;
  packet[2] = CMD_PING;
  const crc = calculateCRC16(packet.subarray(0, 3));
  packet[3] = (crc >> 8) & 0xff;
  packet[4] = crc & 0xff;
  return packet;
}

function buildBitmapPacket(width, height, bitmapData) {
  const payloadLen = bitmapData.length;
  const totalLength = 9 + payloadLen + 2;
  const packet = new Uint8Array(totalLength);

  packet[0] = SYNC_BYTE_1;
  packet[1] = SYNC_BYTE_2;
  packet[2] = CMD_DRAW_BITMAP;
  packet[3] = (width >> 8) & 0xff;
  packet[4] = width & 0xff;
  packet[5] = (height >> 8) & 0xff;
  packet[6] = height & 0xff;
  packet[7] = (payloadLen >> 8) & 0xff;
  packet[8] = payloadLen & 0xff;
  packet.set(bitmapData, 9);

  const dataForCrc = packet.subarray(0, 9 + payloadLen);
  const crc = calculateCRC16(dataForCrc);

  packet[9 + payloadLen] = (crc >> 8) & 0xff;
  packet[9 + payloadLen + 1] = crc & 0xff;
  return packet;
}

class TestTransport {
  constructor(supported = true) {
    this.supported = supported;
    this.connected = false;
    this.failConnect = false;
    this.failWrite = false;
    this.writtenData = [];
  }

  isSupported() {
    return this.supported;
  }

  async connect(baudRate) {
    if (this.failConnect) {
      const err = new Error("Connection failed");
      err.name = "CustomError";
      throw err;
    }
    this.connected = true;
    return { portName: `Test Port (${baudRate})` };
  }

  async disconnect() {
    this.connected = false;
  }

  async write(data, onProgress) {
    if (this.failWrite) {
      throw new Error("Write failed");
    }
    this.writtenData.push(data);
    if (onProgress) {
      onProgress(Math.floor(data.length / 2), data.length);
      onProgress(data.length, data.length);
    }
  }
}

class TestSerialManager {
  constructor(realTransport, mockTransport) {
    this.realTransport = realTransport;
    this.mockTransport = mockTransport;
    this.activeTransport = null;
    this.listeners = new Set();
    this.isMockMode = false;
    this.status = {
      state: "disconnected",
      bytesTransferred: 0,
      totalBytes: 0,
      progressPercent: 0,
    };
  }

  isSupported() {
    return this.realTransport.isSupported();
  }

  getStatus() {
    return { ...this.status };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  updateStatus(patch) {
    this.status = { ...this.status, ...patch };
    for (const listener of this.listeners) {
      listener(this.getStatus());
    }
  }

  setMockMode(enabled) {
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

  async connect(baudRate = 115200) {
    if (!this.isSupported()) {
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
    } catch (err) {
      this.updateStatus({
        state: "error",
        errorMessage: err.message || "Failed to connect serial port",
      });
      return false;
    }
  }

  async disconnect() {
    if (this.isMockMode) {
      this.setMockMode(false);
      return;
    }

    try {
      if (this.activeTransport) {
        await this.activeTransport.disconnect();
        this.activeTransport = null;
      }
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

  async sendPing() {
    if (this.status.state !== "connected") return false;
    const packet = buildPingPacket();
    return this.sendRawBytes(packet);
  }

  async sendBitmap(width, height, bitmapData) {
    const packet = buildBitmapPacket(width, height, bitmapData);
    return this.sendRawBytes(packet);
  }

  async sendRawBytes(data) {
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
    } catch (err) {
      this.updateStatus({
        state: "error",
        errorMessage: err.message || "Failed to send data over serial",
      });
      return false;
    }
  }
}

async function runTests() {
  console.log("Running SerialManager transport architecture unit tests...");

  const mockTransport = new TestTransport();
  const realTransport = new TestTransport(true);
  const manager = new TestSerialManager(realTransport, mockTransport);

  let statusHistory = [];
  const unsubscribe = manager.subscribe((status) => {
    statusHistory.push(status);
  });

  assert.strictEqual(manager.getStatus().state, "disconnected");
  assert.strictEqual(statusHistory.length, 1);

  manager.setMockMode(true);
  assert.strictEqual(manager.getStatus().state, "connected");
  assert.strictEqual(manager.getStatus().portName, "Virtual COM (Desk Simulator)");

  const testBitmap = new Uint8Array([1, 2, 3, 4]);
  const sendResult = await manager.sendBitmap(10, 10, testBitmap);
  assert.strictEqual(sendResult, true);
  assert.strictEqual(manager.getStatus().state, "connected");
  assert.strictEqual(manager.getStatus().bytesTransferred, 15);

  await manager.disconnect();
  assert.strictEqual(manager.getStatus().state, "disconnected");

  const connected = await manager.connect(115200);
  assert.strictEqual(connected, true);
  assert.strictEqual(manager.getStatus().state, "connected");
  assert.strictEqual(manager.getStatus().portName, "Test Port (115200)");

  const pingResult = await manager.sendPing();
  assert.strictEqual(pingResult, true);
  assert.strictEqual(realTransport.writtenData.length, 1);

  realTransport.failWrite = true;
  const writeResult = await manager.sendPing();
  assert.strictEqual(writeResult, false);
  assert.strictEqual(manager.getStatus().state, "error");
  assert.strictEqual(manager.getStatus().errorMessage, "Write failed");

  const unsupportedReal = new TestTransport(false);
  const fallbackManager = new TestSerialManager(unsupportedReal, mockTransport);
  const fallbackResult = await fallbackManager.connect(9600);
  assert.strictEqual(fallbackResult, true);
  assert.strictEqual(fallbackManager.getStatus().state, "connected");
  assert.strictEqual(fallbackManager.getStatus().portName, "Virtual COM (Desk Simulator)");

  unsubscribe();
  console.log("ALL SERIAL MANAGER TRANSPORT TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
