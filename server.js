// Pookie Pads server: serves the site and handles orders, payments, SMS and email.
// No dependencies. Needs Node 18+ (for built-in fetch). Configure with a .env file (see .env.example).
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data");
fs.mkdirSync(DATA, { recursive: true });

loadEnv(path.join(ROOT, ".env"));
const env = process.env;
const PORT = Number(env.PORT || 5173);
const STORE_NAME = env.STORE_NAME || "Pookie Pads by Azalea Hygiene";

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "catalog.json"), "utf8"));
const productsById = Object.fromEntries(catalog.products.map((p) => [p.id, p]));

const onlinePayments = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
const smsEnabled = Boolean(env.FAST2SMS_API_KEY);
const emailEnabled = Boolean(env.BREVO_API_KEY && env.EMAIL_FROM);
// UPI details come from catalog.json; UPI_ID / UPI_NAME environment variables override them
const UPI_ID = (env.UPI_ID || (catalog.upi && catalog.upi.id) || "").trim();
const UPI_NAME = (env.UPI_NAME || (catalog.upi && catalog.upi.name) || "Azalea Hygiene").trim();
const UPI_PREFILL = env.UPI_PREFILL_AMOUNT ? env.UPI_PREFILL_AMOUNT === "true" : Boolean(catalog.upi && catalog.upi.prefillAmount);
const SHEET_URL = (env.ORDER_SHEET_URL || "").trim();
const SHEET_SECRET = (env.ORDER_SHEET_SECRET || "").trim();
const sheetEnabled = /^https:\/\/script\.google\.com\/macros\/s\//.test(SHEET_URL) && SHEET_SECRET.length >= 8;
const upiEnabled = /^[\w.\-]{2,256}@[a-zA-Z][a-zA-Z0-9.\-]{1,64}$/.test(UPI_ID);

// ---------- helpers ----------
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function readJson(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")); } catch { return fallback; }
}

function writeJson(name, value) {
  const file = path.join(DATA, name);
  fs.writeFileSync(file + ".tmp", JSON.stringify(value, null, 2));
  fs.renameSync(file + ".tmp", file);
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 20_000) { reject(new Error("too_large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(new Error("bad_json")); }
    });
    req.on("error", reject);
  });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rupees = (n) => "Rs " + n.toLocaleString("en-IN");

// A few requests per minute per IP is plenty for real customers
const hits = new Map();
function limited(req, key, max) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
  const id = `${key}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(id, recent);
  return recent.length > max;
}

// ---------- notifications ----------
async function sendSms(phone, message) {
  if (!smsEnabled) {
    console.log(`[sms:demo] to ${phone}: ${message}`);
    return false;
  }
  try {
    const r = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: env.FAST2SMS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "q", message, language: "english", flash: 0, numbers: phone }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body.return === false) {
      console.error("[sms] Fast2SMS error:", r.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[sms] failed:", e.message);
    return false;
  }
}

// Calls the owner's Google Apps Script (sheet rows, club members and Gmail sending all go through it)
async function postToScript(payload) {
  if (!sheetEnabled) return { ok: false, error: "sheet not set up" };
  try {
    // Apps Script answers with a redirect to the result; follow it and read the JSON
    const r = await fetch(SHEET_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ secret: SHEET_SECRET, ...payload }), redirect: "follow" });
    const body = await r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` }));
    if (!body.ok) console.error(`[script] ${payload.type || "order"} failed:`, body.error || r.status);
    return body;
  } catch (e) {
    console.error("[script] failed:", e.message);
    return { ok: false, error: e.message };
  }
}

// Brevo when its key is set; otherwise the Google script sends from the owner's Gmail
async function sendEmail(to, subject, html) {
  if (!emailEnabled && sheetEnabled) return (await postToScript({ type: "email", to, subject, html })).ok === true;
  if (!emailEnabled) {
    console.log(`[email:demo] to ${to}: ${subject}`);
    return false;
  }
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: env.EMAIL_FROM_NAME || STORE_NAME, email: env.EMAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!r.ok) {
      console.error("[email] Brevo error:", r.status, await r.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] failed:", e.message);
    return false;
  }
}

