// The email reader that opens when you catch a paper: laid out and set like Gmail's message view (toolbar, subject with its label, sender row, body, Reply / Forward).
let root = null, onClose = null, seen = 0;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ico = (d, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const ICONS = {   // Material icons (outlined), the set Gmail uses
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  archive: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.81.97H5.44l.8-.97zM5 19V8h14v11H5zm8.45-9h-2.9v3H8l4 4 4-4h-2.55z",
  spam: "M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM19 14.9L14.9 19H9.1L5 14.9V9.1L9.1 5h5.8L19 9.1v5.8zM11 7h2v7h-2zm0 8h2v2h-2z",
  trash: "M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z",
  unread: "M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z",
  snooze: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  task: "M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c1.57 0 3.04.46 4.28 1.25l1.45-1.45A10.02 10.02 0 0012 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.73 0 3.36-.44 4.78-1.22l-1.5-1.5c-1 .46-2.11.72-3.28.72zm7-5h-3v2h3v3h2v-3h3v-2h-3v-3h-2v3z",
  move: "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-7.84-6H8v2h4.16l-1.59 1.59L11.99 17 16 13.01 11.99 9l-1.41 1.41L12.16 12z",
  label: "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z",
  more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  prev: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z", next: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  print: "M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z",
  popout: "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
  star: "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z",
  emoji: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
  reply: "M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z",
  fwd: "M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z",
  drop: "M7 10l5 5 5-5z",
  x: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  clip: "M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"
};
const btn = (name, label, cls = "") => `<button class="gm-ic ${cls}" tabindex="-1" aria-label="${label}" title="${label}">${ico(ICONS[name])}</button>`;

function build() {
  root = document.createElement("div"); root.className = "mail"; root.hidden = true; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Email");
  root.addEventListener("pointerdown", e => { if (e.target === root) hideMail(); });
  document.body.appendChild(root);
}
export const isMailOpen = () => !!root && !root.hidden;
export function hideMail() { if (!root || root.hidden) return; root.hidden = true; const f = onClose; onClose = null; if (f) f(); }
export function showMail(m, closed) {
  if (!root) build();
  onClose = closed || null; seen++;
  const total = Number(document.getElementById("count")?.textContent.replace(/\D/g, "")) || 1284;
  const att = m.attach ? `
        <div class="gm-att">
          <div class="gm-att-h">One attachment</div>
          <div class="gm-att-card"><div class="gm-att-thumb">${ico(ICONS.clip, 28)}</div><div class="gm-att-name">${ico(ICONS.clip, 16)}<span>${esc(m.attach)}</span></div></div>
        </div>` : "";
  root.innerHTML = `
    <article class="gm">
      <header class="gm-bar">
        <button class="gm-ic" data-close aria-label="Back to Inbox" title="Back to Inbox">${ico(ICONS.back)}</button>
        ${btn("archive", "Archive")}${btn("spam", "Report spam")}${btn("trash", "Delete")}<i class="gm-div"></i>
        ${btn("unread", "Mark as unread")}${btn("snooze", "Snooze")}${btn("task", "Add to Tasks")}<i class="gm-div"></i>
        ${btn("move", "Move to")}${btn("label", "Labels")}${btn("more", "More")}
        <span class="gm-sp"></span>
        <span class="gm-page">${seen.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}</span>
        ${btn("prev", "Newer", "gm-dim")}${btn("next", "Older")}
      </header>
      <div class="gm-scroll">
        <div class="gm-subj">
          <h1>${esc(m.subject)}</h1>
          <span class="gm-chip">Inbox<button tabindex="-1" aria-label="Remove label Inbox">${ico(ICONS.x, 14)}</button></span>
          <span class="gm-sp"></span>
          ${btn("print", "Print all")}${btn("popout", "In new window")}
        </div>
        <div class="gm-msg">
          <div class="gm-av" style="background:${esc(m.color)}">${esc(m.initial)}</div>
          <div class="gm-main">
            <div class="gm-head">
              <div class="gm-who">
                <div class="gm-from"><b>${esc(m.from)}</b> <span>&lt;${esc(m.addr)}&gt;</span></div>
                <div class="gm-to">to me ${ico(ICONS.drop, 18)}</div>
              </div>
              <div class="gm-when"><span>${esc(m.date)} (${esc(m.ago)})</span>${btn("star", "Not starred")}${btn("emoji", "Add reaction")}${btn("reply", "Reply")}${btn("more", "More")}</div>
            </div>
            <div class="gm-body">${m.body.map(p => `<p>${esc(p)}</p>`).join("")}${m.sig ? `<p>${esc(m.sig)}</p>` : ""}</div>
            ${att}
          </div>
        </div>
        <div class="gm-act">
          <button class="gm-pill" tabindex="-1">${ico(ICONS.reply)}Reply</button>
          <button class="gm-pill" tabindex="-1">${ico(ICONS.fwd)}Forward</button>
          <button class="gm-ic gm-ring" tabindex="-1" aria-label="Add reaction">${ico(ICONS.emoji)}</button>
        </div>
      </div>
    </article>`;
  root.querySelector("[data-close]").addEventListener("click", hideMail);
  root.hidden = false; root.querySelector("[data-close]").focus({ preventScroll: true });
}
