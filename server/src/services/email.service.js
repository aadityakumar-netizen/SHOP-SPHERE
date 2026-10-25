
import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

const transporter =
  emailUser && emailPassword
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword.replace(/\s/g, ''),
        },
      })
    : null;

export const sendOrderConfirmationEmail = async ({
  to,
  customerName,
  orderId,
  orderItems = [],
  totalAmountPaise,
  paymentMethod = 'Online Payment',
  paymentStatus = 'paid',
  shippingAddress,
}) => {
  if (!transporter) {
    console.error('[EMAIL] Gmail credentials are not configured.');
    return { sent: false, reason: 'not_configured' };
  }

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('[EMAIL] A valid customer email is required.');
    return { sent: false, reason: 'invalid_recipient' };
  }

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);

  const productRows = orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding:10px;text-align:center;border-bottom:1px solid #eee">
            ${Number(item.quantity) || 0}
          </td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee">
            ₹${((Number(item.lineTotalPaise) || 0) / 100).toFixed(2)}
          </td>
        </tr>`
    )
    .join('');

  const address = shippingAddress
    ? [
        shippingAddress.fullName,
        shippingAddress.street,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postalCode,
        shippingAddress.country,
      ]
        .filter(Boolean)
        .map(escapeHtml)
        .join('<br>')
    : 'Your saved delivery address';

  const isPaid = paymentStatus === 'paid';
  const amount = (Number(totalAmountPaise || 0) / 100).toFixed(2);

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'ShopSphere'}" <${emailUser}>`,
      to,
      subject: `Order ${isPaid ? 'confirmed' : 'placed'} — ShopSphere #${String(orderId).slice(-8)}`,
      text: [
        `Hello ${customerName || 'Customer'},`,
        `Your ShopSphere order has been ${isPaid ? 'confirmed' : 'placed'}.`,
        `Order ID: ${orderId}`,
        `Payment method: ${paymentMethod}`,
        `Payment status: ${paymentStatus}`,
        `Total: INR ${amount}`,
        `Delivery address: ${shippingAddress ? `${shippingAddress.fullName}, ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postalCode}, ${shippingAddress.country || 'India'}` : 'As provided at checkout'}`,
        'Thank you for shopping with ShopSphere.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#222;max-width:620px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#171717;color:#fff;padding:24px">
            <h1 style="margin:0">ShopSphere</h1>
            <p style="margin:8px 0 0">Your shopping, confirmed.</p>
          </div>
          <div style="padding:24px">
            <h2>Hello ${escapeHtml(customerName || 'Customer')}!</h2>
            <p>Your order has been ${isPaid ? 'confirmed' : 'placed'} successfully.</p>
            <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
            <p><strong>Payment method:</strong> ${escapeHtml(paymentMethod)}</p>
            <p><strong>Payment status:</strong> ${escapeHtml(paymentStatus)}</p>
            <h3>Order summary</h3>
            <table style="width:100%;border-collapse:collapse">
              <thead><tr>
                <th style="text-align:left;padding:10px;background:#f7f7f7">Product</th>
                <th style="padding:10px;background:#f7f7f7">Qty</th>
                <th style="text-align:right;padding:10px;background:#f7f7f7">Amount</th>
              </tr></thead>
              <tbody>${productRows}</tbody>
            </table>
            <h3 style="text-align:right">Total: ₹${amount}</h3>
            <h3>Delivery address</h3>
            <p style="line-height:1.7">${address}</p>
            <p>We'll notify you when your order status changes.</p>
            <p>Thank you for shopping with ShopSphere!</p>
          </div>
        </div>
      `,
    });

    console.log('[EMAIL] Confirmation sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Failed to send confirmation:', error.message);
    return { sent: false, reason: 'send_failed' };
  }
};
