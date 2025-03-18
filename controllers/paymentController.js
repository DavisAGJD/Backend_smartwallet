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
        payment_method: paymentMethodId, // Asociar el método de pago
        invoice_settings: {
          default_payment_method: paymentMethodId, // Método de pago por defecto
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
      amount, // Monto en centavos (ejemplo: 1000 = $10.00)
      currency, // 'mxn' para pesos mexicanos
      payment_method: paymentMethodId, // ID del PaymentMethod
      customer: customer.id, // Asociar el Customer
      confirm: true, // Confirmar el pago automáticamente
      payment_method_types: ["card"], // Solo tarjetas
      description: `Pago de suscripción para ${name} (${email})`, // Descripción del pago
      metadata: {
        customer_name: name, // Nombre del cliente
        customer_email: email, // Correo electrónico del cliente
      },
    });

    // Devolver el clientSecret y el customerId al frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id, // Enviar el customerId para futuras renovaciones
    });
  } catch (error) {
    // Manejar errores
    res.status(400).json({ error: error.message });
  }
};

module.exports = { createPaymentIntent };