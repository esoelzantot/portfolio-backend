const { put, del } = require("@vercel/blob"); // uses BLOB_READ_WRITE_TOKEN

const ROOT_FOLDER = "portfolio";
// images uploaded through the API (safe to delete when replaced)
const UPLOADS_FOLDER = `${ROOT_FOLDER}/uploads`;
// placeholder / seed images pushed once by scripts/migrate-images.js (never deleted)
const STATIC_FOLDER = `${ROOT_FOLDER}/static`;

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

// detect the real image type from the file's first bytes (never trust the
// client's mimetype / extension)
const IMAGE_SIGNATURES = [
  { ext: "png", type: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "gif", type: "image/gif", test: (b) => ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6)) },
  { ext: "webp", type: "image/webp", test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

const detectImage = (buffer) =>
  IMAGE_SIGNATURES.find((signature) => buffer.length > 12 && signature.test(buffer)) || null;

// "https://<store>.public.blob.vercel-storage.com" (set BLOB_PUBLIC_URL to override)
const blobBaseUrl = () => {
  if (process.env.BLOB_PUBLIC_URL) return process.env.BLOB_PUBLIC_URL.replace(/\/+$/, "");
  // token format: vercel_blob_rw_<storeId>_<secret>
  const storeId = (process.env.BLOB_READ_WRITE_TOKEN || "").split("_")[3];
  return `https://${(storeId || "missing-blob-token").toLowerCase()}${BLOB_HOST_SUFFIX}`;
};

// returns the public URL; throws if the content is not an allowed image
const uploadImage = async (buffer, folder, name = "image") => {
  const image = detectImage(buffer);
  if (!image) {
    const error = new Error("invalid image file");
    error.code = "INVALID_IMAGE";
    throw error;
  }

  const blob = await put(`${UPLOADS_FOLDER}/${folder}/${name}.${image.ext}`, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: image.type,
  });
  return blob.url;
};

// best-effort delete of an uploaded image that is no longer referenced
const removeUpload = async (url) => {
  if (typeof url !== "string") return;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return; // not a URL (e.g. legacy "uploads/..." path)
  }
  if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return;
  if (!parsed.pathname.startsWith(`/${UPLOADS_FOLDER}/`)) return;

  try {
    await del(url);
  } catch (error) {
    console.error("failed to remove image", url, error.message);
  }
};

// URL of a seed image, e.g. staticImage("projects/project-img.jpg")
const staticImage = (relativePath) => `${blobBaseUrl()}/${STATIC_FOLDER}/${relativePath}`;

module.exports = { STATIC_FOLDER, detectImage, uploadImage, removeUpload, staticImage };
