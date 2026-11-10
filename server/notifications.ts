import nodemailer from "nodemailer";
import webpush from "web-push";
import { storage } from "./storage";
import type { Order, Customer } from "@shared/schema";

// ---------------------------------------------------------------------------
// This module is intentionally fail-safe: if email or push isn't configured
// yet (missing env vars), it logs a warning ONCE and skips silently. It must
// NEVER throw, and must NEVER block or break the order/registration request
// that triggered it. Callers should always invoke these with .catch() and
// never await them inline in the critical request path.
// ---------------------------------------------------------------------------

let warnedMissingEmailConfig = false;
let warnedMissingCustomerEmailConfig = false;
let warnedMissingVapidConfig = false;
let vapidConfigured = false;

function getEmailTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    if (!warnedMissingEmailConfig) {
      console.warn("[notifications] GMAIL_USER / GMAIL_APP_PASSWORD not set — email notifications are disabled.");
      warnedMissingEmailConfig = true;
    }
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function getCustomerEmailTransport() {
  const user = process.env.CUSTOMER_GMAIL_USER || "ifixelectronics@gmail.com";
  const pass = process.env.CUSTOMER_GMAIL_APP_PASSWORD;
  if (!pass) {
    if (!warnedMissingCustomerEmailConfig) {
      console.warn("[notifications] CUSTOMER_GMAIL_APP_PASSWORD not set — customer email notifications are disabled.");
      warnedMissingCustomerEmailConfig = true;
    }
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    if (!warnedMissingVapidConfig) {
      console.warn("[notifications] VAPID keys not set — browser push notifications are disabled.");
      warnedMissingVapidConfig = true;
    }
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

async function notifyAdminsByEmail(subject: string, html: string): Promise<void> {
  try {
    const transport = getEmailTransport();
    if (!transport) return;
    const admins = await storage.getAdmins();
    const recipients = admins.map(a => a.email).filter(Boolean);
    if (recipients.length === 0) return;
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients.join(", "),
      subject,
      html,
    });
  } catch (error) {
    console.error("[notifications] Failed to send admin email:", error);
  }
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] || character);
}

function getCustomerPaymentStatus(order: Order): string {
  if (order.paymentMethod === "MTN Mobile Money") {
    if (order.paymentState === "SUCCEEDED") return "Paid";
    if (order.paymentState === "FAILED" || order.paymentState === "CANCELLED") return "Not completed";
    return "Awaiting confirmation";
  }
  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "completed") {
    return "Paid";
  }
  if (order.paymentMethod === "Cash on Delivery") return "Due on delivery";
  return "Awaiting confirmation";
}

function formatOrderAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${escapeHtml(currency)}`;
}

function renderOrderSummary(order: Order): string {
  const rows = (order.items || []).map((item) => `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #e8edf5;color:#182230;font-size:14px;line-height:20px">
        <strong>${escapeHtml(item.name)}</strong>
        ${item.storage ? `<br><span style="color:#64748b;font-size:12px">${escapeHtml(item.storage)}</span>` : ""}
        ${item.color ? `<span style="color:#64748b;font-size:12px">${item.storage ? " · " : "<br>"}${escapeHtml(item.color)}</span>` : ""}
      </td>
      <td style="padding:14px 8px;border-bottom:1px solid #e8edf5;text-align:center;color:#475569;font-size:14px;vertical-align:top">${item.quantity}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #e8edf5;text-align:right;color:#182230;font-size:14px;white-space:nowrap;vertical-align:top">${formatOrderAmount(item.price * item.quantity, order.currency)}</td>
    </tr>
  `).join("");
  const tracking = order.trackingCode ? escapeHtml(order.trackingCode) : String(order.id);
  const status = escapeHtml(order.status.replace(/[_-]/g, " "));
  const paymentStatus = getCustomerPaymentStatus(order);
  const paymentTone = paymentStatus === "Paid"
    ? { background: "#e8f8ef", color: "#137a43" }
    : paymentStatus === "Not completed"
      ? { background: "#fff0ed", color: "#b93825" }
      : { background: "#fff7df", color: "#8a5a00" };

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3eaf4;border-radius:14px;border-collapse:separate;background:#ffffff">
      <tr><td style="padding:20px 20px 8px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;letter-spacing:1.2px;font-weight:bold;color:#64748b">ORDER SUMMARY</td>
            <td align="right" style="font-size:13px;color:#64748b">#${tracking}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 20px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 0 12px;color:#64748b;font-size:13px">Order status</td>
            <td align="right" style="padding:0 0 12px;text-align:right;color:#182230;font-size:13px;font-weight:bold;text-transform:capitalize">${status}</td>
          </tr>
          <tr>
            <td style="color:#64748b;font-size:13px">Payment status</td>
            <td align="right" style="text-align:right"><span style="display:inline-block;padding:6px 10px;border-radius:20px;background:${paymentTone.background};color:${paymentTone.color};font-size:12px;font-weight:bold">${escapeHtml(paymentStatus)}</span></td>
          </tr>
          <tr>
            <td style="padding-top:12px;color:#64748b;font-size:13px">Payment method</td>
            <td align="right" style="padding-top:12px;text-align:right;color:#182230;font-size:13px">${escapeHtml(order.paymentMethod || "Not specified")}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <thead><tr style="background:#f4f7fb">
            <th align="left" style="padding:10px 12px;color:#64748b;font-size:11px;letter-spacing:.6px">ITEM</th>
            <th align="center" style="padding:10px 8px;color:#64748b;font-size:11px;letter-spacing:.6px">QTY</th>
            <th align="right" style="padding:10px 12px;color:#64748b;font-size:11px;letter-spacing:.6px">AMOUNT</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="3" style="padding:16px 12px;color:#64748b;font-size:13px">Order items</td></tr>`}</tbody>
        </table>
      </td></tr>
      <tr><td style="padding:16px 20px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Delivery</td><td align="right" style="padding:5px 0;color:#182230;font-size:13px">${formatOrderAmount(order.deliveryFee || 0, order.currency)}</td></tr>
          <tr><td style="padding-top:14px;border-top:1px solid #e8edf5;color:#182230;font-size:16px;font-weight:bold">Total</td><td align="right" style="padding-top:14px;border-top:1px solid #e8edf5;color:#0066ff;font-size:18px;font-weight:bold;white-space:nowrap">${formatOrderAmount(order.totalAmount, order.currency)}</td></tr>
        </table>
      </td></tr>
    </table>
    ${order.trackingCode ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
        <tr><td align="center">
          <a href="https://ifix.rw/track-order" style="display:inline-block;background:#0066ff;border-radius:10px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:13px 22px">Track your order</a>
        </td></tr>
        <tr><td align="center" style="padding-top:10px;color:#64748b;font-size:12px;line-height:18px">Tracking code: <strong style="color:#182230">${tracking}</strong><br>Use the phone number from checkout to look up your order.</td></tr>
      </table>
    ` : ""}
  `;
}

