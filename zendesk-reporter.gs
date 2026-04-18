// ============================================================
// Zendesk Daily Reporter — Google Apps Script
// Automated daily ticket reporting to Slack
// ============================================================

// === CONFIGURATION (Replace with your own credentials) ===
const ZENDESK_SUBDOMAIN = 'your-subdomain';
const ZENDESK_EMAIL = 'your-email@company.com/token';
const ZENDESK_API_TOKEN = 'YOUR_API_TOKEN_HERE';
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';

const VIEW_ID_OPEN_PENDING = 12345678; // Your Zendesk View ID for Open & Pending tickets

// === UTILITY FUNCTIONS ===

function getTicketsFromView(viewId) {
  const url = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/views/${viewId}/tickets.json`;
  const options = {
    method: 'get',
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(ZENDESK_EMAIL + ':' + ZENDESK_API_TOKEN)
    },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.tickets || [];
}

function sendToSlack(text) {
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text })
  });
}

// === MORNING REPORT: OPEN & PENDING ===
function morningReport() {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return; // Skip weekends

  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMMM yyyy');
  const tickets = getTicketsFromView(VIEW_ID_OPEN_PENDING);
  const openCount = tickets.filter(t => t.status === 'open').length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;

  const msg = `:sunrise: *Laporan Pagi - ${dateStr}*\n` +
              `Total tiket *OPEN*: ${openCount}\n` +
              `Total tiket *PENDING*: ${pendingCount}`;
  sendToSlack(msg);
}

// === EVENING REPORT: SOLVED TODAY + TOP TAGS ===
function eveningReport() {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return; // Skip weekends

  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMMM yyyy');
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const baseQuery = `type:ticket status:solved updated>=${today}`;
  let url = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(baseQuery)}`;

  const headers = {
    Authorization: 'Basic ' + Utilities.base64Encode(ZENDESK_EMAIL + ':' + ZENDESK_API_TOKEN)
  };

  let allResults = [];

  // Handle API pagination
  while (url) {
    const options = {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    allResults = allResults.concat(json.results || []);
    url = json.next_page || null;
  }

  const updatedToday = allResults.filter(ticket => {
    const updated = ticket.updated_at;
    const updatedDate = Utilities.formatDate(new Date(updated), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    return updatedDate === today;
  });

  // Aggregate tags
  const tagCounter = {};
  updatedToday.forEach(ticket => {
    (ticket.tags || []).forEach(tag => {
      tagCounter[tag] = (tagCounter[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => `- \`${tag}\`: ${count}`)
    .join('\n') || 'Tidak ada tag ditemukan hari ini.';

  const msg = `:city_sunset: *Laporan Sore - ${dateStr}*\n` +
              `Total tiket *SOLVED* (berdasarkan update hari ini): ${updatedToday.length}\n\n` +
              `*Top 3 Tags Hari Ini:*\n${topTags}`;
  sendToSlack(msg);
}

// === DEBUG FUNCTION (Optional) ===
function debugView(viewId) {
  const tickets = getTicketsFromView(viewId);
  Logger.log("Jumlah tiket: " + tickets.length);
  tickets.forEach(t => {
    Logger.log(`ID: ${t.id}, Status: ${t.status}, Tags: ${t.tags}`);
  });
}
