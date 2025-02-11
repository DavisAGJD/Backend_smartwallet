const express = require('express');
const router = express.Router();
const upload = require('../config/multer.config');
const { postGastoFromScan } = require('../controllers/scanerController');
const token = require("../middleware/authMiddleware")

router.post('/scan', 
  token.verificarToken, 
  upload.single('image'), 
  postGastoFromScan
);

module.exports = router;