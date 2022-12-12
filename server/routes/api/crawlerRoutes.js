const router = require('express').Router();

const {
    CSVCrawlLink
} = require('../../controllers/crawlController');

// Link Routes
router.route('/crawl').get(CSVCrawlLink);

module.exports = router;