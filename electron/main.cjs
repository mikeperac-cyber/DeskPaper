const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;

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

// IPC Handlers
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
  return result.filePaths[0];
});

ipcMain.handle("desktop:open-folder", async (event, folderPath) => {
  if (!folderPath || !fs.existsSync(folderPath)) return false;
  await shell.openPath(folderPath);
  return true;
});

ipcMain.handle("desktop:sync-folder-note", async (event, { folderPath, note }) => {
  if (!folderPath || !fs.existsSync(folderPath)) return false;
  try {
    const noteFilePath = path.join(folderPath, "NOTE.md");

    // Format content as clean markdown
    let mdContent = "# " + (note.title || "Sticky Note") + "\n\n";
    if (note.tags && note.tags.length > 0) {
      mdContent += "Tags: " + note.tags.map(t => "#" + t).join(" ") + "\n\n";
    }
    mdContent += "*Last synced via DeskPaper: " + new Date().toLocaleString() + "*\n\n---\n\n";

    if (note.mode === "checklist") {
      const items = note.checklist || [];
      for (const item of items) {
        mdContent += "- [" + (item.completed ? "x" : " ") + "] " + item.text + "\n";
      }
    } else {
      mdContent += note.content || "";
    }

    fs.writeFileSync(noteFilePath, mdContent, "utf8");

    // Write a shortcut inside the folder that opens DeskPaper
    const shortcutPath = path.join(folderPath, "Open_In_DeskPaper.url");
    const exePath = process.execPath;
    const urlContent = "[InternetShortcut]\nURL=file:///" + exePath.replace(/\\/g, "/") + "\nIconIndex=0\nIconFile=" + exePath.replace(/\\/g, "/") + "\n";
    fs.writeFileSync(shortcutPath, urlContent, "utf8");

    return true;
  } catch (err) {
    console.error("Failed to sync folder note:", err);
    return false;
  }
});

ipcMain.handle("desktop:create-shortcut", async (event, note) => {
  try {
    const desktopPath = app.getPath("desktop");
    const sanitizedTitle = (note.title || "Sticky Note").replace(/[\\/:*?"<>|]/g, "_");
    const shortcutPath = path.join(desktopPath, "DeskPaper - " + sanitizedTitle + ".url");

    const exePath = process.execPath;
    const urlContent = "[InternetShortcut]\nURL=file:///" + exePath.replace(/\\/g, "/") + "\nIconIndex=0\nIconFile=" + exePath.replace(/\\/g, "/") + "\n";
    fs.writeFileSync(shortcutPath, urlContent, "utf8");
    return true;
  } catch (err) {
    console.error("Failed to create desktop shortcut:", err);
    return false;
  }
});

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
