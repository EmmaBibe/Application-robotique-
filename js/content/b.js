// Fonctions courtes pour écrire les leçons de façon lisible.

export const P = html => ({ t: 'p', html });
export const H = text => ({ t: 'h', text, level: 2 });
export const H3 = text => ({ t: 'h', text, level: 3 });
export const Tip = (html, title) => ({ t: 'callout', kind: 'tip', html, title });
export const Warn = (html, title) => ({ t: 'callout', kind: 'warn', html, title });
export const Danger = (html, title) => ({ t: 'callout', kind: 'danger', html, title });
export const Future = (html, title) => ({ t: 'callout', kind: 'future', html, title });
export const Real = (html, title) => ({ t: 'callout', kind: 'real', html, title });
export const Info = (html, title) => ({ t: 'callout', kind: 'info', html, title });
export const F = (html, label) => ({ t: 'formula', html, label });
export const Sim = (id, opts = {}, caption) => ({ t: 'sim', id, opts, caption });
export const Pipe = (title, steps) => ({ t: 'pipeline', title, steps: steps.map(([t, d, ex, more]) => ({ t, d, ex, more })) });
export const Q = (id, q, opts, a, why, wrong) => ({ t: 'quiz', id, q, opts, a, why, wrong });
export const Exo = (id, q, o = {}) => ({ t: 'exo', id, q, ...o });
export const Code = (id, q, o) => ({ t: 'code', id, q, ...o });
export const Defi = (id, title, text, sim, opts = {}, xp) => ({ t: 'defi', id, title, text, sim, opts, xp });
export const Manual = (id, title, text, xp) => ({ t: 'defi', id, title, text, manual: true, xp });
export const Think = (id, q, a) => ({ t: 'think', id, q, a });
export const Table = (head, rows) => ({ t: 'table', head, rows });
export const Svg = html => ({ t: 'svg', html });
