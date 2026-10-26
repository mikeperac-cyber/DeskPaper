import React, { useState } from "react";
import { Note, HardwareSettings, NoteColor } from "../types/note";
import { NoteEditor } from "./NoteEditor";
import { VirtualEPaper } from "./VirtualEPaper";
import { COLOR_THEMES } from "./ColorPicker";
import {
  Search,
  Tv,
  Pin,
  Settings as SettingsIcon,
  CheckSquare,
  FileText,
  Layers,
  LayoutGrid,
} from "lucide-react";

interface StudioDeckProps {
  notes: Note[];
  activeNote: Note | null;
  castedNote: Note | null;
  settings: HardwareSettings;
  onSelectNote: (id: string) => void;
  onAddNote: (mode?: "markdown" | "checklist", color?: NoteColor) => Note;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCastNote: (id: string) => void;
  onOpenHardwareModal: () => void;
  onSwitchToDeskBoard: () => void;
}

export const StudioDeck: React.FC<StudioDeckProps> = ({
  notes,
  activeNote,
  castedNote,
  settings,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onCastNote,
  onOpenHardwareModal,
  onSwitchToDeskBoard,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags || []).filter(Boolean))
  );

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.checklist || []).some((c) =>
        c.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesTag = selectedTag ? (n.tags || []).includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-zinc-800/80 px-4 xl:px-6 flex items-center justify-between bg-zinc-900/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-100 m-0 p-0">
                DeskPaper
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                Studio
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Bar & Mode Switcher */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-zinc-950 rounded-lg text-xs font-semibold shadow"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Studio View</span>
            </button>
            <button
              onClick={onSwitchToDeskBoard}
              className="flex items-center gap-1.5 px-3 py-1 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-medium transition"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Desk Corkboard</span>
            </button>
          </div>

          <button
            onClick={onOpenHardwareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition shrink-0"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Hardware & E-Paper</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: 3 Panes */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Pane: Notes Library */}
        <div className="w-72 shrink-0 border-r border-zinc-800/80 bg-zinc-900/20 flex flex-col min-h-0 overflow-hidden">
          {/* Search and Filter */}
          <div className="p-4 border-b border-zinc-800/60 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes & tasks..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition"
              />
            </div>

            {/* Tags Pills */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full transition whitespace-nowrap ${
                    selectedTag === null
                      ? "bg-amber-500 text-zinc-950 font-semibold"
                      : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All ({notes.length})
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full transition whitespace-nowrap ${
                      selectedTag === tag
                        ? "bg-amber-500 text-zinc-950 font-semibold"
                        : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Add Note Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onAddNote("checklist", "yellow")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl text-xs transition shadow-md shadow-amber-500/10"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>+ Checklist</span>
              </button>
              <button
                onClick={() => onAddNote("markdown", "green")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl text-xs transition border border-zinc-700/60"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>+ Markdown</span>
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredNotes.map((note) => {
              const theme = COLOR_THEMES[note.color];
              const isSelected = activeNote?.id === note.id;
              const isCasted = castedNote?.id === note.id;
              const completedCount = (note.checklist || []).filter(
                (c) => c.completed
              ).length;
              const totalCount = (note.checklist || []).length;

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition relative group ${
                    isSelected
                      ? "bg-zinc-800/90 border-amber-500/60 shadow-lg"
                      : "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/40 hover:border-zinc-700/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${theme.accent}`} />
                      <h4 className="text-xs font-bold text-zinc-100 truncate">
                        {note.title || "Untitled Note"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCasted && (
                        <span
                          title="Currently on Desk E-Paper"
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <Tv className="w-2.5 h-2.5" /> Desk
                        </span>
                      )}
                      {note.pinned && (
                        <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Preview summary */}
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {note.mode === "checklist"
                      ? `${completedCount} of ${totalCount} tasks completed`
                      : note.content.replace(/[#*-]/g, "").trim() || "No content"}
                  </p>

                  {/* Card bottom tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No notes found. Create a new note to get started!
              </div>
            )}
          </div>
        </div>

        {/* Center Pane: Active Note Editor */}
        <div className="flex-1 min-w-0 p-4 xl:p-6 overflow-hidden flex flex-col min-h-0">
          {activeNote ? (
            <NoteEditor
              note={activeNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
              onTogglePin={onTogglePin}
              onCastNote={onCastNote}
              isCasted={castedNote?.id === activeNote.id}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm">
              <Layers className="w-12 h-12 mb-3 opacity-30 text-zinc-400" />
              <span>Select or create a sticky note to start editing</span>
            </div>
          )}
        </div>

        {/* Right Pane: Virtual E-Paper Simulator */}
        <div className="w-80 xl:w-96 shrink-0 p-4 xl:p-6 border-l border-zinc-800/80 bg-zinc-900/20 overflow-hidden flex flex-col min-h-0">
          <VirtualEPaper
            note={castedNote}
            settings={settings}
            onOpenHardwareModal={onOpenHardwareModal}
          />
        </div>
      </div>
    </div>
  );
};
