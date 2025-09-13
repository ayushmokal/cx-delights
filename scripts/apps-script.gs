/**
 * CX Delights — Google Apps Script
 * Writes JSON payloads from the Next.js form into a Google Sheet.
 * Expected fields: ticketLink, productLink, occasion, agentName, timestamp
 */

const SPREADSHEET_ID = '1UXdv8Jya0EiYYeDNJAJTPErlOh_wv2L8LFwqEQ7RrL8';
const SHEET_NAME_PREFERRED = 'Submissions'; // if missing, falls back to first sheet

function _getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME_PREFERRED);
  if (!sh) sh = ss.getSheets()[0];
  _ensureHeader(sh);
  return sh;
}

function _ensureHeader(sheet) {
  const headers = ['timestamp','agentName','occasion','ticketLink','productLink'];
  const firstRow = sheet.getRange(1,1,1,headers.length).getValues()[0];
  const isEmpty = firstRow.every(v => v === '' || v === null);
  if (isEmpty) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function _ok(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return _ok({ ok: true, version: '1.0', sheet: SHEET_NAME_PREFERRED });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const required = ['ticketLink','productLink','occasion','agentName'];
    for (var i=0;i<required.length;i++) {
      var k = required[i];
      if (!data[k] || typeof data[k] !== 'string') {
        return _ok({ ok:false, error: 'Missing field: ' + k });
      }
    }

    // Basic URL validation
    var ticket = data.ticketLink.trim();
    var product = data.productLink.trim();
    if (!(ticket.startsWith('http://') || ticket.startsWith('https://'))) {
      return _ok({ ok:false, error: 'Invalid ticketLink URL' });
    }
    if (!(product.startsWith('http://') || product.startsWith('https://'))) {
      return _ok({ ok:false, error: 'Invalid productLink URL' });
    }

    var when = data.timestamp || new Date().toISOString();
    var row = [
      when,
      String(data.agentName).trim(),
      String(data.occasion).trim(),
      ticket,
      product,
    ];

    var sheet = _getSheet();
    sheet.appendRow(row);
    return _ok({ ok: true });
  } catch (err) {
    return _ok({ ok:false, error: String(err) });
  }
}

