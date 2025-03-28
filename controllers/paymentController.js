const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  const { amount, currency, paymentMethodId, email, name, customerId } = req.body;

  try {
    let customer;

    // Si no hay customerId, crea un nuevo Customer en Stripe
    if (!customerId) {
      customer = await stripe.customers.create({
        name: name,
        email: email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } else {
      // Si hay customerId, obtén el Customer existente
      customer = await stripe.customers.retrieve(customerId);

      // Actualiza el método de pago del Customer
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Crear un PaymentIntent con Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      customer: customer.id,
      confirm: true,
      payment_method_types: ["card"],
      description: `Pago de suscripción para ${name} (${email})`,
      metadata: {
        customer_name: name,
        customer_email: email,
      },
    });

    // Devolver el clientSecret y el customerId al frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    });
  } catch (error) {
    // Manejar errores
    res.status(400).json({ error: error.message });
  }
};

module.exports = { createPaymentIntent };