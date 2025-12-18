// Simple synth for sound effects to avoid external assets
let audioCtx: AudioContext | undefined;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playShuffleSound = () => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const t = ctx.currentTime;
  
  // Create noise buffer for "paper sliding" texture
  const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.linearRampToValueAtTime(1200, t + 0.15);

  const gain = ctx.createGain();
  // Soft attack, short decay
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.05); 
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
};

export const playFlipSound = () => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const t = ctx.currentTime;

  // "Snap" part - high pitch noise burst
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();

  // "Thud" part - body of the card
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.05, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
};