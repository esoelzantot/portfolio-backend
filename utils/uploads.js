const fs = require("fs/promises");
const path = require("path");

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

// only files created by createMulter ("<field>-<timestamp>[-<uuid>].<ext>"),
// never the shipped placeholder / seeded images
const GENERATED_FILE = /^[A-Za-z]+-\d{13}(-[0-9a-f-]{36})?\.[a-z]+$/;

// best-effort delete of an uploaded file that is no longer referenced
const removeUpload = async (publicPath) => {
  if (typeof publicPath !== "string") return;

  const absolute = path.resolve(__dirname, "..", publicPath);
  if (!absolute.startsWith(UPLOADS_ROOT + path.sep)) return; // path traversal guard
  if (!GENERATED_FILE.test(path.basename(absolute))) return;

  try {
    await fs.unlink(absolute);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("failed to remove upload", error);
  }
};

module.exports = { UPLOADS_ROOT, removeUpload };
