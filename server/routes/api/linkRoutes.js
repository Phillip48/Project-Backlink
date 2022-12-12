const router = require('express').Router();

const {
    getLinks,
    getSingleLink,
    createLink,
    updateLink,
    deleteLink
} = require('../../controllers/linkController');

// Link Routes
router.route('/links').get(getLinks).post(createLink);
router.route('/links/:id').get(getSingleLink).delete(deleteLink).put(updateLink);

module.exports = router;