async function sendCustomerEmail(order: Order, subject: string, heading: string, message: string): Promise<void> {
  if (!order.customerEmail) return;
  try {
    const transport = getCustomerEmailTransport();
    if (!transport) return;
    await transport.sendMail({
      from: process.env.CUSTOMER_GMAIL_USER || "ifixelectronics@gmail.com",
      to: order.customerEmail,
      text: `${heading}\n\nHello ${order.customerName},\n\n${message}\n\nOrder ${order.trackingCode || `#${order.id}`} | Order status: ${order.status} | Payment status: ${getCustomerPaymentStatus(order)}\nTotal: ${order.totalAmount.toLocaleString()} ${order.currency}\n\nThank you for shopping with IFIX.`,
      subject,
      html: `
        <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${escapeHtml(message)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background:#f2f5fa;font-family:Arial,Helvetica,sans-serif;color:#182230">
          <tr><td align="center" style="padding:28px 12px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden">
              <tr><td style="height:7px;background:#0066ff;font-size:0;line-height:0">&nbsp;</td></tr>
              <tr><td style="padding:24px 28px;border-bottom:1px solid #edf1f6">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td width="120" valign="middle"><img src="https://ifix.rw/ifix-logo.png" width="112" height="52" alt="IFIX Technology" style="display:block;width:112px;height:auto;object-fit:contain;border:0"></td>
                  <td valign="middle" style="font-size:20px;line-height:24px;font-weight:bold;letter-spacing:-.4px;color:#111827">IFIX <span style="color:#0066ff">ELECTRONICS</span><br><span style="font-size:11px;line-height:18px;font-weight:normal;letter-spacing:1.2px;color:#64748b">WHERE GADGETS MEET GREAT DEALS</span></td>
                  <td align="right" valign="middle" style="font-size:11px;color:#64748b">ORDER UPDATE</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:30px 28px 14px">
                <div style="font-size:12px;font-weight:bold;letter-spacing:1.1px;color:#0066ff;text-transform:uppercase">Hello ${escapeHtml(order.customerName)}</div>
                <h1 style="margin:9px 0 10px;font-size:26px;line-height:32px;letter-spacing:-.6px;color:#111827">${escapeHtml(heading)}</h1>
                <p style="margin:0;color:#64748b;font-size:14px;line-height:22px">${escapeHtml(message)}</p>
              </td></tr>
              <tr><td style="padding:12px 28px 28px">${renderOrderSummary(order)}</td></tr>
              <tr><td style="padding:20px 28px;background:#f7f9fc;border-top:1px solid #edf1f6;text-align:center">
                <p style="margin:0 0 7px;color:#334155;font-size:13px;font-weight:bold">Thank you for choosing IFIX</p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:19px">Questions about your order? <a href="mailto:ifixelectronics@gmail.com" style="color:#0066ff;text-decoration:none">Contact our team</a></p>
                <p style="margin:12px 0 0;color:#94a3b8;font-size:11px">Kigali, Rwanda · <a href="https://ifix.rw" style="color:#64748b;text-decoration:none">ifix.rw</a></p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      `,
    });
  } catch (error) {
    console.error("[notifications] Failed to send customer order email:", error);
  }
}

