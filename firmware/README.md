# DeskPaper Hardware Companion & Firmware Guide

DeskPaper pairs your desktop sticky notes with a physical, zero-power **E-Paper (E-Ink) desk display**.

Because E-Paper uses **bi-stable electrophoretic display technology**, tiny titanium dioxide (white) and carbon (black) microcapsules physically move and remain trapped in their positions. Once an image is rendered, **it consumes 0.00 watts of power and will retain your note on your desk indefinitely**, even when your computer is shut down or the USB cable is completely unplugged.

---

## 1. Bill of Materials (BOM)

| Component | Recommended Model | Approx Cost | Notes |
|---|---|---|---|
| **E-Paper Display** | Waveshare 4.2inch E-Paper Module (Black/White, 400x300) | ~$25 - $32 | Classic square sticky note aspect ratio |
| **Alternative Display** | Waveshare 2.9inch E-Paper Module (296x128) | ~$15 - $20 | Compact desk badge form factor |
| **Microcontroller** | ESP32 NodeMCU / DevKit V1 OR Raspberry Pi Pico (RP2040) | ~$4 - $6 | Standard USB-C/Micro-USB interface |
| **Cable** | USB-A to USB-C or Micro-USB | ~$3 | Plugs directly into your PC |

---

## 2. Pinout & Wiring Schematics

Waveshare displays include an 8-pin color-coded jumper cable. Connect the wires as shown below:

### Option A: ESP32 Wiring
| E-Paper Pin | Wire Color | ESP32 Pin | Description |
|---|---|---|---|
| **VCC** | Red | **3V3** | 3.3V Power |
| **GND** | Black | **GND** | Ground |
| **DIN** | Blue | **GPIO 23** | SPI MOSI |
| **CLK** | Yellow | **GPIO 18** | SPI Clock (SCK) |
| **CS** | Orange | **GPIO 5** | SPI Chip Select |
| **DC** | Green | **GPIO 17** | Data / Command Control |
| **RST** | White | **GPIO 16** | Hardware Reset |
| **BUSY** | Purple | **GPIO 4** | Display Busy Status |

---

### Option B: Raspberry Pi Pico (RP2040) Wiring
| E-Paper Pin | Wire Color | Pico Physical Pin | Pico GPIO |
|---|---|---|---|
| **VCC** | Red | **Pin 36** | 3V3(OUT) |
| **GND** | Black | **Pin 38** | GND |
| **DIN** | Blue | **Pin 15** | GP11 (SPI1 TX) |
| **CLK** | Yellow | **Pin 14** | GP10 (SPI1 SCK) |
| **CS** | Orange | **Pin 12** | GP9 (SPI1 CSn) |
| **DC** | Green | **Pin 11** | GP8 |
| **RST** | White | **Pin 16** | GP12 |
| **BUSY** | Purple | **Pin 17** | GP13 |

---

## 3. Firmware Flashing Instructions

### Using Arduino IDE:
1. Download and install [Arduino IDE](https://www.arduino.cc/en/software).
2. Install board support:
   - For **ESP32**: Open *Preferences* -> add `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` to *Additional Boards Manager URLs*, then install **esp32** by Espressif in the Boards Manager.
   - For **Pico**: Install **Raspberry Pi Pico/RP2040** by Earle F. Philhower.
3. In *Library Manager* (Ctrl+Shift+I), search for and install:
   - **GxEPD2** by Jean-Marc Zingg
4. Open either:
   - `firmware/esp32_epaper/esp32_epaper.ino` (for ESP32)
   - `firmware/pico_epaper/pico_epaper.ino` (for Pico)
5. Connect your board via USB, select the COM port in Arduino IDE, and click **Upload**.
6. Once uploaded, the screen will flash once and display:
   `"DeskPaper Ready - Waiting for PC connection on USB Serial..."`

---

## 4. Connecting the Desktop App

1. In the DeskPaper Studio app, click **Hardware & E-Paper** in the top-right header (or open the Hardware panel).
2. Click **Connect USB E-Paper**.
3. Select your microcontroller\x27s USB COM port in the browser/app picker.
4. Click **Cast to Desk** on any note! Your e-paper will refresh with authentic electrophoretic microcapsule flipping, and retain that note permanently on your desk!
