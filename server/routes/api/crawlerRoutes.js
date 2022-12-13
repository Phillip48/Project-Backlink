const router = require('express').Router();
const {
    CSVCrawlLink
} = require('../../controllers/crawlController');

// /api/crawler
// Link Routes
router.route('/crawl').get(CSVCrawlLink);

module.exports = router;