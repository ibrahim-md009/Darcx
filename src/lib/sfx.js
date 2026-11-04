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

export const sfx = {
  /* the panel pops open: a rising "bloop" */
  open() { tone({ f: 300, to: 760, len: 0.16, type: "triangle" }); tone({ f: 760, to: 1180, at: 0.1, len: 0.14, vol: 0.045 }); },
  /* the panel closes: a falling blip */
  close() { tone({ f: 720, to: 280, len: 0.15, type: "triangle" }); },
  /* a question is sent: a short tick */
  send() { tone({ f: 520, to: 700, len: 0.07, type: "square", vol: 0.025 }); },
  /* Dalil is "typing": soft blips */
  think() { tone({ f: 420, len: 0.05, vol: 0.035 }); tone({ f: 500, at: 0.12, len: 0.05, vol: 0.035 }); tone({ f: 580, at: 0.24, len: 0.05, vol: 0.035 }); },
  /* the answer arrives: a happy three-note chime */
  reply() { [660, 880, 1100].forEach((f, i) => tone({ f, at: i * 0.075, len: 0.12, vol: 0.055 })); },
  /* the "Did you know?" notice pops out (silent until the visitor has tapped something once) */
  notice() { tone({ f: 880, len: 0.12, vol: 0.04 }); tone({ f: 1320, at: 0.1, len: 0.2, vol: 0.04 }); },
};
