import React from "react";
import { Note, HardwareSettings, NoteColor } from "../types/note";
import { StudioDeck } from "./StudioDeck";
import { DeskBoard } from "./DeskBoard";

interface MainViewProps {
  viewMode: "studio" | "desk";
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
  onSetViewMode: (mode: "studio" | "desk") => void;
}

export const MainView: React.FC<MainViewProps> = ({
  viewMode,
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
  onSetViewMode,
}) => {
  if (viewMode === "studio") {
    return (
      <StudioDeck
        notes={notes}
        activeNote={activeNote}
        castedNote={castedNote}
        settings={settings}
        onSelectNote={onSelectNote}
        onAddNote={onAddNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onTogglePin={onTogglePin}
        onCastNote={onCastNote}
        onOpenHardwareModal={onOpenHardwareModal}
        onSwitchToDeskBoard={() => onSetViewMode("desk")}
      />
    );
  }

  return (
    <DeskBoard
      notes={notes}
      castedNote={castedNote}
      settings={settings}
      onSelectNote={onSelectNote}
      onAddNote={onAddNote}
      onUpdateNote={onUpdateNote}
      onTogglePin={onTogglePin}
      onCastNote={onCastNote}
      onOpenHardwareModal={onOpenHardwareModal}
      onSwitchToStudio={() => onSetViewMode("studio")}
    />
  );
};
