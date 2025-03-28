const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Ruta para crear un PaymentIntent
router.post("/create-payment-intent", paymentController.createPaymentIntent);

module.exports = router;