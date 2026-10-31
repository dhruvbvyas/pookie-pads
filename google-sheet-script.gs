// Pookie Pads: order sheet, Pookie club list and emails (sent from your Gmail).
// Paste this into Extensions > Apps Script in your Google Sheet.
// Change SECRET below to your own password (8+ characters), and use the same value
// as ORDER_SHEET_SECRET in Render.

const SECRET = "CHANGE-THIS-TO-YOUR-OWN-PASSWORD";

const ORDER_HEADERS = [
  "Date and time", "Order number", "Name", "Phone", "Address", "City", "PIN code",
  "Items", "Packs", "Total pads", "Total (Rs)", "Payment", "UPI transaction ID", "Status", "WhatsApp customer",
];
const CLUB_HEADERS = ["Joined", "Email", "Welcome email"];
// Emails are sent from the Gmail account that owns this script (set it up while signed in as azalea.hygiene@gmail.com)
const SENDER_NAME = "Pookie by Azalea Hygiene";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: "wrong secret" });
    if (data.type === "email") return sendMail(data);
    if (data.type === "join") return joinClub(data);
    return addOrder(data);
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// One row per order in the "Orders" tab
function addOrder(data) {
  const sheet = tab("Orders", ORDER_HEADERS);
  const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  if (ids.indexOf(data.orderId) !== -1) return reply({ ok: true, duplicate: true });

  sheet.appendRow([
    data.placedAt, data.orderId, data.name, "'" + data.phone, data.address, data.city,
    "'" + data.pincode, data.items, data.packs, data.pads, data.total, data.payment,
    data.upiRef ? "'" + data.upiRef : "", data.status,
    // Tap on the phone to open WhatsApp with the confirmation message ready to send
    /^https:\/\/wa\.me\/\d+\?text=[^"]*$/.test(data.whatsapp || "") ? '=HYPERLINK("' + data.whatsapp + '","Send WhatsApp")' : "",
  ]);
  return reply({ ok: true });
}

// Adds a new member to the "Pookie Club" tab and sends them the welcome email
function joinClub(data) {
  const email = String(data.email || "").trim().toLowerCase();
  if (!isEmail(email)) return reply({ ok: false, error: "bad email" });
  const sheet = tab("Pookie Club", CLUB_HEADERS);
  const emails = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  if (emails.indexOf(email) !== -1) return reply({ ok: true, isNew: false, emailSent: true });

  let emailSent = false;
  try {
    MailApp.sendEmail({ to: email, subject: data.subject, htmlBody: data.html, name: SENDER_NAME });
    emailSent = true;
  } catch (err) {
    // Usually the daily Gmail limit; the member is still saved
  }
  sheet.appendRow([data.joinedAt, email, emailSent ? "Sent" : "Not sent"]);
  return reply({ ok: true, isNew: true, emailSent: emailSent });
}

// Sends an email; "owner" means the Google account that owns this sheet
function sendMail(data) {
  const to = data.to === "owner" ? Session.getEffectiveUser().getEmail() : String(data.to || "").trim();
  if (!isEmail(to)) return reply({ ok: false, error: "bad email" });
  MailApp.sendEmail({ to: to, subject: data.subject, htmlBody: data.html, name: SENDER_NAME });
  return reply({ ok: true });
}

// Finds a tab by name (reusing the blank starter "Sheet1" if it's still there), adding headers the first time
function tab(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  const blank = ss.getSheetByName("Sheet1");
  if (!sheet && blank && blank.getLastRow() === 0) sheet = blank.setName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#FFE3F0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
