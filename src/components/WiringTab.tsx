import React from "react";

export const WiringTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed">
        Connect your standard 8-pin Waveshare E-Paper display header directly
        to your microcontroller SPI pins. Both 3.3V power and logic are
        supported.
      </div>

      {/* Pinout Table */}
      <div className="overflow-hidden border border-zinc-800 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-zinc-800/60 text-zinc-300 font-semibold">
            <tr>
              <th className="p-3">EPD Pin</th>
              <th className="p-3">Function</th>
              <th className="p-3">ESP32 (Standard)</th>
              <th className="p-3">Raspberry Pi Pico (RP2040)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 font-mono text-zinc-400">
            <tr>
              <td className="p-3 font-semibold text-zinc-200">VCC</td>
              <td className="p-3">3.3V Power</td>
              <td className="p-3 text-amber-400">3V3</td>
              <td className="p-3 text-amber-400">3V3 (Pin 36)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">GND</td>
              <td className="p-3">Ground</td>
              <td className="p-3 text-amber-400">GND</td>
              <td className="p-3 text-amber-400">GND (Pin 38)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">DIN / MOSI</td>
              <td className="p-3">SPI MOSI</td>
              <td className="p-3 text-amber-400">GPIO 23</td>
              <td className="p-3 text-amber-400">GP11 (Pin 15)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">CLK / SCK</td>
              <td className="p-3">SPI Clock</td>
              <td className="p-3 text-amber-400">GPIO 18</td>
              <td className="p-3 text-amber-400">GP10 (Pin 14)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">CS</td>
              <td className="p-3">Chip Select</td>
              <td className="p-3 text-amber-400">GPIO 5</td>
              <td className="p-3 text-amber-400">GP9 (Pin 12)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">DC</td>
              <td className="p-3">Data / Command</td>
              <td className="p-3 text-amber-400">GPIO 17</td>
              <td className="p-3 text-amber-400">GP8 (Pin 11)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">RST</td>
              <td className="p-3">Hardware Reset</td>
              <td className="p-3 text-amber-400">GPIO 16</td>
              <td className="p-3 text-amber-400">GP12 (Pin 16)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-zinc-200">BUSY</td>
              <td className="p-3">Busy Status Flag</td>
              <td className="p-3 text-amber-400">GPIO 4</td>
              <td className="p-3 text-amber-400">GP13 (Pin 17)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-xs text-zinc-400 space-y-2">
        <h4 className="font-semibold text-zinc-200">Firmware Flashing:</h4>
        <p>1. Open Arduino IDE or VS Code with PlatformIO.</p>
        <p>
          2. Open the ready-to-flash sketch in{" "}
          <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">
            firmware/esp32_epaper/esp32_epaper.ino
          </code>{" "}
          or{" "}
          <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">
            firmware/pico_epaper/pico_epaper.ino
          </code>
        </p>
        <p>3. Select your board, COM port, and click Upload.</p>
      </div>
    </div>
  );
};
