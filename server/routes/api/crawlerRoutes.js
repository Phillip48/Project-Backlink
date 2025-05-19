const router = require("express").Router();

const {
  // upload,
  CSVCrawlLink
} = require("../../controllers/crawlController");
const {
  // upload,
  CSVH2CrawlLink, 
  CSVH2CrawlLinkURL
} = require("../../controllers/crawlController");


const {
  recheckDB
} = require("../../controllers/recheckLinks");

// Route
// /api/crawler
// manageArray
router.post("/upload", CSVCrawlLink);
router.post("/upload2", CSVH2CrawlLink);
router.post("/upload3", CSVH2CrawlLinkURL);
router.get("/recheck", recheckDB);

module.exports = router;
