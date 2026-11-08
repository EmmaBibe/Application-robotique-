// Petits utilitaires d'interface : échappement, notifications, fenêtres modales, icônes.

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function toast(title, body = '', kind = '') {
  const zone = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = `<b>${esc(title)}</b>${body ? `<span>${esc(body)}</span>` : ''}`;
  zone.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 3800);
  setTimeout(() => t.remove(), 4300);
}

let lastFocus = null;
export function modal(html, { onClose } = {}) {
  const m = document.getElementById('modal');
  lastFocus = document.activeElement;
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
  const close = () => {
    m.hidden = true; m.innerHTML = '';
    document.removeEventListener('keydown', key);
    onClose && onClose();
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  const key = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', key);
  m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) close(); };
  const first = m.querySelector('input, button, textarea, select, a');
  first && setTimeout(() => first.focus(), 30);
  return { el: m.firstElementChild, close };
}

export function confirmBox(text, okLabel = 'Confirmer') {
  return new Promise(res => {
    const { el, close } = modal(`<p>${esc(text)}</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-k="no">Annuler</button><button class="btn danger" data-k="ok">${esc(okLabel)}</button></div>`, { onClose: () => res(false) });
    el.querySelector('[data-k=ok]').onclick = () => { res(true); close(); };
    el.querySelector('[data-k=no]').onclick = () => { res(false); close(); };
  });
}

export function download(name, content, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

const P = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  book: '<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 20a4 4 0 0 1 0-8h10"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13 7 4 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  grad: '<path d="m2 9 10-5 10 5-10 5-10-5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15l-3-3c1-4 4-8 11-9-1 7-5 10-9 11z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
};
export const icon = (name, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${P[name] || ''}</svg>`;

export function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; }
}
