const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/multer.middleware');
const {
    getUserProfile,
    updateProfile,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    getConnections,
    getPendingRequests,
    searchUsers
} = require('../controllers/user.controllers');

router.use(verifyJWT);

router.route('/profile').get(getUserProfile);
router.route('/profile').patch(upload.single('avatar'), updateProfile);
router.route('/connections').get(getConnections);
router.route('/pending-requests').get(getPendingRequests);
router.route('/search').get(searchUsers);
router.route('/connect/:userId').post(sendConnectionRequest);
router.route('/accept/:userId').post(acceptConnectionRequest);
router.route('/decline/:userId').post(declineConnectionRequest);

module.exports = router;