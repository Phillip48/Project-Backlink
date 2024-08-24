const router = require('express').Router();

const {
    getClients,
    getSingleClient,
    createClient,
    updateClient,
    deleteClient
} = require('../../controllers/clientController');

// /api/get-link

// Link Routes
router.route('/client').get(getClients);
router.route('/client').post(createClient);
router.route('/clients/:id').get(getSingleClient).delete(deleteClient).put(updateClient);

module.exports = router;