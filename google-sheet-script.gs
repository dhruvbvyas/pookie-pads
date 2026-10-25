// Pookie Pads order sheet. Paste this into Extensions > Apps Script in your Google Sheet.
// Change SECRET below to your own password (8+ characters), and use the same value
// as ORDER_SHEET_SECRET in Render.

const SECRET = "CHANGE-THIS-TO-YOUR-OWN-PASSWORD";

const HEADERS = [
  "Date and time", "Order number", "Name", "Phone", "Address", "City", "PIN code",
  "Items", "Packs", "Total pads", "Total (Rs)", "Payment", "UPI transaction ID", "Status",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: "wrong secret" });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#FFE3F0");
      sheet.setFrozenRows(1);
    }

    // Ignore repeats of the same order number
    const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat() : [];
    if (ids.indexOf(data.orderId) !== -1) return reply({ ok: true, duplicate: true });

    sheet.appendRow([
      data.placedAt, data.orderId, data.name, "'" + data.phone, data.address, data.city,
      "'" + data.pincode, data.items, data.packs, data.pads, data.total, data.payment,
      data.upiRef ? "'" + data.upiRef : "", data.status,
    ]);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
