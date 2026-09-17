/**
 * DeskPaper ESP32 Firmware
 * 
 * Hardware:
 *  - ESP32 NodeMCU / DevKit V1
 *  - Waveshare 4.2inch / 2.9inch / 2.13inch E-Paper Module (SPI)
 * 
 * Pinout:
 *  - EPD VCC   -> ESP32 3V3
 *  - EPD GND   -> ESP32 GND
 *  - EPD DIN   -> ESP32 GPIO 23 (MOSI)
 *  - EPD CLK   -> ESP32 GPIO 18 (SCK)
 *  - EPD CS    -> ESP32 GPIO 5
 *  - EPD DC    -> ESP32 GPIO 17
 *  - EPD RST   -> ESP32 GPIO 16
 *  - EPD BUSY  -> ESP32 GPIO 4
 * 
 * Dependencies:
 *  - Install "GxEPD2" from Arduino Library Manager
 */

#include <Arduino.h>
#include <GxEPD2_BW.h>

// Pins for Waveshare EPD on standard ESP32
#define EPD_CS    5
#define EPD_DC    17
#define EPD_RST   16
#define EPD_BUSY  4

// Display Driver (Uncomment your exact display model)
// Default: Waveshare 4.2" Black/White (400x300)
GxEPD2_BW<GxEPD2_420_GDEY042T81, GxEPD2_420_GDEY042T81::HEIGHT> display(
    GxEPD2_420_GDEY042T81(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY)
);
// For 2.9" (296x128), use:
// GxEPD2_BW<GxEPD2_290_T94_V2, GxEPD2_290_T94_V2::HEIGHT> display(
//     GxEPD2_290_T94_V2(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY)
// );

#define SYNC_BYTE_1 0xAA
#define SYNC_BYTE_2 0x55
#define CMD_PING 0x01
#define CMD_CLEAR 0x02
#define CMD_DRAW_BITMAP 0x10

#define MAX_BUFFER_SIZE 16000
uint8_t rxBuffer[MAX_BUFFER_SIZE];

uint16_t calculateCRC16(const uint8_t *data, size_t length) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < length; i++) {
    crc ^= ((uint16_t)data[i]) << 8;
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return crc;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  display.init(115200, true, 2, false);
  display.setRotation(0); // 0 = landscape, 1 = portrait

  // Draw initial boot splash
  display.firstPage();
  do {
    display.fillScreen(GxEPD_WHITE);
    display.setTextColor(GxEPD_BLACK);
    display.setTextSize(2);
    display.setCursor(30, 100);
    display.print("DeskPaper Ready");
    display.setTextSize(1);
    display.setCursor(30, 140);
    display.print("Waiting for PC connection on USB Serial...");
  } while (display.nextPage());

  display.powerOff();
  Serial.println("DeskPaper ESP32 Ready");
}

void loop() {
  if (Serial.available() >= 2) {
    if (Serial.read() == SYNC_BYTE_1 && Serial.peek() == SYNC_BYTE_2) {
      Serial.read(); // consume SYNC_BYTE_2

      while (Serial.available() < 7) { delay(1); } // wait for remaining header

      uint8_t cmd = Serial.read();
      uint16_t width = (Serial.read() << 8) | Serial.read();
      uint16_t height = (Serial.read() << 8) | Serial.read();
      uint16_t payloadLen = (Serial.read() << 8) | Serial.read();

      if (cmd == CMD_PING) {
        Serial.write(0x06); // ACK
        return;
      }

      if (cmd == CMD_DRAW_BITMAP) {
        if (payloadLen > MAX_BUFFER_SIZE) {
          Serial.write(0x15); // NAK - buffer overflow
          return;
        }

        // Read payload bytes
        size_t bytesRead = 0;
        unsigned long startTime = millis();
        while (bytesRead < payloadLen && millis() - startTime < 5000) {
          if (Serial.available()) {
            rxBuffer[bytesRead++] = Serial.read();
          }
        }

        while (Serial.available() < 2) { delay(1); }
        uint16_t rxCrc = (Serial.read() << 8) | Serial.read();

        // Reconstruct header + payload for CRC verification
        uint8_t headerCheck[9];
        headerCheck[0] = SYNC_BYTE_1;
        headerCheck[1] = SYNC_BYTE_2;
        headerCheck[2] = cmd;
        headerCheck[3] = (width >> 8) & 0xFF;
        headerCheck[4] = width & 0xFF;
        headerCheck[5] = (height >> 8) & 0xFF;
        headerCheck[6] = height & 0xFF;
        headerCheck[7] = (payloadLen >> 8) & 0xFF;
        headerCheck[8] = payloadLen & 0xFF;

        uint16_t calcCrc = 0xFFFF;
        // CRC over header
        for (int i = 0; i < 9; i++) {
          calcCrc ^= ((uint16_t)headerCheck[i]) << 8;
          for (uint8_t j = 0; j < 8; j++) {
            if (calcCrc & 0x8000) calcCrc = (calcCrc << 1) ^ 0x1021;
            else calcCrc <<= 1;
          }
        }
        // CRC over payload
        for (size_t i = 0; i < payloadLen; i++) {
          calcCrc ^= ((uint16_t)rxBuffer[i]) << 8;
          for (uint8_t j = 0; j < 8; j++) {
            if (calcCrc & 0x8000) calcCrc = (calcCrc << 1) ^ 0x1021;
            else calcCrc <<= 1;
          }
        }

        if (calcCrc != rxCrc) {
          Serial.write(0x15); // NAK - CRC error
          return;
        }

        // Render full 1-bit bitmap to display
        display.firstPage();
        do {
          display.fillScreen(GxEPD_WHITE);
          // GxEPD2 drawBitmap: 0 = black, 1 = white
          display.drawBitmap(0, 0, rxBuffer, width, height, GxEPD_BLACK);
        } while (display.nextPage());

        // Zero-power sleep: display retains image indefinitely!
        display.powerOff();
        Serial.write(0x06); // ACK success
      }
    }
  }
}
