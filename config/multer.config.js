const multer = require("multer");

// Configura multer para almacenar los archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
