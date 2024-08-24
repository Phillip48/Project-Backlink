const router = require('express').Router();

const {
    getClients,
    getSingleClient,
    createClient,
    updateClient,
    deleteClient
} = require('../../controllers/clientController');

// /api/get-client

// Client Routes
router.route('/client').get(getClients);
router.route('/client-create').post(createClient);
router.route('/clients/:id').get(getSingleClient).delete(deleteClient).put(updateClient);

module.exports = router;