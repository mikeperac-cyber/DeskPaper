import React, { useState } from "react";
import { useNotesStore } from "./store/notesStore";
import { StudioDeck } from "./components/StudioDeck";
import { DeskBoard } from "./components/DeskBoard";
import { HardwareModal } from "./components/HardwareModal";
import { serialManager } from "./serial/serialManager";
import { renderNoteToBuffer } from "./engine/rasterizer";
import { logger } from "./utils/logger";

export function App() {
  const {
    notes,
    activeNote,
    castedNote,
    settings,
    setActiveNoteId,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    castNote,
    updateSettings,
  } = useNotesStore();

  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"studio" | "desk">("studio");

  // Cast note to physical/virtual E-Paper display
  const handleCastNote = async (id: string) => {
    castNote(id);
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    try {
      const renderResult = renderNoteToBuffer(targetNote, settings);
      // Send over serial if connected
      const status = serialManager.getStatus();
      if (status.state === "connected") {
        await serialManager.sendBitmap(
          renderResult.width,
          renderResult.height,
          renderResult.packedBuffer
        );
      }
    } catch (err) {
      logger.error("Error during casting to E-Paper:", err);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {viewMode === "studio" ? (
        /* Central Studio Deck Window: Clean 3-pane layout */
        <StudioDeck
          notes={notes}
          activeNote={activeNote}
          castedNote={castedNote}
          settings={settings}
          onSelectNote={setActiveNoteId}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onTogglePin={togglePin}
          onCastNote={handleCastNote}
          onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
          onSwitchToDeskBoard={() => setViewMode("desk")}
        />
      ) : (
        /* Desk Corkboard Window: Fullscreen freeform draggable stickies */
        <DeskBoard
          notes={notes}
          activeNote={activeNote}
          castedNote={castedNote}
          settings={settings}
          onSelectNote={setActiveNoteId}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onTogglePin={togglePin}
          onCastNote={handleCastNote}
          onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
          onSwitchToStudio={() => setViewMode("studio")}
        />
      )}

      {/* Hardware Configuration Modal */}
      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}

export default App;
