// ============================================================
// MOCK DATA — Simulates Zendesk API responses for demo purposes
// ============================================================

const MOCK_TICKETS = [
  { id: 45201, subject: "Cannot login after password reset", status: "open", priority: "urgent", tags: ["login_error", "password_reset", "urgent"], updated_at: new Date().toISOString() },
  { id: 45202, subject: "Coupon code not applying at checkout", status: "open", priority: "high", tags: ["coupon_error", "checkout", "promo"], updated_at: new Date().toISOString() },
  { id: 45203, subject: "App crashes on Android 14", status: "open", priority: "high", tags: ["app_crash", "android", "bug"], updated_at: new Date().toISOString() },
  { id: 45204, subject: "Request for refund — duplicate charge", status: "open", priority: "normal", tags: ["refund_request", "billing", "duplicate"], updated_at: new Date().toISOString() },
  { id: 45205, subject: "Delivery tracking not updating", status: "pending", priority: "normal", tags: ["delivery", "tracking", "logistics"], updated_at: new Date().toISOString() },
  { id: 45206, subject: "Unable to upload receipt photo", status: "pending", priority: "high", tags: ["upload_error", "receipt", "bug"], updated_at: new Date().toISOString() },
  { id: 45207, subject: "Account verification email not received", status: "pending", priority: "normal", tags: ["email", "verification", "onboarding"], updated_at: new Date().toISOString() },
  { id: 45208, subject: "Points not credited after purchase", status: "open", priority: "urgent", tags: ["loyalty_points", "billing", "missing_credit"], updated_at: new Date().toISOString() },
  { id: 45209, subject: "How to change registered phone number?", status: "pending", priority: "low", tags: ["account_update", "phone", "faq"], updated_at: new Date().toISOString() },
  { id: 45210, subject: "Payment gateway timeout error", status: "open", priority: "urgent", tags: ["payment_error", "timeout", "checkout"], updated_at: new Date().toISOString() },
  { id: 45211, subject: "Promo banner showing expired campaign", status: "solved", priority: "low", tags: ["promo", "ui_bug", "content"], updated_at: new Date().toISOString() },
  { id: 45212, subject: "Push notification not working on iOS", status: "solved", priority: "normal", tags: ["push_notification", "ios", "bug"], updated_at: new Date().toISOString() },
  { id: 45213, subject: "Cashback not reflected in wallet", status: "solved", priority: "high", tags: ["cashback", "wallet", "billing"], updated_at: new Date().toISOString() },
  { id: 45214, subject: "Cannot scan QR code in store", status: "solved", priority: "normal", tags: ["qr_code", "scanner", "in_store"], updated_at: new Date().toISOString() },
  { id: 45215, subject: "Request to delete my account (GDPR)", status: "solved", priority: "normal", tags: ["account_deletion", "gdpr", "privacy"], updated_at: new Date().toISOString() },
  { id: 45216, subject: "Voucher expired before use", status: "solved", priority: "low", tags: ["voucher", "expiry", "coupon_error"], updated_at: new Date().toISOString() },
  { id: 45217, subject: "Wrong product received from redemption", status: "solved", priority: "high", tags: ["redemption", "wrong_item", "fulfillment"], updated_at: new Date().toISOString() },
  { id: 45218, subject: "App language stuck in English", status: "solved", priority: "low", tags: ["localization", "language", "ui_bug"], updated_at: new Date().toISOString() },
];

// ============================================================
// UTILITY FUNCTIONS — Mirrors the actual Google Apps Script logic
// ============================================================

function getTicketsFromView() {
  return MOCK_TICKETS.filter(t => t.status === "open" || t.status === "pending");
}

function getSolvedTicketsToday() {
  return MOCK_TICKETS.filter(t => t.status === "solved");
}