// New-order and new-member alerts: ORDER_EMAIL_TO if set, else the Google account that owns the sheet
function notifyOwner(subject, html) {
  const to = env.ORDER_EMAIL_TO || (sheetEnabled && !emailEnabled ? "owner" : "");
  return to ? sendEmail(to, subject, html) : Promise.resolve(false);
}

const paymentLabel = (o) => o.payment === "online" ? "Paid online (Razorpay)"
  : o.payment === "upi" ? `UPI, transaction ID ${esc(o.upiRef || "not entered")}. Check it in your bank app before dispatching.`
  : "Cash on delivery";

function orderEmailHtml(o) {
  const rows = o.items.map((i) => `<tr><td>${esc(i.size)} - ${i.pads} pads</td><td align="center">${i.qty}</td><td align="right">${rupees(i.lineTotal)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;color:#3B0A2A">
    <h2 style="margin:0 0 8px">New order ${esc(o.id)}</h2>
    <p style="margin:0 0 16px">Payment: <b>${paymentLabel(o)}</b></p>
    <table cellpadding="6" style="border-collapse:collapse;min-width:320px">
      <tr style="background:#FFE3F0"><th align="left">Item</th><th>Qty</th><th align="right">Total</th></tr>${rows}
      <tr><td colspan="2"><b>Order total</b></td><td align="right"><b>${rupees(o.total)}</b></td></tr>
    </table>
    <p style="margin:20px 0 0"><a href="${whatsappLink(o)}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Send WhatsApp confirmation to ${esc(o.customer.name.split(" ")[0])}</a></p>
    <h3 style="margin:20px 0 6px">Deliver to</h3>
    <p style="margin:0">${esc(o.customer.name)}<br>+91 ${esc(o.customer.phone)}<br>${esc(o.customer.address)}<br>${esc(o.customer.city)} ${esc(o.customer.pincode)}</p>
    <p style="margin:16px 0 0;color:#6B3A5A">Placed ${new Date(o.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
  </div>`;
}

// A wa.me link that opens WhatsApp (on whichever phone taps it) with the confirmation already typed
function whatsappLink(order) {
  const items = order.items.map((i) => `${i.size} ${i.pads} pads × ${i.qty}`).join(", ");
  const pay = order.payment === "upi" ? `paid by UPI, ref ${order.upiRef || "pending"}` : order.payment === "online" ? "paid online" : "cash on delivery";
  const text = `Hi ${order.customer.name.split(" ")[0]}, your Pookie Pads order ${order.id} is received!\n` +
    `Items: ${items}\nTotal: Rs ${order.total}, ${pay}\n` +
    `We'll deliver to ${order.customer.city} soon. Thank you!\n- Team Pookie, Azalea Hygiene`;
  return `https://wa.me/91${order.customer.phone}?text=${encodeURIComponent(text)}`;
}

// Appends the order as a row in the owner's Google Sheet (via a small Apps Script web app)
async function logToSheet(order) {
  if (!sheetEnabled) return false;
  const row = {
    secret: SHEET_SECRET,
    placedAt: new Date(order.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    orderId: order.id,
    name: order.customer.name,
    phone: "+91 " + order.customer.phone,
    address: order.customer.address,
    city: order.customer.city,
    pincode: order.customer.pincode,
    items: order.items.map((i) => `${i.size} ${i.pads} pads × ${i.qty}`).join(", "),
    packs: order.items.reduce((n, i) => n + i.qty, 0),
    pads: order.items.reduce((n, i) => n + i.qty * i.pads, 0),
    total: order.total,
    payment: order.payment === "upi" ? "UPI" : order.payment === "online" ? "Online (Razorpay)" : "Cash on delivery",
    upiRef: order.upiRef || "",
    status: order.payment === "upi" ? "Check UPI payment" : order.status === "paid" ? "Paid" : "To collect cash",
    whatsapp: whatsappLink(order),
  };
  delete row.secret;
  return (await postToScript(row)).ok === true;
}

async function notifyOrderPlaced(order) {
  logToSheet(order).then((ok) => {
    if (!ok && sheetEnabled && emailEnabled && env.ORDER_EMAIL_TO) sendEmail(env.ORDER_EMAIL_TO, `Order ${order.id} not added to your sheet`, `<p>Order ${esc(order.id)} couldn't be added to the Google Sheet. It's still in the new-order email.</p>`);
  });
  const sms = `Hi ${order.customer.name.split(" ")[0]}, your Pookie Pads order ${order.id} for ${rupees(order.total)} is placed. ` +
    (order.payment === "online" ? "Payment received. " : order.payment === "upi" ? "UPI payment being verified. " : "Pay on delivery. ") + "Thank you! - Azalea Hygiene";
  const [smsSent] = await Promise.all([
    sendSms(order.customer.phone, sms),
    notifyOwner(`New Pookie order ${order.id} - ${rupees(order.total)}`, orderEmailHtml(order)),
  ]);
  return smsSent;
}

// ---------- orders ----------
function validateOrder(body) {
  const errors = {};
  const c = body.customer || {};
  const name = String(c.name || "").trim();
  const phone = String(c.phone || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const address = String(c.address || "").trim();
  const city = String(c.city || "").trim();
  const pincode = String(c.pincode || "").trim();

  if (name.length < 2 || name.length > 80) errors.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter a 10-digit Indian mobile number.";
  if (address.length < 10 || address.length > 300) errors.address = "Enter your full address: house number, street and area.";
  if (city.length < 2 || city.length > 60) errors.city = "Enter your city.";
  if (!/^[1-9]\d{5}$/.test(pincode)) errors.pincode = "Enter a 6-digit PIN code.";

  const items = [];
  for (const it of Array.isArray(body.items) ? body.items : []) {
    const p = productsById[it.id];
    const qty = Math.floor(Number(it.qty));
    if (p && qty >= 1 && qty <= 20) items.push({ id: p.id, size: p.size, pads: p.pads, price: p.price, qty, lineTotal: p.price * qty });
  }
  if (!items.length) errors.items = "Your basket is empty.";

  // Cash on delivery is no longer offered: orders are paid by UPI (or Razorpay when it's set up)
  const payment = body.payment === "online" && onlinePayments ? "online" : upiEnabled ? "upi" : onlinePayments ? "online" : null;
  if (!payment) errors.payment = "Online payment isn't available right now. Please call +91 98794 30119 to order.";
  return { errors, order: { customer: { name, phone, address, city, pincode }, items, payment } };
}

function newOrderId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PK${ymd}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

async function createOrder(req, res) {
  if (limited(req, "order", 6)) return send(res, 429, { error: "Too many attempts. Wait a minute and try again." });
  const body = await readBody(req);
  const { errors, order } = validateOrder(body);
  if (Object.keys(errors).length) return send(res, 400, { error: errors.payment || "Check the highlighted fields.", fields: errors });

  const subtotal = order.items.reduce((s, i) => s + i.lineTotal, 0);
  Object.assign(order, {
    id: newOrderId(),
    subtotal,
    delivery: catalog.deliveryFee,
    total: subtotal + catalog.deliveryFee,
    status: order.payment === "online" ? "awaiting_payment" : order.payment === "upi" ? "awaiting_upi" : "placed",
    createdAt: new Date().toISOString(),
  });

  if (order.payment === "online") {
    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: order.total * 100, currency: "INR", receipt: order.id }),
    });
    const rz = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("[razorpay] order error:", r.status, rz);
      return send(res, 502, { error: "Online payment isn't available right now. Choose cash on delivery or try again." });
    }
    order.razorpayOrderId = rz.id;
    saveOrder(order);
    return send(res, 200, {
      orderId: order.id,
      status: order.status,
      total: order.total,
      razorpay: { key: env.RAZORPAY_KEY_ID, orderId: rz.id, amount: rz.amount, name: STORE_NAME, prefill: { name: order.customer.name, contact: order.customer.phone } },
    });
  }

  if (order.payment === "upi") {
    saveOrder(order);
    // Standard UPI deep link; the same string is encoded in the QR so the amount and note are prefilled.
    // Built by hand: many UPI apps reject an encoded "@" (%40) in the UPI ID or "+" for spaces.
    const enc = (s) => encodeURIComponent(s).replace(/%20/g, "%20");
    // UPI apps block prefilled amounts to personal UPI IDs, so the amount is only added for business IDs
    // (set "prefillAmount": true in catalog.json once a business UPI ID is in place).
    const prefilled = UPI_PREFILL;
    const link = prefilled
      ? `upi://pay?pa=${UPI_ID}&pn=${enc(UPI_NAME)}&am=${order.total.toFixed(2)}&cu=INR&tn=${enc("Pookie " + order.id)}`
      : `upi://pay?pa=${UPI_ID}&pn=${enc(UPI_NAME)}&cu=INR`;
    return send(res, 200, { orderId: order.id, status: order.status, total: order.total, upi: { id: UPI_ID, name: UPI_NAME, link, prefilled } });
  }

  saveOrder(order);
  const smsSent = await notifyOrderPlaced(order);
  send(res, 200, { orderId: order.id, status: order.status, total: order.total, phone: order.customer.phone, smsSent });
}

