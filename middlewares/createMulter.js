const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const HttpError = require("../utils/httpError");
const httpStatus = require("../utils/httpStatus");
const { UPLOADS_ROOT } = require("../utils/uploads");

// whitelist (no svg / html / anything that can carry script)
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const createMulter = (folderName) => {
  const destination = path.join(UPLOADS_ROOT, folderName);
  fs.mkdirSync(destination, { recursive: true });

  const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      const ext = ALLOWED_TYPES[file.mimetype];
      cb(null, `${file.fieldname}-${Date.now()}-${crypto.randomUUID()}.${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);

    cb(
      HttpError.create(
        "only jpg, png, webp and gif images are allowed",
        httpStatus.BAD_REQUEST,
        httpStatus.FAIL
      ),
      false
    );
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });

  return {
    // multer + store the public path ("uploads/<folder>/<file>") in req.body[field],
    // which is exactly what the frontends prepend the server URL to
    single: (field) => [
      upload.single(field),
      (req, res, next) => {
        if (req.file) {
          req.body[field] = `uploads/${folderName}/${req.file.filename}`;
        }
        next();
      },
    ],
  };
};

module.exports = createMulter;