function getTopTags(tickets) {
  const tagCounter = {};
  tickets.forEach(ticket => {
    (ticket.tags || []).forEach(tag => {
      tagCounter[tag] = (tagCounter[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit"
  });
}

// ============================================================
// ANIMATION HELPERS
// ============================================================

function animateValue(el, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();
  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + range * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function activateCard(card) {
  card.classList.add("active");
  card.style.animation = "none";
  card.offsetHeight; // trigger reflow
  card.style.animation = "";
}

// ============================================================
// MORNING REPORT
// ============================================================

function runMorningReport() {
  const btn = document.getElementById("btnMorning");
  btn.disabled = true;
  btn.innerHTML = '<span class="btn__icon">⏳</span> Fetching data...';

  setTimeout(() => {
    const tickets = getTicketsFromView();
    const openCount = tickets.filter(t => t.status === "open").length;
    const pendingCount = tickets.filter(t => t.status === "pending").length;
    const totalCount = openCount + pendingCount;

    // Animate stat cards
    animateValue(document.getElementById("openCount"), 0, openCount, 800);
    activateCard(document.getElementById("cardOpen"));

    setTimeout(() => {
      animateValue(document.getElementById("pendingCount"), 0, pendingCount, 800);
      activateCard(document.getElementById("cardPending"));
    }, 200);

    setTimeout(() => {
      animateValue(document.getElementById("totalCount"), 0, totalCount, 800);
      activateCard(document.getElementById("cardTotal"));
    }, 400);

    // Render Slack message
    renderSlackMessage("morning", { openCount, pendingCount });

    // Update ticket table (show open & pending only)
    renderTicketTable(tickets);
    document.getElementById("tableBadge").textContent = `${tickets.length} tickets`;

    btn.disabled = false;
    btn.innerHTML = '<span class="btn__icon">🌅</span> Run Morning Report';
  }, 1200);
}

// ============================================================
// EVENING REPORT
// ============================================================

function runEveningReport() {
  const btn = document.getElementById("btnEvening");
  btn.disabled = true;
  btn.innerHTML = '<span class="btn__icon">⏳</span> Processing...';

  setTimeout(() => {
    const solvedTickets = getSolvedTicketsToday();
    const topTags = getTopTags(solvedTickets);

    // Animate solved count
    animateValue(document.getElementById("solvedCount"), 0, solvedTickets.length, 800);
    activateCard(document.getElementById("cardSolved"));

    // Render tags
    setTimeout(() => {
      renderTopTags(topTags);
    }, 300);

    // Render Slack message
    renderSlackMessage("evening", { solvedCount: solvedTickets.length, topTags });

    // Update ticket table (show solved)
    renderTicketTable(solvedTickets);
    document.getElementById("tableBadge").textContent = `${solvedTickets.length} tickets`;

    btn.disabled = false;
    btn.innerHTML = '<span class="btn__icon">🌆</span> Run Evening Report';
  }, 1200);
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

function renderTopTags(tags) {
  const body = document.getElementById("tagsBody");
  const maxCount = tags.length > 0 ? tags[0].count : 1;

  body.innerHTML = tags.map((t, i) => `
    <div class="tag-bar" style="animation-delay: ${i * 0.1}s">
      <div class="tag-bar__rank">#${i + 1}</div>
      <div class="tag-bar__info">
        <div class="tag-bar__name">${t.tag}</div>
        <div class="tag-bar__count">${t.count} occurrence${t.count > 1 ? "s" : ""}</div>
        <div class="tag-bar__meter">
          <div class="tag-bar__meter-fill" style="width: ${(t.count / maxCount) * 100}%"></div>
        </div>
      </div>
    </div>
  `).join("");

  document.getElementById("tagsBadge").textContent = `${tags.length} tags`;
  document.getElementById("tagsBadge").style.color = "var(--accent-light)";
}

function renderSlackMessage(type, data) {
  const body = document.getElementById("slackBody");
  const time = formatTime();
  const date = formatDate();
  let messageLines = "";

  if (type === "morning") {
    messageLines = `
      <div class="slack-line">🌅 <strong>Laporan Pagi — ${date}</strong></div>
      <br>
      <div class="slack-line">Total tiket <strong>OPEN</strong>: ${data.openCount}</div>
      <div class="slack-line">Total tiket <strong>PENDING</strong>: ${data.pendingCount}</div>
    `;
  } else {
    const tagLines = data.topTags
      .slice(0, 3)
      .map(t => `<div class="slack-line">&nbsp;&nbsp;- <code>${t.tag}</code>: ${t.count}</div>`)
      .join("");
    messageLines = `
      <div class="slack-line">🌆 <strong>Laporan Sore — ${date}</strong></div>
      <br>
      <div class="slack-line">Total tiket <strong>SOLVED</strong> (updated hari ini): ${data.solvedCount}</div>
      <br>
      <div class="slack-line"><strong>Top 3 Tags Hari Ini:</strong></div>
      ${tagLines}
    `;
  }

  body.innerHTML = `
    <div class="slack-msg">
      <div class="slack-msg__header">
        <div class="slack-msg__avatar">🤖</div>
        <div>
          <div class="slack-msg__bot-name">Zendesk Reporter</div>
        </div>
        <div class="slack-msg__time">${time}</div>
      </div>
      <div class="slack-msg__body">${messageLines}</div>
    </div>
  `;

  document.getElementById("slackBadge").textContent = "1 new message";
  document.getElementById("slackBadge").style.color = "var(--green)";
}

function renderTicketTable(tickets) {
  const tbody = document.getElementById("ticketTableBody");
  tbody.innerHTML = tickets.map(t => {
    const statusClass = `status-badge--${t.status}`;
    const priorityClass = `priority-badge--${t.priority}`;
    const tagsHtml = t.tags.map(tag => `<span class="tag-chip">${tag}</span>`).join(" ");
    const timeAgo = getTimeAgo();

    return `
      <tr>
        <td><strong>#${t.id}</strong></td>
        <td>${t.subject}</td>
        <td><span class="status-badge ${statusClass}">${t.status}</span></td>
        <td><span class="priority-badge ${priorityClass}">${capitalize(t.priority)}</span></td>
        <td>${tagsHtml}</td>
        <td style="color: var(--text-muted); font-size: 12px;">${timeAgo}</td>
      </tr>
    `;
  }).join("");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTimeAgo() {
  const minutes = Math.floor(Math.random() * 120) + 5;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ============================================================
// INIT — Render initial ticket table on page load
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const allTickets = MOCK_TICKETS;
  renderTicketTable(allTickets);
  document.getElementById("tableBadge").textContent = `${allTickets.length} tickets`;
});
