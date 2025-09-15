// Replace with your actual Slack webhook URL
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

// This function should be called whenever a new row is added to your sheet
function onFormSubmit(e) {
  try {
    // Get the sheet and the last row (newest submission)
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, 5); // Assuming 5 columns
    const values = range.getValues()[0];
    
    // Extract data (adjust column indices based on your sheet structure)
    const [timestamp, ticketLink, productLink, occasion, agentName] = values;
    
    // Format the Slack message
    const slackMessage = {
      "text": "🎉 New External Delight Submission!",
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "🎉 New External Delight Submission"
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Agent:* ${agentName}`
            },
            {
              "type": "mrkdwn",
              "text": `*Occasion:* ${occasion}`
            },
            {
              "type": "mrkdwn",
              "text": `*Submitted:* ${new Date(timestamp).toLocaleString()}`
            }
          ]
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Links:*\n• <${ticketLink}|View Ticket>\n• <${productLink}|View Product>`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "💝 Budget: Up to ₹3,000 (≈ $35) | Review and process this delight request"
            }
          ]
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
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'payload': JSON.stringify(message)
  };
  
  const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Slack webhook failed: ${response.getResponseCode()}`);
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
