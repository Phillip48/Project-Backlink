const router = require("express").Router();

const {
  upload,
} = require("../../controllers/gscController");

// Route
// /api/crawler
router.post("/gsc", upload);

module.exports = router;
