import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Mock electron in require cache using Module._cache directly
const Module = require("node:module");
const mockApp = {
  requestSingleInstanceLock: () => false,
  quit: () => {},
  getPath: (name) => os.tmpdir(),
  whenReady: () => Promise.resolve(),
  on: () => {},
};

const mockIpcMain = {
  handle: () => {},
};

const mockShell = {
  writeShortcutLink: (shortcutPath, operation, options) => {
    fs.writeFileSync(shortcutPath, `[LNK_MOCK]\nTarget=${options.target}`, "utf8");
    return true;
  },
};

const electronExports = {
  app: mockApp,
  BrowserWindow: class {},
  ipcMain: mockIpcMain,
  dialog: {},
  shell: mockShell,
};

// Create a fake Module object for 'electron'
const electronModule = new Module("electron");
electronModule.exports = electronExports;
electronModule.loaded = true;

// Override Module._load to intercept 'electron'
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "electron") {
    return electronExports;
  }
  return originalLoad.apply(this, arguments);
};

const { sanitizeFilename, createDeskPaperShortcut } = require("../electron/main.cjs");

console.log("Running Shortcut Sanitization & Security Tests...");

// 1. Test basic title sanitization
assert.strictEqual(sanitizeFilename("Normal Title"), "Normal Title");
assert.strictEqual(sanitizeFilename("Note with : / \\ * ? < > | chars"), "Note with _ _ _ _ _ _ _ _ chars");

// 2. Test Control Characters and Newlines
assert.strictEqual(sanitizeFilename("Title\nWith\r\nNewlines"), "TitleWithNewlines");
assert.strictEqual(sanitizeFilename("Title\x00\x1FWithControlChars"), "TitleWithControlChars");

// 3. Test Path Traversal sequences
assert.strictEqual(sanitizeFilename("../../../etc/passwd"), "_etc_passwd");
assert.strictEqual(sanitizeFilename("..\\..\\Windows\\System32"), "_Windows_System32");

// 4. Test Windows Reserved Filenames
assert.strictEqual(sanitizeFilename("CON"), "Sticky Note");
assert.strictEqual(sanitizeFilename("prn.txt"), "Sticky Note");
assert.strictEqual(sanitizeFilename("AUX"), "Sticky Note");
assert.strictEqual(sanitizeFilename("COM1"), "Sticky Note");
assert.strictEqual(sanitizeFilename("LPT9"), "Sticky Note");

// 5. Test trailing dots and spaces
assert.strictEqual(sanitizeFilename("BadTitle...   "), "BadTitle");

// 6. Test long titles
const longTitle = "A".repeat(150);
assert.strictEqual(sanitizeFilename(longTitle).length, 100);

// 7. Test empty or non-string inputs
assert.strictEqual(sanitizeFilename(""), "Sticky Note");
assert.strictEqual(sanitizeFilename(null), "Sticky Note");
assert.strictEqual(sanitizeFilename(undefined), "Sticky Note");

console.log("✓ All sanitizeFilename unit tests passed!");

// 8. Test Shortcut Creation
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpaper-test-"));
try {
  const result = createDeskPaperShortcut(tmpDir, "DeskPaper - TestNote\nWith\r\nNewlines");
  assert.strictEqual(result, true);

  const files = fs.readdirSync(tmpDir);
  assert.strictEqual(files.length, 1);
  const createdFile = files[0];
  console.log("Created shortcut file:", createdFile);

  assert.strictEqual(createdFile.includes("\n"), false);
  assert.strictEqual(createdFile.includes("\r"), false);

  const content = fs.readFileSync(path.join(tmpDir, createdFile), "utf8");
  assert.strictEqual(content.includes("InternetShortcut") || content.includes("LNK_MOCK"), true);

  console.log("✓ Shortcut file generation verified!");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("ALL SHORTCUT SANITIZATION TESTS PASSED SUCCESSFULLY!");
