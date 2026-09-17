import React, { useState } from "react";
import { Note, ChecklistItem, NoteColor } from "../types/note";
import { ColorPicker, COLOR_THEMES } from "./ColorPicker";
import {
  CheckSquare,
  FileText,
  Pin,
  Trash2,
  Tv,
  Plus,
  X,
  Heading1,
  Heading2,
  Bold,
  List,
  Quote,
  Sparkles,
  Tag as TagIcon,
  Folder,
  FolderCheck,
  ExternalLink,
  Share2,
} from "lucide-react";
import { pickFolder, openFolderInExplorer, syncNoteToDisk, createDesktopShortcut } from "../utils/folderSync";

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
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newTagText, setNewTagText] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const theme = COLOR_THEMES[note.color];

  // Checklist handlers
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: "item-" + Date.now(),
      text: newChecklistText.trim(),
      completed: false,
    };
    onUpdateNote(note.id, {
      checklist: [...(note.checklist || []), newItem],
    });
    setNewChecklistText("");
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateNote(note.id, { checklist: updated });
  };

  const handleUpdateChecklistText = (itemId: string, text: string) => {
    const updated = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    onUpdateNote(note.id, { checklist: updated });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updated = (note.checklist || []).filter((item) => item.id !== itemId);
    onUpdateNote(note.id, { checklist: updated });
  };

  // Tags handlers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagText.trim().replace(/^#/, "");
    if (!tag) return;
    if (!note.tags.includes(tag)) {
      onUpdateNote(note.id, { tags: [...note.tags, tag] });
    }
    setNewTagText("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote(note.id, {
      tags: note.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Markdown quick format helper
  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("markdown-editor-area") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = note.content;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || "text") + suffix;

    const updated =
      current.substring(0, start) + replacement + current.substring(end);
    onUpdateNote(note.id, { content: updated });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length
      );
    }, 10);
  };

  const completedCount = (note.checklist || []).filter((c) => c.completed).length;
  const totalCount = (note.checklist || []).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Automatically sync to pinned Windows folder on edit
  React.useEffect(() => {
    if (note.folderPath && note.folderSyncEnabled) {
      const timer = setTimeout(() => {
        syncNoteToDisk(note);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [note.content, note.title, note.checklist, note.folderPath, note.folderSyncEnabled]);

  const handlePinToFolder = async () => {
    const selected = await pickFolder();
    if (selected) {
      onUpdateNote(note.id, { folderPath: selected, folderSyncEnabled: true });
      await syncNoteToDisk({ ...note, folderPath: selected });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 xl:p-6 backdrop-blur-xl shadow-xl min-h-0 overflow-y-auto">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60 shrink-0">
            <button
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
            onClick={() => onDeleteNote(note.id)}
            title="Delete note"
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linked Folder Banner */}
      {note.folderPath && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FolderCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-mono text-[11px] text-amber-300 font-semibold truncate block">
                {note.folderPath}
              </span>
              <span className="text-[10px] text-zinc-400">
                Syncs NOTE.md directly inside folder
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => openFolderInExplorer(note.folderPath!)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition font-medium"
              title="Open folder in Windows Explorer"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span>Explorer</span>
            </button>

            <button
              onClick={() => createDesktopShortcut(note)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition font-medium"
              title="Create clickable note shortcut on Desktop"
            >
              <Share2 className="w-3 h-3 text-amber-400" />
              <span>Shortcut</span>
            </button>

            <button
              onClick={() => onUpdateNote(note.id, { folderPath: undefined })}
              className="p-1 text-zinc-400 hover:text-rose-400 rounded transition"
              title="Unlink folder"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700/60 text-zinc-300"
          >
            #{tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-zinc-500 hover:text-zinc-200"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {showTagInput ? (
          <form onSubmit={handleAddTag} className="inline-flex items-center">
            <input
              type="text"
              autoFocus
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
              onBlur={() => setShowTagInput(false)}
              placeholder="tag name..."
              className="px-2 py-0.5 text-xs bg-zinc-800 border border-amber-500/50 rounded-full text-zinc-100 focus:outline-none w-24"
            />
          </form>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition"
          >
            <Plus className="w-3 h-3" /> Add tag
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {note.mode === "checklist" ? (
          <div className="flex-1 flex flex-col">
            {/* Progress indicator */}
            {totalCount > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span>
                    Tasks: {completedCount} / {totalCount} completed
                  </span>
                  <span className="font-mono font-medium">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Checklist items scroll area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(note.checklist || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800/80 group hover:border-zinc-700 transition"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      item.completed
                        ? "bg-amber-500 border-amber-500 text-zinc-950"
                        : "border-zinc-600 hover:border-amber-400"
                    }`}
                  >
                    {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
                  </button>

                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) =>
                      handleUpdateChecklistText(item.id, e.target.value)
                    }
                    className={`flex-1 bg-transparent text-sm focus:outline-none transition ${
                      item.completed
                        ? "line-through text-zinc-500"
                        : "text-zinc-200"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Item form */}
            <form
              onSubmit={handleAddChecklistItem}
              className="mt-4 flex items-center gap-2"
            >
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add a new checklist item (Press Enter)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                className="p-2.5 bg-amber-500 text-zinc-950 rounded-xl hover:bg-amber-400 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Markdown Toolbar */}
            <div className="flex items-center gap-1 pb-2 mb-2 border-b border-zinc-800/60 text-zinc-400">
              <button
                type="button"
                onClick={() => insertMarkdown("# ")}
                title="Heading 1"
                className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("## ")}
                title="Heading 2"
                className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                title="Bold"
                className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("- ")}
                title="Bullet List"
                className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("> ")}
                title="Quote"
                className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
              >
                <Quote className="w-4 h-4" />
              </button>
            </div>

            {/* Markdown Editor Textarea */}
            <textarea
              id="markdown-editor-area"
              value={note.content}
              onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
              placeholder="Write your note with markdown headings (#), bullets (-), or quotes (>)..."
              className="flex-1 w-full bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
};
