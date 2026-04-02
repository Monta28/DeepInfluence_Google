const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ReferralController = require('../controllers/referrals/referralController');

router.post('/generate-code', verifyToken, ReferralController.generateReferralCode);
router.get('/stats', verifyToken, ReferralController.getReferralStats);
router.get('/my-referrals', verifyToken, ReferralController.getMyReferrals);

module.exports = router;
