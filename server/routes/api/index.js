const router = require('express').Router();
const linkRoutes = require('./linkRoutes');

router.use('/link', linkRoutes);

module.exports = router;
