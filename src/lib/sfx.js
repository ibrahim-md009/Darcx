/* Small sound effects for Dalil, synthesised with the Web Audio API (no audio files).
   Browsers only allow sound after a tap, so the audio context is created by the first tap anywhere (`unlock`);
   before that everything stays silent. The visitor can mute it from the panel; the choice is remembered. */

const KEY = "darcx-sound";
let ctx = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === "off"; } catch { /* storage blocked: sound stays on */ }

export const isMuted = () => muted;
export function setMuted(value) {
  muted = value;
  try { localStorage.setItem(KEY, value ? "off" : "on"); } catch { /* ignore */ }
}

/* call from a tap handler */
export function unlock() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
  } catch { /* no audio available */ }
}

function tone({ f, to, at = 0, len = 0.12, type = "sine", vol = 0.07 }) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + len);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + len + 0.03);
}

/* a burst of filtered noise: a soft "whoosh" */
function whoosh({ at = 0, len = 0.28, from = 500, to = 2600, vol = 0.05 } = {}) {
  if (muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + at;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + len);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + len * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(t0);
}

let lastKey = 0, lastHover = 0;

export const sfx = {
  /* the panel pops open: a rising "bloop" + a soft whoosh */
  open() { whoosh({ len: 0.22, vol: 0.03 }); tone({ f: 300, to: 760, len: 0.16, type: "triangle" }); tone({ f: 760, to: 1180, at: 0.1, len: 0.14, vol: 0.045 }); },
  /* the panel closes: a falling blip */
  close() { tone({ f: 720, to: 280, len: 0.15, type: "triangle" }); whoosh({ at: 0.04, len: 0.18, from: 2200, to: 500, vol: 0.02 }); },
  /* first time the panel opens: a little hello arpeggio */
  hello() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, at: 0.25 + i * 0.09, len: 0.16, type: "triangle", vol: 0.05 })); },
  /* tapping a suggested question or a button */
  tap() { tone({ f: 640, to: 900, len: 0.06, type: "triangle", vol: 0.04 }); },
  /* typing in the field (a very soft tick, not more than ~14 a second) */
  key() {
    const now = performance.now();
    if (now - lastKey < 70) return;
    lastKey = now;
    tone({ f: 1500 + Math.random() * 500, len: 0.02, type: "square", vol: 0.012 });
  },
  /* a question is sent: a short tick */
  send() { tone({ f: 520, to: 700, len: 0.07, type: "square", vol: 0.025 }); whoosh({ len: 0.12, from: 1200, to: 3000, vol: 0.02 }); },
  /* Dalil is "typing": soft blips */
  think() { tone({ f: 420, len: 0.05, vol: 0.035 }); tone({ f: 500, at: 0.12, len: 0.05, vol: 0.035 }); tone({ f: 580, at: 0.24, len: 0.05, vol: 0.035 }); },
  /* the answer arrives: a happy three-note chime */
  reply() { [660, 880, 1100].forEach((f, i) => tone({ f, at: i * 0.075, len: 0.12, vol: 0.055 })); },
  /* Dalil "talks": quick random chirps, about as long as the answer (capped at 1.6 s) */
  talk(chars = 40) {
    const count = Math.min(18, Math.max(5, Math.round(chars / 8)));
    for (let i = 0; i < count; i++) tone({ f: 380 + Math.random() * 420, to: 340 + Math.random() * 520, at: 0.28 + i * 0.075, len: 0.06, type: "triangle", vol: 0.03 });
  },
  /* no answer found: a gentle "hmm" */
  oops() { tone({ f: 330, to: 250, len: 0.18, type: "triangle", vol: 0.05 }); tone({ f: 262, to: 196, at: 0.16, len: 0.22, type: "triangle", vol: 0.05 }); },
  /* a suggested next question appears */
  pop() { tone({ f: 900, to: 1300, len: 0.05, type: "sine", vol: 0.03 }); },
  /* a button opens a page or a link: a swoosh going up */
  go() { whoosh({ len: 0.3, from: 400, to: 3200, vol: 0.05 }); tone({ f: 500, to: 1000, len: 0.18, type: "triangle", vol: 0.035 }); },
  /* the "Did you know?" notice pops out (silent until the visitor has tapped something once) */
  notice() { tone({ f: 880, len: 0.12, vol: 0.04 }); tone({ f: 1320, at: 0.1, len: 0.2, vol: 0.04 }); },
  /* sound turned back on */
  on() { [784, 1175].forEach((f, i) => tone({ f, at: i * 0.07, len: 0.1, vol: 0.05 })); },
  /* pointer passes over a suggested question or button (throttled, very soft) */
  hover() {
    const now = performance.now();
    if (now - lastHover < 90) return;
    lastHover = now;
    tone({ f: 1100 + Math.random() * 200, len: 0.03, type: "sine", vol: 0.014 });
  },
  /* the head lands on the new page and bounces: a springy "boing" */
  boing() { tone({ f: 220, to: 520, len: 0.14, type: "sine", vol: 0.06 }); tone({ f: 520, to: 300, at: 0.12, len: 0.16, type: "sine", vol: 0.04 }); },
  /* the head is back home */
  home() { tone({ f: 784, len: 0.09, type: "triangle", vol: 0.04 }); tone({ f: 988, at: 0.08, len: 0.14, type: "triangle", vol: 0.04 }); },
  /* the "Did you know?" notice is dismissed */
  dismiss() { tone({ f: 600, to: 300, len: 0.09, type: "triangle", vol: 0.035 }); },
  /* prices and offers: two bright coin "clinks" */
  coin() { tone({ f: 1318, len: 0.07, type: "square", vol: 0.03 }); tone({ f: 1760, at: 0.07, len: 0.22, type: "square", vol: 0.03 }); },
  /* calculator answers: a few key beeps */
  calc() { [700, 900, 700, 1200].forEach((f, i) => tone({ f, at: i * 0.06, len: 0.05, type: "square", vol: 0.025 })); },
  /* time and date: a tick-tock and a bell */
  clock() { tone({ f: 900, len: 0.03, type: "square", vol: 0.03 }); tone({ f: 700, at: 0.2, len: 0.03, type: "square", vol: 0.03 }); tone({ f: 1568, at: 0.4, len: 0.4, type: "sine", vol: 0.045 }); },
  /* celebration: a rising run with a sparkle */
  cheer() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, at: i * 0.07, len: 0.14, type: "triangle", vol: 0.05 })); whoosh({ at: 0.3, len: 0.3, from: 1500, to: 5000, vol: 0.02 }); },
  /* greeting: a friendly two-note wave */
  wave() { tone({ f: 587, to: 698, len: 0.12, type: "triangle", vol: 0.05 }); tone({ f: 880, at: 0.12, len: 0.2, type: "triangle", vol: 0.05 }); },
  /* goodbye: two notes going down */
  bye() { tone({ f: 784, len: 0.14, type: "triangle", vol: 0.05 }); tone({ f: 523, at: 0.14, len: 0.26, type: "triangle", vol: 0.05 }); },
  /* a little giggle: quick wobbling chirps */
  giggle() { for (let i = 0; i < 5; i++) tone({ f: 900 + (i % 2) * 280, to: 1100 + (i % 2) * 200, at: i * 0.07, len: 0.06, type: "sine", vol: 0.04 }); },
};
