const multer=require('multer');
const fs = require('fs');
const path = require('path');

// Ensure temp directory exists
const tempDir = './public/temp';
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, tempDir)
    },
    filename:function(req,file,cb){
        // Add timestamp to prevent filename conflicts
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName)
    }
})

const upload=multer({
    storage,
})

module.exports = { upload }