/* Which projects this visitor has hearted: kept only in this browser (localStorage "dx-likes"), nothing is sent anywhere. */
const KEY = "dx-likes";

export function readLikes() {
  try { const list = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(list) ? list : []; } catch { return []; }
}
export function isLiked(slug) { return readLikes().includes(slug); }
export function setLiked(slug, liked) {
  const list = readLikes().filter(item => item !== slug);
  if (liked) list.push(slug);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked: the heart still works until the page closes */ }
}
