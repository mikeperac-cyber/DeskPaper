// Automated test for DeskPaper framing protocol and math
import {
  SYNC_BYTE_1,
  SYNC_BYTE_2,
  CMD_PING,
  CMD_DRAW_BITMAP,
  calculateCRC16,
  buildBitmapPacket,
} from "../src/serial/protocol.ts";

console.log("Running DeskPaper Protocol & Math Verification...");

// 1. Verify 4.2" Display dimensions (400x300)
const width42 = 400;
const height42 = 300;
const expectedByteLength42 = (width42 * height42) / 8;
if (expectedByteLength42 !== 15000) {
  throw new Error("4.2 inch byte length mismatch: expected 15000, got " + expectedByteLength42);
}
console.log("✓ 4.2-inch resolution (400x300): exactly " + expectedByteLength42 + " bytes (1-bit packed)");

// 2. Verify 2.9" Display dimensions (296x128)
const width29 = 296;
const height29 = 128;
const expectedByteLength29 = (width29 * height29) / 8;
if (expectedByteLength29 !== 4736) {
  throw new Error("2.9 inch byte length mismatch: expected 4736, got " + expectedByteLength29);
}
console.log("✓ 2.9-inch resolution (296x128): exactly " + expectedByteLength29 + " bytes (1-bit packed)");

// 3. Verify Packet Framing and CRC16
const dummyBuffer = new Uint8Array(15000);
for (let i = 0; i < dummyBuffer.length; i++) {
  dummyBuffer[i] = i % 256;
}
const packet = buildBitmapPacket(400, 300, dummyBuffer);

if (packet.length !== 15011) {
  throw new Error("Packet length mismatch: expected 15011, got " + packet.length);
}
if (packet[0] !== SYNC_BYTE_1 || packet[1] !== SYNC_BYTE_2) {
  throw new Error("Sync bytes mismatch");
}
if (packet[2] !== CMD_DRAW_BITMAP) {
  throw new Error("Command byte mismatch");
}
console.log("✓ Packet framing verified: Header(9) + Payload(15000) + CRC(2) = 15011 bytes total");

// 4. Verify CRC validation
const headerAndPayload = packet.subarray(0, 15009);
const computedCrc = calculateCRC16(headerAndPayload);
const packetCrc = (packet[15009] << 8) | packet[15010];
if (computedCrc !== packetCrc) {
  throw new Error("CRC mismatch: computed " + computedCrc + ", in packet " + packetCrc);
}
console.log("✓ CRC16 integrity verified: 0x" + computedCrc.toString(16).toUpperCase());

console.log("ALL PROTOCOL CHECKS PASSED SUCCESSFULLY!");
