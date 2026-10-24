import { useState, useEffect } from "react";
import { Note, HardwareSettings, NoteColor } from "../types/note";
import { logger } from "../utils/logger";

const STORAGE_KEY_NOTES = "deskpaper_notes_v1";
const STORAGE_KEY_SETTINGS = "deskpaper_settings_v1";
const STORAGE_KEY_CASTED = "deskpaper_casted_note_id_v1";

const DEFAULT_SETTINGS: HardwareSettings = {
  selectedModel: "4.2",
  orientation: "landscape",
  baudRate: 115200,
  invertColors: false,
  autoSync: false,
  ditherMode: "threshold",
  showSyncTimestamp: true,
  showTitleHeader: true,
};

const DEFAULT_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Today's Top Priorities",
    content: "",
    color: "yellow",
    mode: "checklist",
    checklist: [
      { id: "c1", text: "Ship DeskPaper firmware & desktop app", completed: true },
      { id: "c2", text: "Wire Waveshare 4.2-inch E-Paper to ESP32", completed: false },
      { id: "c3", text: "Test persistent zero-power display test", completed: false },
      { id: "c4", text: "Prep project demonstration", completed: false },
    ],
    tags: ["Work", "Hardware"],
    pinned: false,
    isCasted: true,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    lastCastedAt: Date.now() - 600000,
    position: { x: 60, y: 140 },
  },
  {
    id: "note-2",
    title: "Desk Companion Guidelines",
    content: "# DeskPaper Quick Guide\n\n- **Zero-Power Retention**: When your PC turns off, the e-ink screen keeps this exact note intact indefinitely!\n- **Checklists**: Toggle items to cross them off in real-time.\n- **Cast to Desk**: Click \"Cast to Desk\" to flash your active note to your physical or simulated display.\n\n> \"The analog feel of paper with the speed of digital notes.\"",
    color: "green",
    mode: "markdown",
    checklist: [],
    tags: ["Guide", "QuickTips"],
    pinned: false,
    isCasted: false,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
    position: { x: 400, y: 140 },
  },
  {
    id: "note-3",
    title: "Groceries & Supplies",
    content: "",
    color: "pink",
    mode: "checklist",
    checklist: [
      { id: "g1", text: "Oat milk & organic espresso beans", completed: true },
      { id: "g2", text: "USB-C right-angle braided cable", completed: false },
      { id: "g3", text: "Desk mount stand for 4.2-inch E-Paper", completed: false },
    ],
    tags: ["Personal"],
    pinned: false,
    isCasted: false,
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 7200000,
    position: { x: 720, y: 120 },
  },
];

export function useNotesStore() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [settings, setSettings] = useState<HardwareSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [castedNoteId, setCastedNoteId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASTED);
      return saved || (DEFAULT_NOTES[0] ? DEFAULT_NOTES[0].id : null);
    } catch {
      return DEFAULT_NOTES[0] ? DEFAULT_NOTES[0].id : null;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return DEFAULT_NOTES[0] ? DEFAULT_NOTES[0].id : null;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      logger.error("Failed to save notes to storage", e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      logger.error("Failed to save settings to storage", e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      if (castedNoteId) {
        localStorage.setItem(STORAGE_KEY_CASTED, castedNoteId);
      }
    } catch (e) {
      logger.error("Failed to save casted note ID", e);
    }
  }, [castedNoteId]);

  const addNote = (mode: "markdown" | "checklist" = "checklist", color: NoteColor = "yellow") => {
    const newNote: Note = {
      id: "note-" + Date.now(),
      title: mode === "checklist" ? "New Checklist" : "New Sticky Note",
      content: mode === "markdown" ? "# Note Title\n\nWrite your notes here..." : "",
      color,
      mode,
      checklist: mode === "checklist" ? [{ id: "c-" + Date.now(), text: "First task item", completed: false }] : [],
      tags: ["Inbox"],
      pinned: true,
      isCasted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: 80 + (notes.length % 5) * 30, y: 140 + (notes.length % 5) * 30 },
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return { ...n, ...patch, updatedAt: Date.now() };
        }
        return n;
      })
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (castedNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setCastedNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const castNote = (id: string) => {
    setCastedNoteId(id);
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        isCasted: n.id === id,
        lastCastedAt: n.id === id ? Date.now() : n.lastCastedAt,
      }))
    );
  };

  const updateSettings = (patch: Partial<HardwareSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  const castedNote = notes.find((n) => n.id === castedNoteId) || activeNote;

  return {
    notes,
    activeNote,
    castedNote,
    activeNoteId,
    castedNoteId,
    settings,
    setActiveNoteId,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    castNote,
    updateSettings,
  };
}
