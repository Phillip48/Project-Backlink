const router = require("express").Router();

const {
  upload,
} = require("../../controllers/crawlController");

const {
  recheckDB
} = require("../../controllers/recheckLinks");

// Route
// /api/crawler
// manageArray
router.post("/upload", upload);
router.get("/recheck", recheckDB);

module.exports = router;
