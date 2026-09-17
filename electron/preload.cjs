const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke("desktop:select-folder"),
  openFolder: (folderPath) => ipcRenderer.invoke("desktop:open-folder", folderPath),
  syncFolderNote: (folderPath, note) =>
    ipcRenderer.invoke("desktop:sync-folder-note", { folderPath, note }),
  createDesktopShortcut: (note) =>
    ipcRenderer.invoke("desktop:create-shortcut", note),
});
