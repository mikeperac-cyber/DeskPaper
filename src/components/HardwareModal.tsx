import React, { useState, useEffect } from "react";
import { HardwareSettings, DisplayModel, DISPLAY_PRESETS } from "../types/note";
import { serialManager, SerialStatus } from "../serial/serialManager";
import {
  Usb,
  Cpu,
  RotateCw,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Send,
  Zap,
  HelpCircle,
  BookOpen,
} from "lucide-react";

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HardwareSettings;
  onUpdateSettings: (patch: Partial<HardwareSettings>) => void;
}

export const HardwareModal: React.FC<HardwareModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [serialStatus, setSerialStatus] = useState<SerialStatus>(
    serialManager.getStatus()
  );
  const [activeTab, setActiveTab] = useState<"settings" | "wiring">("settings");
  const [pingResult, setPingResult] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = serialManager.subscribe(setSerialStatus);
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleConnectPort = async () => {
    await serialManager.connect(settings.baudRate);
  };

  const handleDisconnectPort = async () => {
    await serialManager.disconnect();
  };

  const handleTestPing = async () => {
    setPingResult("Sending ping...");
    const success = await serialManager.sendPing();
    setPingResult(success ? "Ping ACK received!" : "Ping failed (check connection)");
    setTimeout(() => setPingResult(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Hardware & Display Configuration
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your Waveshare E-Paper desk display & USB serial port
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-zinc-800/80 bg-zinc-900/50">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === "settings"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Display & Connection
          </button>
          <button
            onClick={() => setActiveTab("wiring")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === "wiring"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Wiring & Pinout Schematics
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "settings" ? (
            <>
              {/* USB Connection Card */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Usb className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-zinc-200">
                      USB Serial Connection
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {serialStatus.state === "connected" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : serialStatus.state === "error" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Disconnected
                      </span>
                    )}
                  </div>
                </div>

                {serialStatus.portName && (
                  <p className="text-xs font-mono text-zinc-400">
                    Port: {serialStatus.portName}
                  </p>
                )}

                {serialStatus.errorMessage && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    {serialStatus.errorMessage}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={
                        serialStatus.state === "connected"
                          ? handleDisconnectPort
                          : handleConnectPort
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        serialStatus.state === "connected"
                          ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20"
                      }`}
                    >
                      {serialStatus.state === "connected"
                        ? "Disconnect Port"
                        : "Connect USB E-Paper"}
                    </button>

                    <button
                      onClick={handleTestPing}
                      disabled={serialStatus.state !== "connected"}
                      className="px-3 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition"
                    >
                      Test Ping
                    </button>

                    {pingResult && (
                      <span className="text-xs text-amber-400 font-mono">
                        {pingResult}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Baud:</span>
                    <select
                      value={settings.baudRate}
                      onChange={(e) =>
                        onUpdateSettings({ baudRate: Number(e.target.value) })
                      }
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="115200">115200 (Default)</option>
                      <option value="230400">230400 (Fast)</option>
                      <option value="57600">57600</option>
                      <option value="9600">9600</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Model Preset */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Select E-Paper Display Model
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["4.2", "2.9", "2.13"] as DisplayModel[]).map((model) => {
                    const preset = DISPLAY_PRESETS[model];
                    const isSelected = settings.selectedModel === model;
                    return (
                      <div
                        key={model}
                        onClick={() => onUpdateSettings({ selectedModel: model })}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10"
                            : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-zinc-100">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                          {preset.description}
                        </p>
                        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                          {preset.width} × {preset.height} px
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Orientation & Dithering Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Orientation */}
                <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Display Orientation
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onUpdateSettings({ orientation: "landscape" })}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${
                        settings.orientation === "landscape"
                          ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold"
                          : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      Landscape (Horizontal)
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ orientation: "portrait" })}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${
                        settings.orientation === "portrait"
                          ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold"
                          : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      Portrait (Vertical)
                    </button>
                  </div>
                </div>

                {/* Dithering Mode */}
                <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Pixel Dithering Algorithm
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onUpdateSettings({ ditherMode: "threshold" })}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${
                        settings.ditherMode === "threshold"
                          ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold"
                          : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      Crisp Threshold (High Contrast)
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({ ditherMode: "floyd-steinberg" })
                      }
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${
                        settings.ditherMode === "floyd-steinberg"
                          ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold"
                          : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      Floyd-Steinberg (Smooth Gradients)
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 cursor-pointer">
                  <span className="text-xs text-zinc-300 font-medium">
                    Show Title Header
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.showTitleHeader}
                    onChange={(e) =>
                      onUpdateSettings({ showTitleHeader: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 cursor-pointer">
                  <span className="text-xs text-zinc-300 font-medium">
                    Show Sync Timestamp
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.showSyncTimestamp}
                    onChange={(e) =>
                      onUpdateSettings({ showSyncTimestamp: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 cursor-pointer">
                  <span className="text-xs text-zinc-300 font-medium">
                    Invert Ink (Dark Mode)
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.invertColors}
                    onChange={(e) =>
                      onUpdateSettings({ invertColors: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                </label>
              </div>
            </>
          ) : (
            /* Wiring Schematics Tab */
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed">
                Connect your standard 8-pin Waveshare E-Paper display header
                directly to your microcontroller SPI pins. Both 3.3V power and
                logic are supported.
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
                <p>
                  1. Open Arduino IDE or VS Code with PlatformIO.
                </p>
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
                <p>
                  3. Select your board, COM port, and click Upload.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl text-xs transition shadow-md shadow-amber-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
