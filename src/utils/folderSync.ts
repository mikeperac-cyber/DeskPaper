import type { Note } from "../types/note.js";

/**
 * Native folder selection & synchronization helper
 */
export async function pickFolder(): Promise<string | null> {
  // 1. If running inside Electron desktop app
  if (window.desktopAPI && window.desktopAPI.selectFolder) {
    return await window.desktopAPI.selectFolder();
  }

  // 2. If running in modern browser with File System Access API
  if ("showDirectoryPicker" in window) {
    try {
      const handle = await (window as any).showDirectoryPicker();
      return handle.name ? `[Folder: ${handle.name}]` : "Selected Desktop Folder";
    } catch {
      return null;
    }
  }

  // 3. Fallback prompt
  const manual = prompt("Enter Windows folder path (e.g. C:\\Users\\micha\\Desktop\\MyFolder):");
  return manual ? manual.trim() : null;
}

export async function openFolderInExplorer(folderPath: string): Promise<boolean> {
  if (window.desktopAPI && window.desktopAPI.openFolder) {
    return await window.desktopAPI.openFolder(folderPath);
  }
  alert("Folder linked: " + folderPath + "\n(Run the DeskPaper Windows .exe to open directly in Windows Explorer)");
  return false;
}

export async function syncNoteToDisk(note: Note): Promise<boolean> {
  if (!note.folderPath) return false;

  if (window.desktopAPI && window.desktopAPI.syncFolderNote) {
    return await window.desktopAPI.syncFolderNote(note.folderPath, note);
  }
  return false;
}

export async function createDesktopShortcut(note: Note): Promise<boolean> {
  if (window.desktopAPI && window.desktopAPI.createDesktopShortcut) {
    return await window.desktopAPI.createDesktopShortcut(note);
  }
  alert("Desktop shortcut creation is available in the DeskPaper Windows app.");
  return false;
}
