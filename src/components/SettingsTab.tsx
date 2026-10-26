import React from "react";
import { HardwareSettings, DisplayModel, DISPLAY_PRESETS } from "../types/note";
import { SerialStatus } from "../serial/serialManager";
import { Usb, CheckCircle2, XCircle } from "lucide-react";

interface SettingsTabProps {
  settings: HardwareSettings;
  onUpdateSettings: (patch: Partial<HardwareSettings>) => void;
  serialStatus: SerialStatus;
  onConnectPort: () => void;
  onDisconnectPort: () => void;
  onTestPing: () => void;
  pingResult: string | null;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  serialStatus,
  onConnectPort,
  onDisconnectPort,
  onTestPing,
  pingResult,
}) => {
  return (
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
                  ? onDisconnectPort
                  : onConnectPort
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
              onClick={onTestPing}
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
  );
};
