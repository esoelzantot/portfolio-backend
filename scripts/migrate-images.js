// One-time (safe to re-run) migration to Vercel Blob:
//   1. uploads every image in ./uploads to Blob as portfolio/static/<path>
//   2. rewrites any "uploads/..." path stored in MongoDB to its Blob URL
//
// usage: npm run migrate:images
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { put } = require("@vercel/blob");

const { STATIC_FOLDER, detectImage, staticImage } = require("../utils/uploads");

if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// collection -> image fields ("skillsList.image" is inside an array)
const IMAGE_FIELDS = {
  homes: ["imageSrc"],
  abouts: ["imageSrc"],
  projects: ["imgSrc"],
  users: ["avatar"],
  skills: ["skillsList.image"],
};

const listFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });

const toBlobUrl = (value) =>
  typeof value === "string" && value.startsWith("uploads/")
    ? staticImage(value.slice("uploads/".length))
    : value;

const uploadSeedImages = async () => {
  const files = listFiles(UPLOADS_DIR);
  console.log(`uploading ${files.length} images to Vercel Blob...`);

  for (const file of files) {
    const relative = path.relative(UPLOADS_DIR, file).split(path.sep).join("/");
    const buffer = fs.readFileSync(file);
    const image = detectImage(buffer);
    if (!image) {
      console.log(`  ✖ ${relative} (not a valid image, skipped)`);
      continue;
    }

    const blob = await put(`${STATIC_FOLDER}/${relative}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: image.type,
    });

    // the default image URLs are built from the token; make sure they match
    if (blob.url !== staticImage(relative)) {
      const origin = new URL(blob.url).origin;
      console.log(`\n  ! add this to your env vars (local .env and Vercel):\n    BLOB_PUBLIC_URL = ${origin}\n`);
      process.env.BLOB_PUBLIC_URL = origin;
    }
    console.log(`  ✔ ${relative}`);
  }
};

const rewriteDatabasePaths = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const db = mongoose.connection.db;

  for (const [collectionName, fields] of Object.entries(IMAGE_FIELDS)) {
    const collection = db.collection(collectionName);
    let changed = 0;

    for await (const doc of collection.find({})) {
      const update = {};

      for (const field of fields) {
        if (field === "skillsList.image") {
          const list = (doc.skillsList || []).map((item) => ({
            ...item,
            image: toBlobUrl(item.image),
          }));
          if (JSON.stringify(list) !== JSON.stringify(doc.skillsList || [])) {
            update.skillsList = list;
          }
        } else if (toBlobUrl(doc[field]) !== doc[field]) {
          update[field] = toBlobUrl(doc[field]);
        }
      }

      if (Object.keys(update).length) {
        await collection.updateOne({ _id: doc._id }, { $set: update });
        changed++;
      }
    }
    console.log(`  ${collectionName}: ${changed} document(s) updated`);
  }
};

(async () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not set");

  await uploadSeedImages();
  console.log("updating image paths in MongoDB...");
  await rewriteDatabasePaths();
  console.log("done ✔");
})()
  .catch((error) => {
    console.error("migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
