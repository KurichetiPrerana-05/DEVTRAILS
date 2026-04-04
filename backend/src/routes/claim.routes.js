const router = require('express').Router();
const claim = require('../controllers/claim.controller');

router.post('/create', claim.createClaim);

module.exports = router;