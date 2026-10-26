import assert from "node:assert";
import {
  pickFolder,
  openFolderInExplorer,
  syncNoteToDisk,
  createDesktopShortcut,
} from "../src/utils/folderSync.ts";

console.log("Running folderSync Unit Tests...");

// Helper to reset window/global mocks before each scenario
function resetWindowGlobals() {
  delete globalThis.window;
  delete globalThis.prompt;
  delete globalThis.alert;
}

// Dummy note for tests
const sampleNote = {
  id: "note-1",
  title: "Test Note",
  content: "Hello World",
  color: "yellow",
  mode: "markdown",
  checklist: [],
  tags: ["test"],
  pinned: false,
  isCasted: false,
  createdAt: 1000,
  updatedAt: 2000,
  folderPath: "C:\\Users\\Test\\Folder",
};

// --- 1. pickFolder tests ---

// Scenario 1a: Electron desktop API available
resetWindowGlobals();
globalThis.window = {
  desktopAPI: {
    selectFolder: async () => "C:\\Selected\\Electron\\Folder",
  },
};
let folder = await pickFolder();
assert.strictEqual(folder, "C:\\Selected\\Electron\\Folder");
console.log("✓ pickFolder: Electron desktopAPI selectFolder returned folder path");

// Scenario 1b: Browser File System Access API (showDirectoryPicker) with named directory
resetWindowGlobals();
globalThis.window = {
  showDirectoryPicker: async () => ({ name: "MyProjects" }),
};
folder = await pickFolder();
assert.strictEqual(folder, "[Folder: MyProjects]");
console.log("✓ pickFolder: Browser showDirectoryPicker returned [Folder: name]");

// Scenario 1c: Browser File System Access API with empty handle name
resetWindowGlobals();
globalThis.window = {
  showDirectoryPicker: async () => ({ name: "" }),
};
folder = await pickFolder();
assert.strictEqual(folder, "Selected Desktop Folder");
console.log("✓ pickFolder: Browser showDirectoryPicker with empty name returned default label");

// Scenario 1d: Browser File System Access API rejection (user cancels picker)
resetWindowGlobals();
globalThis.window = {
  showDirectoryPicker: async () => {
    throw new Error("User cancelled");
  },
};
folder = await pickFolder();
assert.strictEqual(folder, null);
console.log("✓ pickFolder: Browser showDirectoryPicker cancellation returned null");

// Scenario 1e: Fallback prompt - user enters folder path
resetWindowGlobals();
globalThis.window = {};
globalThis.prompt = (msg) => "   D:\\Backup\\Notes   ";
folder = await pickFolder();
assert.strictEqual(folder, "D:\\Backup\\Notes");
console.log("✓ pickFolder: Fallback prompt returned trimmed manual input");

// Scenario 1f: Fallback prompt - user cancels prompt
resetWindowGlobals();
globalThis.window = {};
globalThis.prompt = (msg) => null;
folder = await pickFolder();
assert.strictEqual(folder, null);
console.log("✓ pickFolder: Fallback prompt cancellation returned null");


// --- 2. openFolderInExplorer tests ---

// Scenario 2a: Electron desktop API available
resetWindowGlobals();
globalThis.window = {
  desktopAPI: {
    openFolder: async (path) => path === "C:\\Users\\Test\\Folder",
  },
};
let opened = await openFolderInExplorer("C:\\Users\\Test\\Folder");
assert.strictEqual(opened, true);
console.log("✓ openFolderInExplorer: Electron desktopAPI opened folder");

// Scenario 2b: Fallback browser alert
resetWindowGlobals();
let alertMsg = "";
globalThis.window = {};
globalThis.alert = (msg) => {
  alertMsg = msg;
};
opened = await openFolderInExplorer("C:\\Users\\Test\\Folder");
assert.strictEqual(opened, false);
assert.strictEqual(alertMsg.includes("Folder linked: C:\\Users\\Test\\Folder"), true);
console.log("✓ openFolderInExplorer: Fallback browser alert displayed and returned false");


// --- 3. syncNoteToDisk tests ---

// Scenario 3a: Note missing folderPath
resetWindowGlobals();
let synced = await syncNoteToDisk({ ...sampleNote, folderPath: undefined });
assert.strictEqual(synced, false);
console.log("✓ syncNoteToDisk: Note without folderPath returned false");

// Scenario 3b: Electron desktop API available
resetWindowGlobals();
globalThis.window = {
  desktopAPI: {
    syncFolderNote: async (folderPath, note) => {
      return folderPath === "C:\\Users\\Test\\Folder" && note.id === "note-1";
    },
  },
};
synced = await syncNoteToDisk(sampleNote);
assert.strictEqual(synced, true);
console.log("✓ syncNoteToDisk: Electron desktopAPI synced note successfully");

// Scenario 3c: Fallback browser environment
resetWindowGlobals();
globalThis.window = {};
synced = await syncNoteToDisk(sampleNote);
assert.strictEqual(synced, false);
console.log("✓ syncNoteToDisk: Fallback environment returned false");


// --- 4. createDesktopShortcut tests ---

// Scenario 4a: Electron desktop API available
resetWindowGlobals();
globalThis.window = {
  desktopAPI: {
    createDesktopShortcut: async (note) => note.id === "note-1",
  },
};
let createdShortcut = await createDesktopShortcut(sampleNote);
assert.strictEqual(createdShortcut, true);
console.log("✓ createDesktopShortcut: Electron desktopAPI created shortcut");

// Scenario 4b: Fallback browser alert
resetWindowGlobals();
alertMsg = "";
globalThis.window = {};
globalThis.alert = (msg) => {
  alertMsg = msg;
};
createdShortcut = await createDesktopShortcut(sampleNote);
assert.strictEqual(createdShortcut, false);
assert.strictEqual(alertMsg.includes("Desktop shortcut creation is available"), true);
console.log("✓ createDesktopShortcut: Fallback browser alert displayed and returned false");

// Cleanup
resetWindowGlobals();

console.log("ALL FOLDER SYNC UNIT TESTS PASSED SUCCESSFULLY!");
