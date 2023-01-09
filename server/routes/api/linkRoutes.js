const router = require('express').Router();

const {
    getLinks,
    getSingleLink,
    // createLink,
    updateLink,
    deleteLink
} = require('../../controllers/linkController');

// /api/get-link

// Link Routes
router.route('/links').get(getLinks);
router.route('/links/:id').get(getSingleLink).delete(deleteLink).put(updateLink);

module.exports = router;