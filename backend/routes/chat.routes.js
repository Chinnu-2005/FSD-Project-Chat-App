const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/multer.middleware');
const {
    createOrGetPrivateChat,
    getUserChats,
    sendMessage,
    getChatMessages,
    markMessagesAsRead
} = require('../controllers/chat.controllers');

router.use(verifyJWT);

router.route('/').get(getUserChats);
router.route('/:userId').get(createOrGetPrivateChat);
router.route('/:chatId/messages').get(getChatMessages);
router.route('/:chatId/messages').post(upload.single('file'), sendMessage);
router.route('/:chatId/read').patch(markMessagesAsRead);

module.exports = router;