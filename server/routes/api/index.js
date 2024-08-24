const router = require('express').Router();
const linkRoutes = require('./linkRoutes');
const crawlerRoutes = require('./crawlerRoutes');
const gscRoutes = require('./gscRoutes');
const clientRoutes = require('./clientRoutes');

router.use('/get-link', linkRoutes);
router.use('/get-client', clientRoutes);
router.use('/crawler', crawlerRoutes);
router.use('/crawler', gscRoutes);


module.exports = router;
