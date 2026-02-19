const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const minioClient = new S3Client({
  region: process.env.MINIO_REGION || "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const s3Storage = multerS3({
  s3: minioClient,
  bucket: "gdrive-bucket",
  metadata: (req, file, cb) => {
    cb(null, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      owner: req.session.userId,
    });
  },
  key: (req, file, cb) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) return cb(err);
      const name = buf.toString("hex");
      const date = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `${name}-${date}${ext}`;
      cb(null, filename);
    });
  },
});
const upload = multer({ storage: s3Storage });

module.exports = { minioClient, upload };
