const router = require("express").Router();
const express = require('express')
const app = express()
const multer = require('multer');
const {uploadLink} = require('../../middleware/multerUpload');

const {
  CSVCrawlLink,
  upload,
  manageArray,
  getListFiles,
  download,
} = require("../../controllers/crawlController");
const {
  recheckDB
} = require("../../controllers/recheckLinks");

// Route
// /api/crawler
// manageArray
router.post("/upload", upload);
router.post("/recheck", recheckDB);
router.get("/files", getListFiles);
router.get("/files/:name", download);

module.exports = router;
