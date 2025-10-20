const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/multer.middleware');
const { uploadFile } = require('../controllers/upload.controllers');

router.use(verifyJWT);

router.route('/file').post(upload.single('file'), uploadFile);

module.exports = router;