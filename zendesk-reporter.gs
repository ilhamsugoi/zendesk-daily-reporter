// ============================================================
// Zendesk Daily Reporter — Google Apps Script
// Automated daily ticket reporting to Slack
// ============================================================

// === CONFIGURATION (Replace with your own credentials) ===
const ZENDESK_SUBDOMAIN = 'your-subdomain';
const ZENDESK_EMAIL = 'your-email@company.com/token';
const ZENDESK_API_TOKEN = 'YOUR_API_TOKEN_HERE';
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';

const VIEW_ID_OPEN_PENDING = 12345678; // Your Zendesk View ID

// === UTILITY FUNCTIONS ===

// Handles API pagination to fetch >100 tickets
function getTicketsFromView(viewId) {
  let url = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/views/${viewId}/tickets.json`;
  let allTickets = [];
  
  while (url) {
    const options = {
      method: 'get',
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(ZENDESK_EMAIL + ':' + ZENDESK_API_TOKEN)
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) break; 

    const json = JSON.parse(response.getContentText());
    allTickets = allTickets.concat(json.tickets || []);
    url = json.next_page || null; 
  }
  
  return allTickets;
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
  if (day === 0 || day === 6) return;

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
  if (day === 0 || day === 6) return;

  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMMM yyyy');
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const baseQuery = `type:ticket status:solved updated>=${today}`;
  let url = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(baseQuery)}`;

  const headers = {
    Authorization: 'Basic ' + Utilities.base64Encode(ZENDESK_EMAIL + ':' + ZENDESK_API_TOKEN)
  };

  let allResults = [];

  while (url) {
    const options = {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) break;
    
    const json = JSON.parse(response.getContentText());
    allResults = allResults.concat(json.results || []);
    url = json.next_page || null;
  }

  const updatedToday = allResults.filter(ticket => {
    const updated = ticket.updated_at;
    const updatedDate = Utilities.formatDate(new Date(updated), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    return updatedDate === today;
  });

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

// ============================================================
// TESTING FUNCTIONS (DEBUG ONLY)
// ============================================================

function testPagination() {
  const testViewId = VIEW_ID_OPEN_PENDING; 
  Logger.log("⏳ Fetching tickets from View ID: " + testViewId);
  const tickets = getTicketsFromView(testViewId);
  
  const openCount = tickets.filter(t => t.status === 'open').length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  
  Logger.log("✅ Fetch complete!");
  Logger.log("TOTAL TICKETS : " + tickets.length);
  Logger.log("-> OPEN       : " + openCount);
  Logger.log("-> PENDING    : " + pendingCount);
}

function testEveningReport() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const baseQuery = `type:ticket status:solved updated>=${today}`;
  let url = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(baseQuery)}`;
  const headers = { Authorization: 'Basic ' + Utilities.base64Encode(ZENDESK_EMAIL + ':' + ZENDESK_API_TOKEN) };
  let allResults = [];
  
  Logger.log("⏳ Fetching solved tickets for: " + today);

  while (url) {
    const options = { method: 'get', headers: headers, muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) break; 
    const json = JSON.parse(response.getContentText());
    allResults = allResults.concat(json.results || []);
    url = json.next_page || null;
  }

  const updatedToday = allResults.filter(ticket => {
    const updatedDate = Utilities.formatDate(new Date(ticket.updated_at), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    return updatedDate === today;
  });

  Logger.log("✅ Search complete!");
  Logger.log("TOTAL SOLVED TODAY : " + updatedToday.length);
}
