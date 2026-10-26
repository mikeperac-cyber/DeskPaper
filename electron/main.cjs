let electron;
try {
  electron = require("electron");
} catch (_) {
  electron = null;
}
const path = require("path");
const fs = require("fs");
const url = require("url");

const isElectronRuntime = typeof electron === "object" && electron !== null && !!electron.app;
const app = isElectronRuntime ? electron.app : null;
const BrowserWindow = isElectronRuntime ? electron.BrowserWindow : null;
const ipcMain = isElectronRuntime ? electron.ipcMain : null;
const dialog = isElectronRuntime ? electron.dialog : null;
const shell = isElectronRuntime ? electron.shell : null;

let mainWindow = null;

if (app) {
  // Ensure single instance
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    process.exit(0);
  }

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 620,
    show: false,
    backgroundColor: "#09090b",
    title: "DeskPaper - E-Ink Sticky Notes",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle USB Serial Port dialogs
  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      event.preventDefault();
      if (portList && portList.length > 0) {
        callback(portList[0].portId);
      } else {
        callback("");
      }
    }
  );

  mainWindow.webContents.session.setPermissionCheckHandler(() => true);
  mainWindow.webContents.session.setDevicePermissionHandler(() => true);

  // Load production bundle or dev server
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("[DeskPaper] Failed to load index.html:", err);
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const allowedFolders = new Set();

/**
 * Validates whether a given folder path is safe and allowed to be accessed or opened.
 * - Must be a non-empty string
 * - Must resolve to an absolute path
 * - Must exist on disk and be a directory (not an executable or arbitrary file)
 * - Must either be inside standard user directories (Desktop, Documents, Downloads, Home)
 *   or explicitly allowed via user folder selection (`allowedFolders`).
 */
function isAllowedFolderPath(folderPath) {
  if (typeof folderPath !== "string" || !folderPath.trim()) {
    return false;
  }

  try {
    const resolvedPath = path.resolve(folderPath);

    // Verify existence and ensure target is a directory
    if (!fs.existsSync(resolvedPath)) {
      return false;
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return false;
    }

    // Check if path is in explicitly allowed folders (selected by user)
    if (allowedFolders.has(resolvedPath)) {
      return true;
    }

    // Also check if path is under standard allowed user directories if app is ready
    const allowedRoots = [];
    if (typeof app !== "undefined" && app && typeof app.getPath === "function") {
      const userPaths = ["desktop", "documents", "downloads", "userData"];
      for (const p of userPaths) {
        try {
          const userDir = app.getPath(p);
          if (userDir) {
            allowedRoots.push(path.resolve(userDir));
          }
        } catch (_) {}
      }
    }

    const isSubdirectoryOf = (parent, dir) => {
      const relative = path.relative(parent, dir);
      return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
    };

    for (const root of allowedRoots) {
      if (isSubdirectoryOf(root, resolvedPath)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("[DeskPaper] Path validation error:", err);
    return false;
  }
}

/**
 * Sanitizes a string for use as a safe filename or shortcut title.
 * - Strips ASCII control characters (0-31 and 127)
 * - Removes invalid filename characters: \ / : * ? " < > |
 * - Avoids Windows reserved filenames (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 * - Strips relative path navigation segments (..)
 * - Trims trailing dots and spaces
 * - Limits max length to 100 characters
 */
function sanitizeFilename(input, fallback = "Sticky Note") {
  if (typeof input !== "string") {
    return fallback;
  }

  // Strip control characters (0-31, 127) and invalid filename characters
  let clean = input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.\.+/g, "_")
    .trim();

  // Strip trailing periods and spaces (problematic on Windows)
  clean = clean.replace(/[.\s]+$/g, "");

  // Check against Windows reserved file names
  const reservedRegex = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
  if (!clean || reservedRegex.test(clean)) {
    clean = fallback;
  }

  // Truncate to reasonable max length
  if (clean.length > 100) {
    clean = clean.substring(0, 100).trim().replace(/[.\s]+$/g, "");
  }

  return clean || fallback;
}

/**
 * Creates a desktop or folder shortcut to DeskPaper executable securely.
 * On Windows, shell.writeShortcutLink creates native .lnk shortcuts.
 * On other platforms or as fallback, writes a .url file with properly formatted file:// URL.
 */
function createDeskPaperShortcut(targetDirPath, shortcutFileNameWithoutExt) {
  const safeBaseName = sanitizeFilename(shortcutFileNameWithoutExt, "DeskPaper Shortcut");
  const exePath = process.execPath;

  if (process.platform === "win32") {
    const shortcutPath = path.join(targetDirPath, safeBaseName + ".lnk");
    const success = shell.writeShortcutLink(shortcutPath, "create", {
      target: exePath,
      cwd: path.dirname(exePath),
      description: "DeskPaper - E-Ink Sticky Notes",
      icon: exePath,
      iconIndex: 0,
    });
    if (success) {
      return true;
    }
  }

  // Cross-platform / fallback .url shortcut format
  const shortcutPath = path.join(targetDirPath, safeBaseName + ".url");
  const fileUrl = url.pathToFileURL(exePath).href;
  const safeExePath = exePath.replace(/[\r\n]/g, "");

  const urlContent = [
    "[InternetShortcut]",
    "URL=" + fileUrl,
    "IconIndex=0",
    "IconFile=" + safeExePath,
    "",
  ].join("\r\n");

  fs.writeFileSync(shortcutPath, urlContent, "utf8");
  return true;
}

// Export functions for unit testing in Node environment
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    sanitizeFilename,
    createDeskPaperShortcut,
    isAllowedFolderPath,
    allowedFolders,
  };
}

