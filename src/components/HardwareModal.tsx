import React, { useState, useEffect } from "react";
import { HardwareSettings } from "../types/note";
import { serialManager, SerialStatus } from "../serial/serialManager";
import { SettingsTab } from "./SettingsTab";
import { WiringTab } from "./WiringTab";
import { Cpu, X, BookOpen } from "lucide-react";

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
            <SettingsTab
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              serialStatus={serialStatus}
              onConnectPort={handleConnectPort}
              onDisconnectPort={handleDisconnectPort}
              onTestPing={handleTestPing}
              pingResult={pingResult}
            />
          ) : (
            <WiringTab />
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