// Customer went back to change their basket before paying; only unpaid UPI orders can be cancelled
function cancelUnpaid(res, orderId) {
  const orders = readJson("orders.json", []);
  const order = orders.find((o) => o.id === orderId);
  if (!order || order.status !== "awaiting_upi") return send(res, 404, { error: "Order not found." });
  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  writeJson("orders.json", orders);
  send(res, 200, { ok: true });
}

// Customer has paid by UPI and gives us the 12-digit reference to match against the bank statement
async function submitUpiRef(req, res, orderId) {
  if (limited(req, "upi", 8)) return send(res, 429, { error: "Too many attempts. Wait a minute and try again." });
  const body = await readBody(req);
  const utr = String(body.utr || "").replace(/\D/g, "");
  if (!/^\d{12}$/.test(utr)) return send(res, 400, { error: "A UPI transaction ID has exactly 12 digits. Check your payment app." });
  const orders = readJson("orders.json", []);
  const order = orders.find((o) => o.id === orderId);
  if (!order || order.payment !== "upi") return send(res, 404, { error: "We couldn't find that order. Please place it again." });
  if (order.status === "upi_submitted") return send(res, 200, { orderId: order.id, status: order.status, total: order.total, phone: order.customer.phone, smsSent: true });
  if (orders.some((o) => o.upiRef === utr)) return send(res, 409, { error: "That transaction ID is already used on another order. Check it, or call +91 98794 30119." });

  order.upiRef = utr;
  order.status = "upi_submitted";
  order.upiSubmittedAt = new Date().toISOString();
  writeJson("orders.json", orders);
  const smsSent = await notifyOrderPlaced(order);
  send(res, 200, { orderId: order.id, status: order.status, total: order.total, phone: order.customer.phone, smsSent });
}


