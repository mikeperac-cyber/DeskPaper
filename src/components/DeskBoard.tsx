import React from "react";
import { Note, HardwareSettings, NoteColor } from "../types/note";
import { FloatingNote } from "./FloatingNote";
import { VirtualEPaper } from "./VirtualEPaper";
import { CheckSquare, FileText, ArrowLeft, Settings as SettingsIcon } from "lucide-react";

interface DeskBoardProps {
  notes: Note[];
  castedNote: Note | null;
  settings: HardwareSettings;
  onSelectNote: (id: string) => void;
  onAddNote: (mode?: "markdown" | "checklist", color?: NoteColor) => Note;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onTogglePin: (id: string) => void;
  onCastNote: (id: string) => void;
  onOpenHardwareModal: () => void;
  onSwitchToStudio: () => void;
}

export const DeskBoard: React.FC<DeskBoardProps> = ({
  notes,
  castedNote,
  settings,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onTogglePin,
  onCastNote,
  onOpenHardwareModal,
  onSwitchToStudio,
}) => {
  return (
    <div className="relative w-screen h-screen bg-[#18191e] overflow-hidden select-none">
      {/* Subtle desk mat grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Floating Top Control Bar */}
      <header className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-1.5 px-3 rounded-2xl shadow-2xl">
          <button
            onClick={onSwitchToStudio}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Workspace</span>
          </button>
          <div className="h-4 w-px bg-zinc-700/60" />
          <span className="text-xs font-bold text-zinc-300">
            Desk Corkboard
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            Drag stickies freely anywhere
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-1.5 rounded-2xl shadow-2xl">
          <button
            onClick={() => onAddNote("checklist", "yellow")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/20"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>+ Checklist Sticky</span>
          </button>
          <button
            onClick={() => onAddNote("markdown", "green")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition border border-zinc-700/60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>+ Markdown Sticky</span>
          </button>
          <button
            onClick={onOpenHardwareModal}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
            title="Hardware Configuration"
          >
            <SettingsIcon className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Floating E-Paper Desk Display in Top-Right */}
      <div className="absolute top-20 right-6 z-20 w-80 shadow-2xl">
        <VirtualEPaper
          note={castedNote}
          settings={settings}
          onOpenHardwareModal={onOpenHardwareModal}
        />
      </div>

      {/* Interactive Floating Notes */}
      {notes.map((note, index) => {
        // Default scattered coordinates on the desk if not set
        const defaultX = 60 + (index % 3) * 310;
        const defaultY = 90 + Math.floor(index / 3) * 260;
        const noteWithPos = {
          ...note,
          position: note.position || { x: defaultX, y: defaultY },
        };

        return (
          <FloatingNote
            key={note.id}
            note={noteWithPos}
            onUpdateNote={onUpdateNote}
            onClose={(id) => onTogglePin(id)}
            onCastNote={onCastNote}
            onSelect={onSelectNote}
            isCasted={castedNote?.id === note.id}
          />
        );
      })}
    </div>
  );
};
