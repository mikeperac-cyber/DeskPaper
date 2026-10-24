import React, { useEffect } from "react";
import { Note, NoteColor } from "../types/note";
import { ColorPicker } from "./ColorPicker";
import { FolderSyncBanner } from "./FolderSyncBanner";
import { TagManager } from "./TagManager";
import { ChecklistEditor } from "./ChecklistEditor";
import { MarkdownEditor } from "./MarkdownEditor";
import {
  CheckSquare,
  FileText,
  Pin,
  Trash2,
  Tv,
  Folder,
} from "lucide-react";
import { pickFolder, syncNoteToDisk } from "../utils/folderSync";

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCastNote: (id: string) => void;
  isCasted: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onCastNote,
  isCasted,
}) => {
  // Automatically sync to pinned Windows folder on edit
  useEffect(() => {
    if (note.folderPath && note.folderSyncEnabled) {
      const timer = setTimeout(() => {
        syncNoteToDisk(note);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [note]);

  const handlePinToFolder = async () => {
    const selected = await pickFolder();
    if (selected) {
      onUpdateNote(note.id, { folderPath: selected, folderSyncEnabled: true });
      await syncNoteToDisk({ ...note, folderPath: selected });
    }
  };

  const handleAddTag = (tag: string) => {
    onUpdateNote(note.id, { tags: [...note.tags, tag] });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote(note.id, {
      tags: note.tags.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 xl:p-6 backdrop-blur-xl shadow-xl min-h-0 overflow-y-auto">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60 shrink-0">
            <button
              type="button"
              onClick={() => onUpdateNote(note.id, { mode: "checklist" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                note.mode === "checklist"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Checklist
            </button>
            <button
              type="button"
              onClick={() => onUpdateNote(note.id, { mode: "markdown" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                note.mode === "markdown"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown
            </button>
          </div>

          {/* Color Picker */}
          <div className="shrink-0">
            <ColorPicker
              currentColor={note.color}
              onSelectColor={(color: NoteColor) => onUpdateNote(note.id, { color })}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pin to Folder */}
          <button
            type="button"
            onClick={handlePinToFolder}
            title={note.folderPath ? "Change pinned Windows folder" : "Pin note to Windows desktop folder"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
              note.folderPath
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Folder className={`w-3.5 h-3.5 ${note.folderPath ? "text-amber-400" : ""}`} />
            <span>{note.folderPath ? "Folder Pinned" : "Pin to Folder"}</span>
          </button>

          {/* Pin to Desktop */}
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            title={note.pinned ? "Unpin floating note" : "Pin floating note to desktop"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
              note.pinned
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${note.pinned ? "fill-amber-400" : ""}`} />
            <span>{note.pinned ? "Pinned" : "Pin"}</span>
          </button>

          {/* Cast to Desk Button */}
          <button
            type="button"
            onClick={() => onCastNote(note.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-lg ${
              isCasted
                ? "bg-emerald-500 text-zinc-950 shadow-emerald-500/20"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{isCasted ? "Casting" : "Cast to Desk"}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDeleteNote(note.id)}
            title="Delete note"
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linked Folder Banner */}
      <FolderSyncBanner
        note={note}
        onUnlink={() => onUpdateNote(note.id, { folderPath: undefined })}
      />

      {/* Note Title Input */}
      <div className="mb-4">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          placeholder="Note Title..."
          className="w-full bg-transparent text-xl font-bold text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 tracking-tight"
        />
      </div>

      {/* Tags Row */}
      <TagManager
        tags={note.tags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {note.mode === "checklist" ? (
          <ChecklistEditor
            checklist={note.checklist}
            onUpdateChecklist={(checklist) =>
              onUpdateNote(note.id, { checklist })
            }
          />
        ) : (
          <MarkdownEditor
            content={note.content}
            onChangeContent={(content) =>
              onUpdateNote(note.id, { content })
            }
          />
        )}
      </div>
    </div>
  );
};
