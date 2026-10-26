import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const main = require("../electron/main.cjs");

const { isAllowedFolderPath, allowedFolders } = main;

console.log("Running Path Validation & Security Tests...");

// 1. Invalid inputs
if (isAllowedFolderPath(null)) throw new Error("Should reject null");
if (isAllowedFolderPath(undefined)) throw new Error("Should reject undefined");
if (isAllowedFolderPath(123)) throw new Error("Should reject non-string input");
if (isAllowedFolderPath("")) throw new Error("Should reject empty string");
if (isAllowedFolderPath("   ")) throw new Error("Should reject whitespace string");
console.log("✓ Correctly rejected invalid input types");

// 2. Non-existent path
const nonExistentPath = path.resolve("./non_existent_folder_xyz123");
if (isAllowedFolderPath(nonExistentPath)) {
  throw new Error("Should reject non-existent path");
}
console.log("✓ Correctly rejected non-existent path");

// 3. Exists, but is a file (not a directory)
const filePath = path.resolve("./package.json");
if (isAllowedFolderPath(filePath)) {
  throw new Error("Should reject file paths (must be directory)");
}
console.log("✓ Correctly rejected file path (package.json)");

// 4. Exists as directory, but not in allowed set or allowed user root
const unallowedDir = path.resolve("./node_modules");
if (isAllowedFolderPath(unallowedDir)) {
  throw new Error("Should reject directory not in allowed set");
}
console.log("✓ Correctly rejected directory not in allowed set");

// 5. Explicitly allowed directory via selectFolder (allowedFolders set)
const tempTestDir = path.resolve("./tests");
allowedFolders.add(tempTestDir);

if (!isAllowedFolderPath(tempTestDir)) {
  throw new Error("Should accept directory present in allowedFolders");
}
console.log("✓ Correctly accepted directory in allowedFolders");

// 6. Path traversal attempt targeting file or unallowed folder
const traversalPath = path.resolve("./tests/../package.json");
if (isAllowedFolderPath(traversalPath)) {
  throw new Error("Should reject path traversal pointing to a file");
}
console.log("✓ Correctly rejected path traversal attempt");

console.log("ALL PATH SECURITY TESTS PASSED SUCCESSFULLY!");
