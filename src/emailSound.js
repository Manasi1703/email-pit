import { audioUrl } from "./audio.js";

// Paper rustle for ruffling through the envelopes. If audios/ has a file whose name contains ruffle (or rustle, paper, emails) it is used: short slices of it
// are played, louder the faster you ruffle. Without one, a synthesised rustle (filtered noise grains and crinkle clicks) is used instead.
export function createRustle(url = audioUrl("ruffle", "rustle", "paper", "emails")) {
  let ctx = null, out = null, noise = null, last = 0, bytes = null, buf = null, decoding = false;
  if (url) fetch(url).then(r => r.arrayBuffer()).then(b => { bytes = b; decode(); }).catch(() => {});
  function decode() {
    if (!ctx || !bytes || decoding || buf) return; decoding = true;
    ctx.decodeAudioData(bytes.slice(0)).then(b => { buf = b; }).catch(() => { decoding = false; });
  }
  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); out.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    decode(); return ctx;
  }
  const panner = pan => { const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) { p.pan.value = pan; p.connect(out); } return p || out; };
  function playFile(now, s, pan) {   // a short slice of the recording
    const src = ctx.createBufferSource(), g = ctx.createGain(), len = Math.min(buf.duration * 0.9, 0.16 + Math.random() * 0.22);
    src.buffer = buf; src.playbackRate.value = 0.92 + Math.random() * 0.2;
    g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.9 * s, now + 0.02); g.gain.linearRampToValueAtTime(0.0001, now + len);
    src.connect(g); g.connect(panner(pan)); src.start(now, Math.random() * Math.max(0.01, buf.duration - len)); src.stop(now + len + 0.05);
  }
  function playSynth(now, s, pan) {
    const dur = 0.06 + Math.random() * 0.1;
    for (let n = 0; n < 2; n++) {   // a body of soft noise, then a sharper crinkle
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noise; bp.type = "bandpass"; bp.frequency.value = n ? 5200 + Math.random() * 3000 : 2400 + Math.random() * 2200; bp.Q.value = n ? 1.6 : 0.7;
      hp.type = "highpass"; hp.frequency.value = 1400;
      const len = n ? 0.012 + Math.random() * 0.02 : dur, amp = (n ? 0.45 : 0.3) * s * (0.6 + Math.random() * 0.6);
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(amp, now + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, now + len);
      src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(panner(pan));
      src.start(now + (n ? Math.random() * dur * 0.7 : 0), Math.random() * 1.5); src.stop(now + len + dur + 0.05);
    }
  }
  return {
    unlock() { if (ensure() && ctx.state === "suspended") ctx.resume().then(decode); },   // call from a click or key press
    /** One burst of rustling. strength 0..1. Calls closer than 45 ms apart are ignored. */
    play(strength = 0.6, pan = 0) {
      if (!ctx || ctx.state !== "running") return;
      const now = ctx.currentTime; if (now - last < 0.045) return; last = now;
      const s = Math.min(1, Math.max(0.15, strength));
      if (buf) playFile(now, s, pan); else playSynth(now, s, pan);
    }
  };
}
