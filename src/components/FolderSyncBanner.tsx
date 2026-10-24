import React from "react";
import { Note } from "../types/note";
import { FolderCheck, ExternalLink, Share2, X } from "lucide-react";
import { openFolderInExplorer, createDesktopShortcut } from "../utils/folderSync";

interface FolderSyncBannerProps {
  note: Note;
  onUnlink: () => void;
}

export const FolderSyncBanner: React.FC<FolderSyncBannerProps> = ({
  note,
  onUnlink,
}) => {
  if (!note.folderPath) return null;

  return (
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
          type="button"
          onClick={() => openFolderInExplorer(note.folderPath!)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition font-medium"
          title="Open folder in Windows Explorer"
        >
          <ExternalLink className="w-3 h-3 text-amber-400" />
          <span>Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => createDesktopShortcut(note)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition font-medium"
          title="Create clickable note shortcut on Desktop"
        >
          <Share2 className="w-3 h-3 text-amber-400" />
          <span>Shortcut</span>
        </button>

        <button
          type="button"
          onClick={onUnlink}
          className="p-1 text-zinc-400 hover:text-rose-400 rounded transition"
          title="Unlink folder"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
