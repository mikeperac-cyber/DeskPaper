/**
 * Binary Packet Framing and CRC Protocol for E-Paper Serial Communications
 */

export const SYNC_BYTE_1 = 0xAA;
export const SYNC_BYTE_2 = 0x55;

export const CMD_PING = 0x01;
export const CMD_CLEAR = 0x02;
export const CMD_DRAW_BITMAP = 0x10;

// Precomputed CRC16-CCITT table for polynomial 0x1021
const crcTable = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  let curr = i << 8;
  for (let j = 0; j < 8; j++) {
    if ((curr & 0x8000) !== 0) {
      curr = ((curr << 1) ^ 0x1021) & 0xffff;
    } else {
      curr = (curr << 1) & 0xffff;
    }
  }
  crcTable[i] = curr;
}

/**
 * Standard CRC16-CCITT implementation (polynomial 0x1021) using precomputed lookup table
 */
export function calculateCRC16(buffer: Uint8Array): number {
  let crc = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    const idx = ((crc >> 8) ^ buffer[i]) & 0xff;
    crc = ((crc << 8) ^ crcTable[idx]) & 0xffff;
  }
  return crc;
}

/**
 * Frames a packed 1-bit monochrome bitmap into a complete serial packet:
 * [SYNC1(1)][SYNC2(1)][CMD(1)][WIDTH(2)][HEIGHT(2)][PAYLOAD_LEN(2)][PAYLOAD(N)][CRC16(2)]
 */
export function buildBitmapPacket(
  width: number,
  height: number,
  bitmapData: Uint8Array
): Uint8Array {
  const payloadLen = bitmapData.length;
  // Header: 2 sync + 1 cmd + 2 width + 2 height + 2 len = 9 bytes
  // Footer: 2 bytes CRC16
  const totalLength = 9 + payloadLen + 2;
  const packet = new Uint8Array(totalLength);

  packet[0] = SYNC_BYTE_1;
  packet[1] = SYNC_BYTE_2;
  packet[2] = CMD_DRAW_BITMAP;

  // Width (Big Endian)
  packet[3] = (width >> 8) & 0xff;
  packet[4] = width & 0xff;

  // Height (Big Endian)
  packet[5] = (height >> 8) & 0xff;
  packet[6] = height & 0xff;

  // Payload length (Big Endian)
  packet[7] = (payloadLen >> 8) & 0xff;
  packet[8] = payloadLen & 0xff;

  // Payload
  packet.set(bitmapData, 9);

  // Compute CRC over header + payload (bytes 0 to 9 + payloadLen - 1)
  const dataForCrc = packet.subarray(0, 9 + payloadLen);
  const crc = calculateCRC16(dataForCrc);

  // Append CRC16 (Big Endian)
  packet[9 + payloadLen] = (crc >> 8) & 0xff;
  packet[9 + payloadLen + 1] = crc & 0xff;

  return packet;
}

export function buildPingPacket(): Uint8Array {
  const packet = new Uint8Array(5);
  packet[0] = SYNC_BYTE_1;
  packet[1] = SYNC_BYTE_2;
  packet[2] = CMD_PING;
  packet[3] = 0x00;
  packet[4] = 0x00;
  return packet;
}
