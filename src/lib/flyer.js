/* The little round head that travels across the screen (used by components/Buddy.jsx).
   One fixed element is moved with the Web Animations API along curved paths; every call returns a promise that
   resolves true when the move finished and false when it was interrupted (stop) so callers can simply stop awaiting. */

const STEPS = 16; // samples along a curve

export class Flyer {
  constructor(el, size = 58) {
    this.el = el;
    this.half = size / 2;
    this.at = { x: 0, y: 0 };
    this.scale = 1;
    this.run = 0;      // changes on every stop(), so older awaits know they were cancelled
    this.animations = new Set();
  }

  transform(x, y, scale = this.scale, tilt = 0) {
    return `translate(${(x - this.half).toFixed(1)}px, ${(y - this.half).toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scale(${scale})`;
  }

  /* put the head somewhere and show it */
  show(point, scale = 1) {
    this.at = { ...point };
    this.scale = scale;
    this.el.hidden = false;
    this.el.style.transform = this.transform(point.x, point.y, scale);
  }
  hide() { this.el.hidden = true; }

  /* cancel whatever is running; the head stays where it last finished */
  stop() {
    this.run++;
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();
    this.el.style.transform = this.transform(this.at.x, this.at.y);
  }

  async play(frames, ms, easing) {
    const run = this.run;
    const animation = this.el.animate(frames, { duration: ms, easing, fill: "both" });
    this.animations.add(animation);
    try { await animation.finished; } catch { return false; }
    this.animations.delete(animation);
    return run === this.run;
  }

  /* fly along a curve (it bulges upward by `lift` px), growing or shrinking to `scale` */
  async move(to, { ms = 800, lift = 80, scale = 1, easing = "cubic-bezier(0.5, 0, 0.2, 1)" } = {}) {
    const from = this.at, from_s = this.scale;
    const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
    const direction = Math.sign(to.x - from.x) || 1;
    const frames = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS, u = 1 - t;
      const x = u * u * from.x + 2 * u * t * control.x + t * t * to.x;
      const y = u * u * from.y + 2 * u * t * control.y + t * t * to.y;
      frames.push({ transform: this.transform(x, y, from_s + (scale - from_s) * t, Math.sin(Math.PI * t) * 12 * direction), offset: t });
    }
    const finished = await this.play(frames, ms, easing);
    if (!finished) return false;
    this.at = { ...to };
    this.scale = scale;
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();
    this.el.style.transform = this.transform(to.x, to.y, scale);
    return true;
  }

  /* jump up and down on the spot (a squash on landing) */
  async hop(times = 2, ms = 480, height = 22) {
    const { x, y } = this.at, s = this.scale;
    const frames = [];
    for (let k = 0; k < times; k++) {
      const base = k / times, span = 1 / times;
      frames.push(
        { transform: this.transform(x, y, s), offset: base },
        { transform: this.transform(x, y - height, s * 1.04, k % 2 ? 6 : -6), offset: base + span * 0.45 },
        { transform: this.transform(x, y + 2, s * 1.08, 0).replace(`scale(${s * 1.08})`, `scale(${(s * 1.1).toFixed(3)}, ${(s * 0.9).toFixed(3)})`), offset: base + span * 0.8 },
      );
    }
    frames.push({ transform: this.transform(x, y, s), offset: 1 });
    const finished = await this.play(frames, ms * times, "ease-in-out");
    if (finished) { this.animations.forEach(animation => animation.cancel()); this.animations.clear(); this.el.style.transform = this.transform(x, y, s); }
    return finished;
  }

  /* a quick press (squash and release), e.g. when it lands on a button */
  async press(ms = 220) {
    const { x, y } = this.at, s = this.scale;
    const finished = await this.play([
      { transform: this.transform(x, y, s), offset: 0 },
      { transform: this.transform(x, y + 3, s).replace(`scale(${s})`, `scale(${(s * 1.14).toFixed(3)}, ${(s * 0.82).toFixed(3)})`), offset: 0.45 },
      { transform: this.transform(x, y, s), offset: 1 },
    ], ms, "ease-out");
    if (finished) { this.animations.forEach(animation => animation.cancel()); this.animations.clear(); this.el.style.transform = this.transform(x, y, s); }
    return finished;
  }
}
