const multer = require("multer");

const HttpError = require("../utils/httpError");
const httpStatus = require("../utils/httpStatus");
const { uploadImage } = require("../utils/uploads");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const createMulter = (folderName) => {
  const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);

    cb(
      HttpError.create(
        "only jpg, png, webp and gif images are allowed",
        httpStatus.BAD_REQUEST,
        httpStatus.FAIL
      ),
      false
    );
  };

  // kept in memory and sent to Vercel Blob: serverless hosts have no
  // persistent disk
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });

  return {
    // multer + upload to Vercel Blob, then put the image URL in req.body[field]
    single: (field) => [
      upload.single(field),
      async (req, res, next) => {
        if (!req.file) return next();

        try {
          const url = await uploadImage(req.file.buffer, folderName, field);
          req.uploadedImage = url; // removed by the error handler if the request fails
          req.body[field] = url;
          next();
        } catch (error) {
          const invalid = error.code === "INVALID_IMAGE";
          if (!invalid) console.error("image upload failed:", error.message);
          next(
            HttpError.create(
              invalid ? "invalid image file" : "image upload failed",
              invalid ? httpStatus.BAD_REQUEST : 502,
              httpStatus.FAIL
            )
          );
        }
      },
    ],
  };
};

module.exports = createMulter;
