const express = require("express");
const router = express.Router();
const upload = require("../config/multer.config");
const {
  postGastoFromScan,
  confirmGasto,
} = require("../controllers/scanerController");
const token = require("../middleware/authMiddleware");

router.post(
  "/scan",
  token.verificarToken,
  upload.single("image"),
  postGastoFromScan
);

router.post("/confirm", confirmGasto);

module.exports = router;