export async function notifyCustomerOrderConfirmation(order: Order): Promise<void> {
  await sendCustomerEmail(
    order,
    `Order confirmation${order.trackingCode ? ` — ${order.trackingCode}` : ""}`,
    "We received your order",
    "This is your order confirmation and invoice summary. We will email you when your payment or order status changes."
  );
}

export async function notifyCustomerPaymentStatus(order: Order): Promise<void> {
  if (order.paymentState !== "SUCCEEDED" && order.paymentState !== "FAILED" && order.paymentState !== "CANCELLED") return;
  const completed = order.paymentState === "SUCCEEDED";
  await sendCustomerEmail(
    order,
    `Payment ${completed ? "completed" : "not completed"}${order.trackingCode ? ` — ${order.trackingCode}` : ""}`,
    completed ? "Payment confirmed" : "Payment was not completed",
    completed
      ? "The payment provider has confirmed your payment."
      : "The payment provider did not confirm a completed payment. Please do not assume the order is paid; contact us if you believe you were charged."
  );
}

export async function notifyCustomerOrderStatus(order: Order): Promise<void> {
  await sendCustomerEmail(
    order,
    `Order status: ${order.status}${order.trackingCode ? ` — ${order.trackingCode}` : ""}`,
    `Your order is ${order.status}`,
    `Your order status has been updated to ${order.status}.`
  );
}

async function notifyAdminsByPush(title: string, body: string, url: string): Promise<void> {
  try {
    if (!ensureVapidConfigured()) return;
    const subscriptions = await storage.getAllPushSubscriptions();
    if (subscriptions.length === 0) return;
    const payload = JSON.stringify({ title, body, url });
    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (error: any) {
        // Clean up subscriptions the browser has revoked or that have expired
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await storage.deletePushSubscriptionByEndpoint(sub.endpoint).catch(() => {});
        } else {
          console.error("[notifications] Push send failed for one subscription:", error);
        }
      }
    }));
  } catch (error) {
    console.error("[notifications] Failed to send admin push notifications:", error);
  }
}

export async function notifyNewOrder(order: Order): Promise<void> {
  const amount = `${order.totalAmount.toLocaleString()} RWF`;
  const subject = `New order from ${order.customerName} — ${amount}`;
  const html = `
    <h2>New order received</h2>
    <p><strong>Customer:</strong> ${order.customerName}</p>
    <p><strong>Phone:</strong> ${order.customerPhone}</p>
    <p><strong>Total:</strong> ${amount}</p>
    ${order.trackingCode ? `<p><strong>Tracking code:</strong> ${order.trackingCode}</p>` : ""}
  `;
  await Promise.all([
    notifyAdminsByEmail(subject, html),
    notifyAdminsByPush("New order", `${order.customerName} — ${amount}`, "/admin/orders"),
  ]);
}

export async function notifyNewCustomer(customer: Customer): Promise<void> {
  const subject = `New customer registered — ${customer.fullName}`;
  const html = `
    <h2>New customer account created</h2>
    <p><strong>Name:</strong> ${customer.fullName}</p>
    <p><strong>Email:</strong> ${customer.email}</p>
    <p><strong>Phone:</strong> ${customer.phone || "—"}</p>
  `;
  await Promise.all([
    notifyAdminsByEmail(subject, html),
    notifyAdminsByPush("New customer", `${customer.fullName} just signed up`, "/admin/customers"),
    sendNewCustomerWelcomeEmail(customer),
  ]);
}

async function sendNewCustomerWelcomeEmail(customer: Customer): Promise<void> {
  try {
    const transport = getCustomerEmailTransport();
    if (!transport) return;
    const sender = process.env.CUSTOMER_GMAIL_USER || "ifixelectronics@gmail.com";
    const name = escapeHtml(customer.fullName || "there");
    await transport.sendMail({
      from: sender,
      to: customer.email,
      subject: "Welcome to IFIX",
      text: `Hello ${customer.fullName || "there"},\n\nYour IFIX customer account is ready. You can sign in with Google any time to view your account and orders.\n\nWelcome to IFIX.`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:24px auto;padding:28px;border:1px solid #e5eaf2;border-radius:16px;color:#182230"><h1 style="font-size:22px">Welcome to IFIX</h1><p>Hello ${name},</p><p>Your customer account is ready. You can sign in with Google any time to view your account and orders.</p><p>Thank you,<br>IFIX</p><a href="https://ifix.rw" style="color:#06f">Visit our store</a></div>`,
    });
  } catch (error) {
    console.error("[notifications] Failed to send new customer welcome email:", error);
  }
}
