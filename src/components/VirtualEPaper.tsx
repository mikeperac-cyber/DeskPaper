import React, { useState, useEffect, useRef } from "react";
import { Note, HardwareSettings, DISPLAY_PRESETS } from "../types/note";
import { renderNoteToBuffer, RenderResult } from "../engine/rasterizer";
import { serialManager, SerialStatus } from "../serial/serialManager";
import { logger } from "../utils/logger";
import {
  Monitor,
  RefreshCw,
  PowerOff,
  Maximize2,
  Minimize2,
  Layers,
} from "lucide-react";

interface VirtualEPaperProps {
  note: Note | null;
  settings: HardwareSettings;
  onOpenHardwareModal: () => void;
}

export const VirtualEPaper: React.FC<VirtualEPaperProps> = ({
  note,
  settings,
  onOpenHardwareModal,
}) => {
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [serialStatus, setSerialStatus] = useState<SerialStatus>(
    serialManager.getStatus()
  );
  const lastRenderedNoteRef = useRef<string>("");

  useEffect(() => {
    const unsubscribe = serialManager.subscribe(setSerialStatus);
    return () => unsubscribe();
  }, []);

  // Re-render bitmap when note or hardware settings change
  useEffect(() => {
    if (!note) {
      setRenderResult(null);
      return;
    }

    try {
      const result = renderNoteToBuffer(note, settings);
      setRenderResult(result);

      // Trigger flash animation if note content changed or explicit refresh
      const noteSignature = `${note.id}_${note.updatedAt}_${settings.orientation}_${settings.selectedModel}_${settings.invertColors}`;
      if (lastRenderedNoteRef.current && lastRenderedNoteRef.current !== noteSignature) {
        setIsFlashing(true);
        const timer = setTimeout(() => setIsFlashing(false), 850);
        lastRenderedNoteRef.current = noteSignature;
        return () => clearTimeout(timer);
      }
      lastRenderedNoteRef.current = noteSignature;
    } catch (err) {
      logger.error("Failed to render note to E-Paper buffer", err);
    }
  }, [note, settings]);

  const handleManualFlash = async () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 850);

    if (renderResult && serialStatus.state === "connected") {
      await serialManager.sendBitmap(
        renderResult.width,
        renderResult.height,
        renderResult.packedBuffer
      );
    }
  };

  const preset = DISPLAY_PRESETS[settings.selectedModel];
  const targetWidth =
    settings.orientation === "landscape" ? preset.width : preset.height;
  const targetHeight =
    settings.orientation === "landscape" ? preset.height : preset.width;

  return (
    <div className="flex flex-col h-full bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Simulator Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-zinc-800 rounded-xl text-amber-400 border border-zinc-700/60 shadow-inner">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                Desk Companion Simulator
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero-Power Live
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Exact 1-bit bi-stable E-Ink mirror ({targetWidth}×{targetHeight}px)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleManualFlash}
            title="Trigger E-Ink Refresh Flash"
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isFlashing ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse View" : "Expand View"}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main E-Ink Display Frame Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0 overflow-hidden">
        {/* Physical Device Shell Bezel */}
        <div
          className={`relative w-full max-w-[330px] transition-all duration-300 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 p-3.5 shadow-2xl border border-zinc-700/60 flex flex-col items-center shrink-0 ${
            isExpanded ? "scale-105" : ""
          }`}
        >
          {/* Subtle desk stand bracket reflection top */}
          <div className="w-14 h-1 bg-zinc-700/60 rounded-full mb-2" />

          {/* E-Paper Screen Surface */}
          <div
            style={{
              aspectRatio: `${targetWidth} / ${targetHeight}`,
            }}
            className={`relative w-full max-h-[260px] overflow-hidden rounded-md border-2 border-stone-400/80 shadow-inner e-paper-screen transition-all select-none flex items-center justify-center ${
              isFlashing ? "animate-epaper-flash" : ""
            }`}
          >
            {renderResult ? (
              <img
                src={renderResult.dataUrl}
                alt="E-Paper Note Preview"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 p-6 text-center">
                <Layers className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-xs font-mono">No active note selected</span>
              </div>
            )}

            {/* Subtle paper texture overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/[0.03] to-transparent" />
          </div>

          {/* Device Brand Badge & Status LED */}
          <div className="w-full flex items-center justify-between mt-3 px-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] tracking-widest font-mono text-zinc-400 uppercase font-semibold">
                DeskPaper EPD
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {settings.selectedModel}&quot; {settings.orientation}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Connection Banner & Zero-Power Notice */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
        <div
          onClick={onOpenHardwareModal}
          className="flex items-center gap-2 cursor-pointer group hover:opacity-90"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              serialStatus.state === "connected"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                : serialStatus.state === "transmitting"
                ? "bg-amber-400 animate-ping"
                : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-300 font-mono text-[11px] group-hover:text-amber-300 transition">
            {serialStatus.state === "connected"
              ? serialStatus.portName || "USB Serial Connected"
              : serialStatus.state === "transmitting"
              ? `Flashing e-ink (${serialStatus.progressPercent}%)...`
              : "USB E-Paper Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <PowerOff className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] text-zinc-500 font-medium">
            Note stays on screen when PC shuts off
          </span>
        </div>
      </div>
    </div>
  );
};
