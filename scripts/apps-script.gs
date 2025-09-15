/**
 * CX Delights — Google Apps Script
 * Writes JSON payloads from the Next.js form into a Google Sheet.
 * Expected fields: ticketLink, productLink, occasion, agentName, timestamp
 */

const SPREADSHEET_ID = '1UXdv8Jya0EiYYeDNJAJTPErlOh_wv2L8LFwqEQ7RrL8';
const SHEET_NAME_PREFERRED = 'Submissions'; // if missing, falls back to first sheet
// Prefer storing secrets in Script Properties: File > Project properties > Script properties
// Add key `SLACK_WEBHOOK_URL` there. If not set, Slack is skipped.
const SLACK_WEBHOOK_URL = (function() {
  try { return PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL') || ''; } catch (e) { return ''; }
})();

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
    if (!e || !e.postData || !e.postData.contents) {
      return _ok({ ok:false, error: 'Missing post body' });
    }
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

    // Send Slack notification after successful submission (best-effort)
    try {
      if (SLACK_WEBHOOK_URL) {
        sendSlackNotification({
          timestamp: when,
          agentName: String(data.agentName).trim(),
          occasion: String(data.occasion).trim(),
          ticketLink: ticket,
          productLink: product,
        });
      }
    } catch (slackErr) {
      console.error('Slack notification failed:', slackErr);
      // Do not fail overall request on Slack errors
    }

    return _ok({ ok: true });
  } catch (err) {
    return _ok({ ok:false, error: String(err) });
  }
}

function sendSlackNotification(submissionData) {
  var timestamp = submissionData.timestamp;
  var agentName = submissionData.agentName;
  var occasion = submissionData.occasion;
  var ticketLink = submissionData.ticketLink;
  var productLink = submissionData.productLink;

  var formattedTime = (new Date(timestamp)).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  var slackMessage = {
    text: '🎉 New External Delight Submission!',
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🎉 New External Delight Submission' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: '*Agent:* ' + agentName },
          { type: 'mrkdwn', text: '*Occasion:* ' + occasion },
          { type: 'mrkdwn', text: '*Submitted:* ' + formattedTime }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Links:*\n• <' + ticketLink + '|View Ticket>\n• <' + productLink + '|View Product>'
        }
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [ { type: 'mrkdwn', text: '💝 Budget: Up to ₹3,000 (≈ $35) | Review and process this delight request' } ]
      }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(slackMessage),
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
  var code = resp.getResponseCode();
  if (code !== 200) {
    throw new Error('Slack webhook failed with status: ' + code + ' body: ' + resp.getContentText());
  }
}
