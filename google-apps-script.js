// Slack webhook URL is read from Script Properties:
// File → Project settings → Script properties → add key `SLACK_WEBHOOK_URL`
const SLACK_WEBHOOK_URL = (function(){
  try { return PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL') || ''; } catch (e) { return ''; }
})();

// Spreadsheet settings (match your Next.js submission target)
const SPREADSHEET_ID = '1UXdv8Jya0EiYYeDNJAJTPErlOh_wv2L8LFwqEQ7RrL8';
const SHEET_NAME_PREFERRED = 'Submissions';

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
  const isEmpty = firstRow.every(function(v){ return v === '' || v === null; });
  if (isEmpty) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function _ok(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

// Web App endpoints — required if you're hitting the /exec URL
function doGet() {
  return _ok({ ok: true, version: 'webapp-2', sheet: SHEET_NAME_PREFERRED });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _ok({ ok:false, error:'Missing post body' });
    }
    var data = JSON.parse(e.postData.contents);
    var required = ['ticketLink','productLink','occasion','agentName'];
    for (var i=0;i<required.length;i++) {
      var k = required[i];
      if (!data[k] || typeof data[k] !== 'string') {
        return _ok({ ok:false, error:'Missing field: ' + k });
      }
    }
    var ticket = String(data.ticketLink).trim();
    var product = String(data.productLink).trim();
    if (!(ticket.startsWith('http://') || ticket.startsWith('https://'))) {
      return _ok({ ok:false, error:'Invalid ticketLink URL' });
    }
    if (!(product.startsWith('http://') || product.startsWith('https://'))) {
      return _ok({ ok:false, error:'Invalid productLink URL' });
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

    // Best-effort Slack notification
    try {
      var msg = buildSlackMessage({
        timestamp: when,
        agentName: String(data.agentName).trim(),
        occasion: String(data.occasion).trim(),
        ticketLink: ticket,
        productLink: product,
      });
      sendToSlack(msg);
    } catch (slackErr) {
      console.error('Slack notify failed:', slackErr);
    }

    return _ok({ ok:true });
  } catch (err) {
    return _ok({ ok:false, error: String(err) });
  }
}

function buildSlackMessage(payload) {
  var timestamp = payload.timestamp;
  var agentName = payload.agentName;
  var occasion = payload.occasion;
  var ticketLink = payload.ticketLink;
  var productLink = payload.productLink;
  var formattedTime = new Date(timestamp).toLocaleString('en-US', { timeZone:'Asia/Kolkata', dateStyle:'medium', timeStyle:'short' });
  var mention = '<!here> 🎉 New External Delight Submission';
  return {
    text: mention,
    link_names: 1,
    unfurl_links: false,
    unfurl_media: false,
    blocks: [
      { type:'section', text:{ type:'mrkdwn', text: mention } },
      { type:'header', text:{ type:'plain_text', text:'External Delight Submission' } },
      { type:'section', fields: [
        { type:'mrkdwn', text: '*Agent:* ' + agentName },
        { type:'mrkdwn', text: '*Occasion:* ' + occasion },
        { type:'mrkdwn', text: '*Submitted:* ' + formattedTime },
      ]},
      { type:'section', text:{ type:'mrkdwn', text:'*Links:*\n• <' + ticketLink + '|View Ticket>\n• <' + productLink + '|View Product>' } },
      { type:'divider' },
      { type:'context', elements:[ { type:'mrkdwn', text:'💝 Budget: Up to ₹3,000 (≈ $35) | Review and process this delight request' } ] },
    ]
  };
}

// This function should be called whenever a new row is added to your sheet
function onFormSubmit(e) {
  try {
    // Get the sheet and the last row (newest submission)
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, 5); // A..E
    const values = range.getValues()[0];
    
    // Column mapping on your sheet: A:timestamp, B:agentName, C:occasion, D:ticketLink, E:productLink
    const [timestamp, agentName, occasion, ticketLink, productLink] = values;
    
    const formattedTime = new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
    });
    const mention = '<!here> 🎉 New External Delight Submission';

    // Format the Slack message with a real mention (mrkdwn) and plain_text header
    const slackMessage = {
      text: mention,
      link_names: 1,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: mention } },
        { type: 'header', text: { type: 'plain_text', text: 'External Delight Submission' } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Agent:* ${agentName}` },
            { type: 'mrkdwn', text: `*Occasion:* ${occasion}` },
            { type: 'mrkdwn', text: `*Submitted:* ${formattedTime}` },
          ]
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Links:*\n• <${ticketLink}|View Ticket>\n• <${productLink}|View Product>` }
        },
        { type: 'divider' },
        {
          type: 'context',
          elements: [ { type: 'mrkdwn', text: '💝 Budget: Up to ₹3,000 (≈ $35) | Review and process this delight request' } ]
        }
      ]
    };
    
    // Send to Slack
    sendToSlack(slackMessage);
    
  } catch (error) {
    console.error('Error in onFormSubmit:', error);
    // Optionally send an error notification to Slack
    sendErrorToSlack(error.toString());
  }
}

function sendToSlack(message) {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error('SLACK_WEBHOOK_URL not set in Script Properties');
  }
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(message),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`Slack webhook failed: ${response.getResponseCode()} body=${response.getContentText()}`);
  }
}

function sendErrorToSlack(errorMessage) {
  const errorPayload = {
    "text": `❌ Error in External Delights workflow: ${errorMessage}`,
    "color": "danger"
  };
  
  try {
    sendToSlack(errorPayload);
  } catch (e) {
    console.error('Failed to send error to Slack:', e);
  }
}

// Test function to verify Slack integration
function testSlackNotification() {
  const testMessage = {
    "text": "🧪 Test notification from External Delights workflow",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "This is a test notification to verify the Slack integration is working correctly."
        }
      }
    ]
  };
  
  sendToSlack(testMessage);
  console.log('Test notification sent to Slack');
}
