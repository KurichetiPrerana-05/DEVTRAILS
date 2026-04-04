const claimService = require('../services/claim.service');

exports.createClaim = async (req, res) => {
  try {
    const result = await claimService.processClaim(req.body);
    res.json(result);
  } catch (err) {
    console.error('[CreateClaim Controller Error]', err);
    res.status(500).json({ error: err.message });
  }
};