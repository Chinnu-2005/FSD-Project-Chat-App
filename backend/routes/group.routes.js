const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/multer.middleware');
const {
    createGroup,
    getUserGroups,
    getGroupDetails,
    sendGroupMessage,
    getGroupMessages,
    addMember,
    removeMember,
    promoteToAdmin,
    updateGroup,
    leaveGroup
} = require('../controllers/group.controllers');

router.use(verifyJWT);

router.route('/').get(getUserGroups);
router.route('/').post(createGroup);
router.route('/:groupId').get(getGroupDetails);
router.route('/:groupId').patch(upload.single('groupImage'), updateGroup);
router.route('/:groupId/messages').get(getGroupMessages);
router.route('/:groupId/messages').post(upload.single('file'), sendGroupMessage);
router.route('/:groupId/add-member').post(addMember);
router.route('/:groupId/remove-member').post(removeMember);
router.route('/:groupId/promote').post(promoteToAdmin);
router.route('/:groupId/leave').post(leaveGroup);

module.exports = router;