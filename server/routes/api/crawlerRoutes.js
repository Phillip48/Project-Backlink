const router = require("express").Router();
const express = require('express')
const app = express()
const multer = require('multer');
const {uploadLink} = require('../../middleware/multerUpload');

const {
  CSVCrawlLink,
  upload,
  getListFiles,
  download,
} = require("../../controllers/crawlController");

const {
  CSVCrawlLinkv2,
  uploadv2,
} = require("../../controllers/crawlControllerV2");

// Route
// /api/crawler

router.post("/upload", upload);
router.post('/upload2', uploadLink.single("csvFile"), function (req, res) {
  res.end("File Upload successfull: Here it is!: "+JSON.stringify(req.file))
});
// router.post("/upload", uploadMulter.single('csvFile'));
router.post("/uploadv2", uploadv2);
router.get("/files", getListFiles);
router.get("/files/:name", download);

module.exports = router;
