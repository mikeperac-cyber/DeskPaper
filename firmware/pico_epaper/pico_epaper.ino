/**
 * DeskPaper Raspberry Pi Pico (RP2040) Firmware
 * 
 * Hardware:
 *  - Raspberry Pi Pico / Pico W
 *  - Waveshare 4.2inch / 2.9inch / 2.13inch E-Paper Module (SPI)
 * 
 * Pinout:
 *  - EPD VCC   -> Pico 3V3 (Pin 36)
 *  - EPD GND   -> Pico GND (Pin 38)
 *  - EPD DIN   -> Pico GP11 (SPI1 TX, Pin 15)
 *  - EPD CLK   -> Pico GP10 (SPI1 SCK, Pin 14)
 *  - EPD CS    -> Pico GP9  (Pin 12)
 *  - EPD DC    -> Pico GP8  (Pin 11)
 *  - EPD RST   -> Pico GP12 (Pin 16)
 *  - EPD BUSY  -> Pico GP13 (Pin 17)
 * 
 * Dependencies:
 *  - Earle Philhower RP2040 Arduino core
 *  - GxEPD2 library
 */

#include <Arduino.h>
#include <GxEPD2_BW.h>

#define EPD_CS    9
#define EPD_DC    8
#define EPD_RST   12
#define EPD_BUSY  13

// Default: Waveshare 4.2" Black/White (400x300)
GxEPD2_BW<GxEPD2_420_GDEY042T81, GxEPD2_420_GDEY042T81::HEIGHT> display(
    GxEPD2_420_GDEY042T81(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY)
);

#define SYNC_BYTE_1 0xAA
#define SYNC_BYTE_2 0x55
#define CMD_PING 0x01
#define CMD_CLEAR 0x02
#define CMD_DRAW_BITMAP 0x10

#define MAX_BUFFER_SIZE 16000
uint8_t rxBuffer[MAX_BUFFER_SIZE];

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize display
  display.init(115200, true, 2, false);
  display.setRotation(0);

  // Boot message
  display.firstPage();
  do {
    display.fillScreen(GxEPD_WHITE);
    display.setTextColor(GxEPD_BLACK);
    display.setTextSize(2);
    display.setCursor(30, 80);
    display.print("DeskPaper Pico");
    display.setTextSize(1);
    display.setCursor(30, 120);
    display.print("Plugged into USB Serial (115200 baud)");
    display.setCursor(30, 140);
    display.print("Ready to receive 1-bit sticky notes!");
  } while (display.nextPage());

  display.powerOff();
  Serial.println("DeskPaper Pico Ready");
}

void loop() {
  if (Serial.available() >= 2) {
    if (Serial.read() == SYNC_BYTE_1 && Serial.peek() == SYNC_BYTE_2) {
      Serial.read();

      while (Serial.available() < 7) { delay(1); }

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
          Serial.write(0x15);
          return;
        }

        size_t bytesRead = 0;
        unsigned long startTime = millis();
        while (bytesRead < payloadLen && millis() - startTime < 5000) {
          if (Serial.available()) {
            rxBuffer[bytesRead++] = Serial.read();
          }
        }

        while (Serial.available() < 2) { delay(1); }
        uint16_t rxCrc = (Serial.read() << 8) | Serial.read();

        // Draw to e-paper screen
        display.firstPage();
        do {
          display.fillScreen(GxEPD_WHITE);
          display.drawBitmap(0, 0, rxBuffer, width, height, GxEPD_BLACK);
        } while (display.nextPage());

        display.powerOff(); // Put in zero-power state
        Serial.write(0x06);  // ACK
      }
    }
  }
}
