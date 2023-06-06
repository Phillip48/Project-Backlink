const router = require("express").Router();

const {
  // upload,
  CSVCrawlLink
} = require("../../controllers/crawlController");

const {
  recheckDB
} = require("../../controllers/recheckLinks");

// Route
// /api/crawler
// manageArray
router.post("/upload", CSVCrawlLink);
router.get("/recheck", recheckDB);

module.exports = router;
