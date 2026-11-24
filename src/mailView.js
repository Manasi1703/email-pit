// The email reader that opens when you catch a fluttering envelope: laid out like a normal email client's message view.
let root = null, onClose = null;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ico = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  back: ico('<path d="M19 12H5M12 19l-7-7 7-7"/>'), archive: ico('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>'),
  spam: ico('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'), trash: ico('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  unread: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'), clock: ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  star: ico('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'), reply: ico('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 016 6v3"/>'),
  fwd: ico('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 00-6 6v3"/>'), clip: ico('<path d="M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8"/>')
};

function build() {
  root = document.createElement("div"); root.className = "mail"; root.hidden = true; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Email");
  root.addEventListener("pointerdown", e => { if (e.target === root) hideMail(); });
  document.body.appendChild(root);
}
export const isMailOpen = () => !!root && !root.hidden;
export function hideMail() { if (!root || root.hidden) return; root.hidden = true; const f = onClose; onClose = null; if (f) f(); }
export function showMail(m, closed) {
  if (!root) build();
  onClose = closed || null;
  const att = m.attach ? `<div class="mail-att">${ICONS.clip}<span>${esc(m.attach)}</span></div>` : "";
  root.innerHTML = `
    <article class="mail-card">
      <header class="mail-bar">
        <button class="mail-ic" data-close aria-label="Back to the room">${ICONS.back}</button>
        <span class="mail-sp"></span>
        <button class="mail-ic" tabindex="-1" aria-label="Archive">${ICONS.archive}</button>
        <button class="mail-ic" tabindex="-1" aria-label="Report spam">${ICONS.spam}</button>
        <button class="mail-ic" tabindex="-1" aria-label="Delete">${ICONS.trash}</button>
        <i class="mail-div"></i>
        <button class="mail-ic" tabindex="-1" aria-label="Mark as unread">${ICONS.unread}</button>
        <button class="mail-ic" tabindex="-1" aria-label="Snooze">${ICONS.clock}</button>
      </header>
      <div class="mail-scroll">
        <h1 class="mail-subject">${esc(m.subject)}<span class="mail-chip">Inbox</span></h1>
        <div class="mail-head">
          <div class="mail-avatar" style="background:${esc(m.color)}">${esc(m.initial)}</div>
          <div class="mail-who">
            <div class="mail-from"><b>${esc(m.from)}</b> <span>&lt;${esc(m.addr)}&gt;</span></div>
            <div class="mail-to">to me</div>
          </div>
          <div class="mail-when">${esc(m.date)} <span>(${esc(m.ago)})</span><button class="mail-ic sm" tabindex="-1" aria-label="Star">${ICONS.star}</button><button class="mail-ic sm" tabindex="-1" aria-label="Reply">${ICONS.reply}</button></div>
        </div>
        <div class="mail-body">${m.body.map(p => `<p>${esc(p)}</p>`).join("")}${m.sig ? `<p class="mail-sig">${esc(m.sig)}</p>` : ""}</div>
        ${att}
        <div class="mail-act"><button class="mail-pill" tabindex="-1">${ICONS.reply}Reply</button><button class="mail-pill" tabindex="-1">${ICONS.fwd}Forward</button></div>
      </div>
    </article>`;
  root.querySelector("[data-close]").addEventListener("click", hideMail);
  root.hidden = false; root.querySelector("[data-close]").focus({ preventScroll: true });
}
