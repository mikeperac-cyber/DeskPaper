const fs = require("fs");
const path = require("path");

const viteChunkPath = path.join(__dirname, "../node_modules/vite/dist/node/chunks/node.js");

if (fs.existsSync(viteChunkPath)) {
  let content = fs.readFileSync(viteChunkPath, "utf8");
  const target = "const postfixRE = /[?#].*$/;";
  const replacement = "const postfixRE = /[?].*$|#[^/\\\\\\]*$/;";
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(viteChunkPath, content, "utf8");
    console.log("[DeskPaper] Applied Vite hash-path patch for Windows directory support.");
  } else {
    console.log("[DeskPaper] Vite already patched or target pattern not found.");
  }
}