// IPC Handlers
if (ipcMain) {
  ipcMain.handle("desktop:select-folder", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Windows Folder to Pin Sticky Note",
    properties: ["openDirectory", "createDirectory"],
    defaultPath: app.getPath("desktop"),
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const selectedPath = path.resolve(result.filePaths[0]);
  allowedFolders.add(selectedPath);
  return selectedPath;
});

ipcMain.handle("desktop:open-folder", async (event, folderPath) => {
  if (!isAllowedFolderPath(folderPath)) return false;
  const resolvedPath = path.resolve(folderPath);
  await shell.openPath(resolvedPath);
  return true;
});

ipcMain.handle("desktop:sync-folder-note", async (event, { folderPath, note }) => {
  if (!isAllowedFolderPath(folderPath)) return false;
  const resolvedPath = path.resolve(folderPath);
  try {
    const noteFilePath = path.join(resolvedPath, "NOTE.md");
    const safeTitle = sanitizeFilename(note ? note.title : "", "Sticky Note");

    // Format content as clean markdown
    let mdContent = "# " + safeTitle + "\n\n";
    if (note && note.tags && note.tags.length > 0) {
      mdContent += "Tags: " + note.tags.map(t => "#" + t).join(" ") + "\n\n";
    }
    mdContent += "*Last synced via DeskPaper: " + new Date().toLocaleString() + "*\n\n---\n\n";

    if (note && note.mode === "checklist") {
      const items = note.checklist || [];
      for (const item of items) {
        mdContent += "- [" + (item.completed ? "x" : " ") + "] " + item.text + "\n";
      }
    } else {
      mdContent += (note && note.content) || "";
    }

    fs.writeFileSync(noteFilePath, mdContent, "utf8");

    // Write a shortcut inside the folder that opens DeskPaper
    createDeskPaperShortcut(resolvedPath, "Open_In_DeskPaper");

    return true;
  } catch (err) {
    console.error("Failed to sync folder note:", err);
    return false;
  }
});

ipcMain.handle("desktop:create-shortcut", async (event, note) => {
  try {
    const desktopPath = app ? app.getPath("desktop") : "";
    const title = (note && note.title) || "Sticky Note";
    const safeTitle = sanitizeFilename(title, "Sticky Note");

    return createDeskPaperShortcut(desktopPath, "DeskPaper - " + safeTitle);
  } catch (err) {
    console.error("Failed to create desktop shortcut:", err);
    return false;
  }
});
}

if (app) {
  app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
}
