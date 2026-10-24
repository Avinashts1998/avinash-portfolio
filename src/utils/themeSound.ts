/**
 * Acoustic Water-Drop / Wooden Pop Audio Synthesizer for Theme Toggle.
 * Produces a soft, organic, soothing droplet sound using the Web Audio API.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playThemeSound(targetTheme: "light" | "dark") {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const isLight = targetTheme === "light";

  try {
    // 1. Primary Liquid / Droplet Tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";

    if (isLight) {
      // Light mode: Bubbly upward water drop ("bloop")
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.038);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else {
      // Dark mode: Calm downward wooden drop ("plop")
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.048);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.14);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (isLight ? 0.16 : 0.19));

    // 2. Soft Organic Overtone for Acoustic Realism
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();

    overtone.type = "sine";
    const overFreq = isLight ? 1280 : 480;
    overtone.frequency.setValueAtTime(overFreq, now);
    overtone.frequency.exponentialRampToValueAtTime(overFreq * (isLight ? 1.2 : 0.7), now + 0.04);

    overtoneGain.gain.setValueAtTime(0.001, now);
    overtoneGain.gain.linearRampToValueAtTime(0.03, now + 0.01);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    overtone.connect(overtoneGain);
    overtoneGain.connect(ctx.destination);

    overtone.start(now);
    overtone.stop(now + 0.09);
  } catch {}
}
