const router = require('express').Router();
const linkRoutes = require('./linkRoutes');
const crawlerRoutes = require('./crawlerRoutes');

router.use('/link', linkRoutes);
router.use('/crawler', crawlerRoutes);

module.exports = router;
