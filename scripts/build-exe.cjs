const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const tempOut = path.join(os.tmpdir(), "deskpaper-dist");
console.log("[DeskPaper] Building to local temp directory (avoiding OneDrive locks):", tempOut);

if (fs.existsSync(tempOut)) {
  try {
    fs.rmSync(tempOut, { recursive: true, force: true });
  } catch (e) {}
}

console.log("[DeskPaper] Step 1: Compiling TypeScript and Vite bundle...");
execSync("npm run build", { stdio: "inherit" });

console.log("[DeskPaper] Step 2: Running Electron-Builder to package Windows .exe...");
const cmd = `npx electron-builder --win portable -c.directories.output="${tempOut.replace(/\\/g, "/")}" -c.extraMetadata.author="DeskPaper"`;
execSync(cmd, { stdio: "inherit" });

console.log("[DeskPaper] Step 3: Copying DeskPaper.exe to project root...");
const files = fs.readdirSync(tempOut);
const exeFile = files.find(f => f.endsWith(".exe"));
if (exeFile) {
  const srcExe = path.join(tempOut, exeFile);
  const targetExe = path.join(process.cwd(), "DeskPaper.exe");
  fs.copyFileSync(srcExe, targetExe);
  const stats = fs.statSync(targetExe);
  const mb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[DeskPaper] SUCCESS! Standalone executable created: ${targetExe} (${mb} MB)`);
} else {
  console.error("[DeskPaper] No .exe found in", tempOut);
}

// Copy win-unpacked folder for instant launch without temp extraction delay
const unpackedSrc = path.join(tempOut, "win-unpacked");
const unpackedTarget = path.join(process.cwd(), "DeskPaper-App");
if (fs.existsSync(unpackedSrc)) {
  console.log("[DeskPaper] Step 4: Creating instant-launch folder DeskPaper-App...");
  if (fs.existsSync(unpackedTarget)) {
    fs.rmSync(unpackedTarget, { recursive: true, force: true });
  }
  fs.cpSync(unpackedSrc, unpackedTarget, { recursive: true });
  console.log(`[DeskPaper] SUCCESS! Unpacked app ready at: ${unpackedTarget}/DeskPaper.exe`);
}
