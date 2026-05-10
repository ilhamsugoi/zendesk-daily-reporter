# 📊 Zendesk Daily Reporter

> Automated Zendesk-Slack Reporting System — A Google Apps Script that pulls real-time ticket data from Zendesk API, processes daily metrics, and delivers formatted reports to Slack.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Zendesk](https://img.shields.io/badge/Zendesk%20API-03363D?style=flat-square&logo=zendesk&logoColor=white)
![Slack](https://img.shields.io/badge/Slack%20Webhooks-4A154B?style=flat-square&logo=slack&logoColor=white)

---

## 🔍 Overview

This project automates daily customer support reporting by:

1. **Morning Report (🌅)** — Fetches all Open & Pending tickets from a Zendesk View and posts a queue summary to Slack.
2. **Evening Report (🌆)** — Searches for all tickets solved/updated today, aggregates tag frequency, and posts the Top 3 issue tags to Slack.

**Problem solved:** Eliminated ~15 minutes of manual daily reporting and gave the support team instant visibility into ticket queues and trending customer issues.

---

## ⚡ Key Features

| Feature | Description |
|---|---|
| **Scheduled Automation** | Time-driven triggers run reports every weekday (Mon–Fri), with built-in weekend exclusion logic |
| **Zendesk API Integration** | Fetches ticket data via REST API with Basic Auth (Base64 encoded) |
| **API Pagination Handling** | Loops through `next_page` to process large datasets without data loss |
| **Tag Aggregation** | Counts and ranks issue tags by frequency to surface trending problems |
| **Slack Webhooks** | Delivers formatted reports directly to a Slack channel |
| **Zero Infrastructure** | Runs entirely on Google's infrastructure — no server, no hosting costs |

---

## 🏗️ Architecture

```
┌──────────────┐      ┌─────────────────────┐      ┌──────────────┐
│              │      │                     │      │              │
│  Zendesk API │─────>│  Google Apps Script  │─────>│    Slack     │
│  (REST API)  │      │  (Cron Triggered)    │      │  (Webhook)   │
│              │      │                     │      │              │
└──────────────┘      └─────────────────────┘      └──────────────┘
       │                       │                          │
   Ticket Data          Process & Aggregate         Formatted Report
   (Open/Pending/        (Count, Filter,            (Morning/Evening
    Solved)               Tag Ranking)               Summary)
```

---

## 🚀 Live Demo

👉 **[View the Interactive Dashboard Demo](https://ilhamsugoi.github.io/zendesk-daily-reporter/)**

The demo uses **mock data** to simulate the system without requiring any API credentials. You can:
- Click **"Run Morning Report"** to see Open/Pending ticket counts
- Click **"Run Evening Report"** to see Solved tickets and Top Tags analysis
- Preview the exact Slack message format that gets delivered

---

## 🛠️ How to Run (With Your Own Zendesk)

### Prerequisites
- A Zendesk account with API access
- A Slack workspace with Incoming Webhooks enabled
- A Google account (for Google Apps Script)

### Setup Steps

1. **Create a new Google Apps Script project** at [script.google.com](https://script.google.com)

2. **Copy the script** — Paste the contents of `zendesk-reporter.gs` into your project

3. **Configure your credentials** — Update these variables at the top of the script:
   ```javascript
   const ZENDESK_SUBDOMAIN = 'your-subdomain';
   const ZENDESK_EMAIL     = 'your-email@company.com/token';
   const ZENDESK_API_TOKEN = 'your-api-token-here';
   const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';
   const VIEW_ID_OPEN_PENDING = 12345678; // Your Zendesk View ID
   ```

4. **Set up triggers** — Go to **Triggers** (⏰ icon) and create two time-driven triggers:
   - `morningReport` → Daily, 8:00 AM
   - `eveningReport` → Daily, 5:00 PM

5. **Test manually** — Select `morningReport` from the function dropdown and click **Run**

---

## 📁 Project Structure

```
zendesk-daily-reporter/
├── index.html             # Interactive portfolio dashboard (demo)
├── style.css              # Dashboard styling (dark theme)
├── script.js              # Mock data & dashboard logic
├── zendesk-reporter.gs    # ⭐ The actual Google Apps Script
└── README.md              # This file
```

---

## 📸 Sample Slack Output

**Morning Report:**
```
🌅 Laporan Pagi — 18 April 2026
Total tiket OPEN: 6
Total tiket PENDING: 4
```

**Evening Report:**
```
🌆 Laporan Sore — 18 April 2026
Total tiket SOLVED (berdasarkan update hari ini): 8

Top 3 Tags Hari Ini:
- `billing`: 5
- `coupon_error`: 3
- `login_error`: 2
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
