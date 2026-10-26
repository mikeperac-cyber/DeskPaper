import React, { useState, useRef } from "react";
import { Note } from "../types/note";
import { COLOR_THEMES } from "../constants/theme";
import {
  X,
  Tv,
  CheckSquare,
  Square,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
  FolderCheck,
} from "lucide-react";
import { openFolderInExplorer } from "../utils/folderSync";

interface FloatingNoteProps {
  note: Note;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onClose: (id: string) => void;
  onCastNote: (id: string) => void;
  onSelect: (id: string) => void;
  isCasted: boolean;
}

export const FloatingNote: React.FC<FloatingNoteProps> = ({
  note,
  onUpdateNote,
  onClose,
  onCastNote,
  onSelect,
  isCasted,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState(
    note.position || { x: 40, y: 100 }
  );
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const theme = COLOR_THEMES[note.color];

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    onSelect(note.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, moveEvent.clientX - dragOffsetRef.current.x);
      const newY = Math.max(10, moveEvent.clientY - dragOffsetRef.current.y);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      onUpdateNote(note.id, { position });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateNote(note.id, { checklist: updated });
  };

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        zIndex: note.pinned ? 40 : 20,
      }}
      className={`fixed top-0 left-0 w-72 rounded-xl shadow-2xl border transition-shadow duration-200 select-none overflow-hidden ${theme.bg} ${theme.border} ${theme.text}`}
      onClick={() => onSelect(note.id)}
    >
      {/* Sticky Note Top Header Tape */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
      >
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="text-xs font-bold truncate max-w-[120px]">
            {note.title || "Untitled Note"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Linked Folder quick open */}
          {note.folderPath && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openFolderInExplorer(note.folderPath!);
              }}
              title={`Open pinned folder in Explorer: ${note.folderPath}`}
              className="p-1 text-amber-500 hover:text-amber-400 rounded-md transition"
            >
              <FolderCheck className="w-3 h-3" />
            </button>
          )}

          {/* Cast button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCastNote(note.id);
            }}
            title={isCasted ? "Currently on Desk E-Paper" : "Cast to Desk E-Paper"}
            className={`p-1 rounded-md transition ${
              isCasted
                ? "bg-emerald-500 text-zinc-950 font-bold"
                : "opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <Tv className="w-3 h-3" />
          </button>

          {/* Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition"
          >
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>

          {/* Close/Unpin button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(note.id);
            }}
            title="Unpin from desktop"
            className="p-1 opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Note Body Content */}
      {!isCollapsed && (
        <div className="p-3.5 max-h-80 overflow-y-auto space-y-2 text-xs">
          {note.mode === "checklist" ? (
            <div className="space-y-1.5">
              {(note.checklist || []).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="flex items-start gap-2 cursor-pointer group"
                >
                  <button
                    type="button"
                    className="mt-0.5 opacity-80 group-hover:opacity-100"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>
                  <span
                    className={`flex-1 leading-snug break-words ${
                      item.completed
                        ? "line-through opacity-50"
                        : "opacity-90 font-medium"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              {(note.checklist || []).length === 0 && (
                <div className="opacity-40 italic py-2">No checklist items</div>
              )}
            </div>
          ) : (
            <div className="font-mono whitespace-pre-wrap leading-relaxed opacity-90">
              {note.content || "Empty note"}
            </div>
          )}

          {/* Tags pill list */}
          {note.tags && note.tags.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1 border-t border-black/10 dark:border-white/10">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${theme.badge}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
