// Rush Hour Kitchen — audio.js
// Every sound is a WebAudio oscillator: no audio files, no network, and
// nothing plays until the player first presses a key or clicks (the
// browser's gesture rule), which is when unlock() is called.

export function createAudio() {
  let ctx = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, seconds, type, volume, when) {
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + (when || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  return {
    unlock() { ensure(); },

    // Short UI tap when a station is used.
    tap() { tone(520, 0.07, 'triangle', 0.08); },

    // Picking an ingredient off a shelf.
    pickup() { tone(660, 0.08, 'sine', 0.1); tone(880, 0.09, 'sine', 0.08, 0.06); },

    // One chop tick; the chopping loop calls this each beat.
    chopTick() { tone(180, 0.05, 'square', 0.07); },

    // A burner finished cooking.
    ding() { tone(1046, 0.18, 'sine', 0.12); tone(1318, 0.22, 'sine', 0.1, 0.12); },

    // A plate went out the window: a little cash-register arpeggio.
    serve() {
      tone(784, 0.09, 'triangle', 0.11);
      tone(988, 0.09, 'triangle', 0.11, 0.09);
      tone(1175, 0.16, 'triangle', 0.12, 0.18);
    },

    // A wrong plate, or an order expiring.
    fail() { tone(220, 0.22, 'sawtooth', 0.07); tone(165, 0.28, 'sawtooth', 0.06, 0.1); },

    // The last ten seconds of an order.
    tick() { tone(1200, 0.04, 'square', 0.05); },

    // The shift is over.
    fanfare() {
      tone(523, 0.14, 'triangle', 0.12);
      tone(659, 0.14, 'triangle', 0.12, 0.14);
      tone(784, 0.14, 'triangle', 0.12, 0.28);
      tone(1046, 0.3, 'triangle', 0.13, 0.42);
    },
  };
}
