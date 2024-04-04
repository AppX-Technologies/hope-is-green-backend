const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  uploadFiles,
  getFiles,
  streamFile,
  deleteFile,
  uploadFileFromBase64,
  getFileAsBase64,
} = require("../controllers/fileController");

const { upload } = require("../config/db");
router.route("/").post(protect(), upload.single("file"), uploadFiles);
router.route("/base64").post(protect(), uploadFileFromBase64);
router.route("/base64/:fileName").get(protect(), getFileAsBase64);
router.route("/").get(protect(), getFiles);
router
  .route("/:fileName")
  .get(protect(), getFiles)
  .delete(protect(), deleteFile);
router.route("/stream/:fileName").get(protect(), streamFile);

module.exports = router;
