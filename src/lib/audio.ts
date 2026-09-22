const NOTES: Record<string, number> = {
  G: 196.0,
  D: 293.66,
  A: 440.0,
  E: 659.25,
};

let audioCtx: AudioContext | null = null;
let masterMuted = false;

export function setMuted(muted: boolean) {
  masterMuted = muted;
}

function ctx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function makeImpulse(ac: AudioContext, seconds = 1.4) {
  const rate = ac.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ac.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.4);
    }
  }
  return impulse;
}

let convolver: ConvolverNode | null = null;

function getReverb(ac: AudioContext) {
  if (!convolver) {
    convolver = ac.createConvolver();
    convolver.buffer = makeImpulse(ac);
  }
  return convolver;
}

export async function playString(id: string, duration = 1.8) {
  if (masterMuted) return;
  const freq = NOTES[id];
  if (!freq) return;
  const ac = ctx();
  if (ac.state === "suspended") await ac.resume();

  const now = ac.currentTime;
  const oscA = ac.createOscillator();
  const oscB = ac.createOscillator();
  const oscC = ac.createOscillator();
  oscA.type = "sawtooth";
  oscB.type = "triangle";
  oscC.type = "sine";
  oscA.frequency.value = freq;
  oscB.frequency.value = freq;
  oscC.frequency.value = freq * 2;

  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq * 1.6;
  bp.Q.value = 6;

  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = freq * 8;
  lp.Q.value = 0.7;

  const gain = ac.createGain();
  const body = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.28);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 5.2;
  lfoGain.gain.value = freq * 0.004;
  lfo.connect(lfoGain);
  lfoGain.connect(oscA.frequency);
  lfoGain.connect(oscB.frequency);

  const dry = ac.createGain();
  const wet = ac.createGain();
  dry.gain.value = 0.72;
  wet.gain.value = 0.28;

  oscA.connect(bp);
  oscB.connect(bp);
  oscC.connect(lp);
  bp.connect(lp);
  lp.connect(gain);
  gain.connect(body);
  body.connect(dry);
  body.connect(wet);
  dry.connect(ac.destination);
  const rev = getReverb(ac);
  wet.connect(rev);
  rev.connect(ac.destination);

  oscA.start(now);
  oscB.start(now);
  oscC.start(now);
  lfo.start(now);
  oscA.stop(now + duration);
  oscB.stop(now + duration);
  oscC.stop(now + duration);
  lfo.stop(now + duration);
}

export async function playChord() {
  if (masterMuted) return;
  await playString("G", 2.4);
  window.setTimeout(() => void playString("D", 2.2), 90);
  window.setTimeout(() => void playString("A", 2.0), 180);
  window.setTimeout(() => void playString("E", 1.8), 270);
}