async function verifyPayment(req, res, orderId) {
  const body = await readBody(req);
  const orders = readJson("orders.json", []);
  const order = orders.find((o) => o.id === orderId);
  if (!order || order.payment !== "online") return send(res, 404, { error: "Order not found." });
  if (order.status === "paid") return send(res, 200, { orderId: order.id, status: order.status, total: order.total, phone: order.customer.phone, smsSent: true });

  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${order.razorpayOrderId}|${body.razorpay_payment_id}`).digest("hex");
  const given = String(body.razorpay_signature || "");
  const ok = given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok || body.razorpay_order_id !== order.razorpayOrderId) return send(res, 400, { error: "We couldn't confirm that payment. If money left your account, call us and we'll sort it out." });

  order.status = "paid";
  order.razorpayPaymentId = body.razorpay_payment_id;
  order.paidAt = new Date().toISOString();
  writeJson("orders.json", orders);
  const smsSent = await notifyOrderPlaced(order);
  send(res, 200, { orderId: order.id, status: order.status, total: order.total, phone: order.customer.phone, smsSent });
}

function saveOrder(order) {
  const orders = readJson("orders.json", []);
  orders.push(order);
  writeJson("orders.json", orders);
}

// ---------- newsletter ----------
async function subscribe(req, res) {
  if (limited(req, "sub", 5)) return send(res, 429, { error: "Too many attempts. Wait a minute and try again." });
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return send(res, 400, { error: "That email doesn't look right. Check for typos." });

  const welcome = `<div style="font-family:Arial,sans-serif;color:#3B0A2A;max-width:520px;line-height:1.6">
    <h1 style="color:#D61F69;margin:0 0 12px;font-size:26px">Welcome to the Pookie club</h1>
    <p>Hi! Thanks for joining. You'll be the first to hear about new drops, cycle-care tips and members-only offers, and we'll never write more than a couple of times a month.</p>
    <p>Every Pookie order comes with our buy-back promise: if the size doesn't suit you or the pads don't feel comfortable, send back the unused pads anytime for a refund.</p>
    <p><a href="https://pookie-pads.onrender.com" style="display:inline-block;background:#D61F69;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Shop Pookie pads</a></p>
    <p>Questions? Reply to this email or call us on +91 98794 30119.</p>
    <p style="color:#6B3A5A">With care,<br>Team Pookie, Azalea Hygiene</p></div>`;

  // With the Google script set up, it keeps the member list and sends the welcome from Gmail
  if (sheetEnabled && !emailEnabled) {
    const r = await postToScript({ type: "join", email, subject: "Welcome to the Pookie club", html: welcome, joinedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) });
    if (!r.ok) return send(res, 502, { error: "We couldn't add you right now. Please try again in a minute." });
    if (r.isNew) notifyOwner("New Pookie club member", `<p>${esc(email)} joined the Pookie club.</p>`);
    return send(res, 200, { ok: true, isNew: r.isNew, emailSent: r.emailSent === true });
  }

  const subs = readJson("subscribers.json", []);
  const isNew = !subs.some((s) => s.email === email);
  if (isNew) {
    subs.push({ email, joinedAt: new Date().toISOString() });
    writeJson("subscribers.json", subs);
  }
  const emailSent = isNew ? await sendEmail(email, "Welcome to the Pookie club", welcome) : true;
  if (isNew) notifyOwner("New Pookie club member", `<p>${esc(email)} joined the Pookie club.</p>`);
  send(res, 200, { ok: true, isNew, emailSent });
}

// ---------- static files ----------
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".json": "application/json" };

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.normalize(path.join(PUBLIC, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    const ext = path.extname(file);
    // Images are long-cached; HTML, CSS and JS revalidate so updates show up straight away
    const cache = [".webp", ".png", ".jpg", ".svg", ".ico"].includes(ext) ? "public, max-age=604800" : "no-cache";
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": cache, "X-Content-Type-Options": "nosniff" });
    res.end(data);
  });
}

// ---------- router ----------
http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && pathname === "/api/catalog") {
      return send(res, 200, { ...catalog, onlinePayments, upi: upiEnabled });
    }
    if (req.method === "POST" && pathname === "/api/orders") return await createOrder(req, res);
    const m = pathname.match(/^\/api\/orders\/([A-Z0-9-]+)\/(verify|upi|cancel)$/);
    if (req.method === "POST" && m && m[2] === "cancel") return cancelUnpaid(res, m[1]);
    if (req.method === "POST" && m && m[2] === "verify") return await verifyPayment(req, res, m[1]);
    if (req.method === "POST" && m && m[2] === "upi") return await submitUpiRef(req, res, m[1]);
    if (req.method === "POST" && pathname === "/api/subscribe") return await subscribe(req, res);
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "Not found" });
    if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
    res.writeHead(405); res.end();
  } catch (e) {
    console.error(e);
    send(res, e.message === "bad_json" || e.message === "too_large" ? 400 : 500, { error: "Something went wrong on our side. Try again in a moment." });
  }
}).listen(PORT, () => {
  console.log(`Pookie Pads running at http://localhost:${PORT}`);
  console.log(`  SMS (Fast2SMS): ${smsEnabled ? "on" : "demo mode, messages are logged here"}`);
  console.log(`  Email: ${emailEnabled ? "on (Brevo)" : sheetEnabled ? "on (Gmail, via the Google Sheet script)" : "off, emails are only logged here until the Google Sheet is connected"}`);
  console.log(`  UPI payments: ${upiEnabled ? `on (${UPI_ID})` : "off, set UPI_ID to turn on"}`);
  console.log(`  Online payments (Razorpay): ${onlinePayments ? "on" : "off"}`);
  console.log(`  Orders sheet (Google Sheets): ${sheetEnabled ? "on" : "off, set ORDER_SHEET_URL and ORDER_SHEET_SECRET"}`);
});
