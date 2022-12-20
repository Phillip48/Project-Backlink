const router = require("express").Router();
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

// Link Routes
// router.route("/read-csv-and-crawl").get(CSVCrawlLink);
// router.route("/upload").post(upload.single("file"), readCSV);
router.post("/upload", upload);
router.post("/uploadv2", uploadv2);
router.get("/files", getListFiles);
router.get("/files/:name", download);

module.exports = router;
