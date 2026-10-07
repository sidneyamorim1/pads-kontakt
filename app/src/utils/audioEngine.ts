export interface PadData {
  id: number;
  name: string;
  category: 'kick' | 'snare' | 'hihat' | 'perc' | 'synth' | 'fx';
  midiNote: number; // 0 to 127
  midiType?: 'note' | 'cc'; // 'note' or 'cc'
  keyTrigger: string; // '1', '2', '3', '4', '5', '6', '7', '8'
  volume: number; // 0-100
  pitch: number; // -12 to 12
  pan: number; // -100 to 100
  attack: number; // 0 to 0.5s
  release: number; // 0.05 to 2.0s
  reverbSend: number; // 0-100
  reverse: boolean;
  color: string;
  customBuffer?: AudioBuffer;
  customFileName?: string;
  customSampleId?: string; // referência ao arquivo salvo no presetStore
  playToEnd?: boolean; // card lateral: toca o áudio inteiro; clicar de novo reinicia
}

// Áudio de um card lateral que está tocando
interface FullVoice {
  gain: GainNode;
  source: AudioBufferSourceNode | null; // null = som sintetizado (sem sample carregado)
  timer?: number;
}


class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reversedCache: WeakMap<AudioBuffer, AudioBuffer> = new WeakMap();
  private fullVoices: Map<number, FullVoice> = new Map();
  private playingListener: ((padId: number, playing: boolean) => void) | null = null;

  // Avisa a interface quando um card lateral começa ou termina de tocar
  public onPlayingChange(listener: (padId: number, playing: boolean) => void) {
    this.playingListener = listener;
  }

  // Para todos os cards laterais (botão "Parar todos", troca de kit ou preset)
  public stopAllFull() {
    for (const padId of Array.from(this.fullVoices.keys())) this.stopFull(padId);
  }

  // Para um card lateral com um fade curto (evita estalo)
  public stopFull(padId: number, fade: number = 0.04) {
    const voice = this.fullVoices.get(padId);
    if (!voice || !this.ctx) return;
    const now = this.ctx.currentTime;
    const end = now + fade;
    const g = voice.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.exponentialRampToValueAtTime(0.0001, end);
    voice.source?.stop(end + 0.005);
    this.endFull(padId, voice);
  }

  private endFull(padId: number, voice: FullVoice) {
    if (this.fullVoices.get(padId) !== voice) return;
    clearTimeout(voice.timer);
    this.fullVoices.delete(padId);
    this.playingListener?.(padId, false);
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    // latencyHint 0 = menor buffer que o sistema aceita (~8 ms de saída no macOS contra ~16 ms do padrão)
    this.ctx = new AudioCtx({ latencyHint: 0 });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;

    // Create simple impulse response for reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(1.8, 2.0);

    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.3;

    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const length = sampleRate * duration;
    const buffer = (this.ctx || new AudioContext()).createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // Decodifica WAV, MP3, FLAC, AAC/M4A e OGG pelo navegador; AIFF por conta própria (o Chromium não lê AIFF).
  public async decode(data: ArrayBuffer): Promise<AudioBuffer> {
    this.init();
    const ctx = this.ctx!;
    try {
      // decodeAudioData consome o ArrayBuffer, então passamos uma cópia
      return await ctx.decodeAudioData(data.slice(0));
    } catch (err) {
      const aiff = decodeAiff(ctx, data);
      if (aiff) return aiff;
      throw err;
    }
  }

  public triggerPad(pad: PadData, velocity: number = 1.0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (pad.playToEnd) {
      this.playFull(pad, velocity);
      return;
    }

    const now = this.ctx.currentTime;
    const velFactor = Math.max(0.1, Math.min(1.0, velocity));

    // Nodes setup
    const padGain = this.ctx.createGain();
    const padVol = (pad.volume / 100) * velFactor;
    
    // Envelope
    const attack = pad.attack || 0.005;
    const release = pad.release || 0.3;
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.exponentialRampToValueAtTime(padVol, now + attack);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    // Pan
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pad.pan / 100, now);

    panner.connect(padGain);
    padGain.connect(this.masterGain);

    if (pad.reverbSend > 0 && this.reverbNode) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.value = pad.reverbSend / 100;
      padGain.connect(sendGain);
      sendGain.connect(this.reverbNode);
    }

    // Play custom buffer or synthetic sound
    const customBuf = pad.customBuffer;
    if (customBuf) {
      this.playBuffer(customBuf, panner, pad, now);
    } else {
      this.synthesizeSound(pad, panner, now);
    }
  }

  // Card lateral: toca o áudio inteiro (sem cortar no release); se já estava tocando, reinicia do começo
  private playFull(pad: PadData, velocity: number) {
    const ctx = this.ctx!;
    this.stopFull(pad.id, 0.005);

    const now = ctx.currentTime;
    const attack = pad.attack || 0.005;
    const release = pad.release || 0.3;
    const gain = ctx.createGain();
    const vol = Math.max((pad.volume / 100) * Math.max(0.1, Math.min(1.0, velocity)), 0.0002);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + attack);
    if (!pad.customBuffer) gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pad.pan / 100, now);
    panner.connect(gain);
    gain.connect(this.masterGain!);

    if (pad.reverbSend > 0 && this.reverbNode) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = pad.reverbSend / 100;
      gain.connect(sendGain);
      sendGain.connect(this.reverbNode);
    }

    const voice: FullVoice = { gain, source: null };
    this.fullVoices.set(pad.id, voice);
    if (pad.customBuffer) {
      voice.source = this.playBuffer(pad.customBuffer, panner, pad, now);
      voice.source.onended = () => this.endFull(pad.id, voice);
    } else {
      this.synthesizeSound(pad, panner, now);
      voice.timer = window.setTimeout(() => this.endFull(pad.id, voice), (attack + release) * 1000);
    }
    this.playingListener?.(pad.id, true);
  }

  private playBuffer(buffer: AudioBuffer, destination: AudioNode, pad: PadData, now: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    let playBuf = buffer;

    if (pad.reverse) {
      playBuf = this.reverseBuffer(buffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = playBuf;

    // Pitch conversion semitones to playbackRate
    const playbackRate = Math.pow(2, pad.pitch / 12);
    source.playbackRate.setValueAtTime(playbackRate, now);

    source.connect(destination);
    source.start(now);
    return source;
  }

  private reverseBuffer(buffer: AudioBuffer): AudioBuffer {
    if (!this.ctx) return buffer;
    const cached = this.reversedCache.get(buffer);
    if (cached) return cached;
    const revBuf = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const srcData = buffer.getChannelData(c);
      const destData = revBuf.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        destData[i] = srcData[buffer.length - 1 - i];
      }
    }
    this.reversedCache.set(buffer, revBuf);
    return revBuf;
  }

  private synthesizeSound(pad: PadData, destination: AudioNode, now: number) {
    if (!this.ctx) return;

    const pitchMult = Math.pow(2, pad.pitch / 12);

    switch (pad.category) {
      case 'kick': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150 * pitchMult, now);
        osc.frequency.exponentialRampToValueAtTime(35 * pitchMult, now + 0.12);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'snare': {
        // Noise + Pitch osc
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(220 * pitchMult, now);
        osc.frequency.exponentialRampToValueAtTime(80 * pitchMult, now + 0.1);
        oscGain.gain.setValueAtTime(0.7, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(oscGain);
        oscGain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // White Noise
        const noiseBuf = this.createNoiseBuffer(0.2);
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(destination);
        noiseSource.start(now);
        break;
      }
      case 'hihat': {
        const noiseBuf = this.createNoiseBuffer(0.15);
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000 * pitchMult, now);
        const noiseGain = this.ctx.createGain();
        const decayTime = pad.name.toLowerCase().includes('open') ? 0.3 : 0.08;
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(destination);
        noiseSource.start(now);
        break;
      }
      case 'perc': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 * pitchMult, now);
        osc.frequency.exponentialRampToValueAtTime(200 * pitchMult, now + 0.08);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      case 'synth': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        const freq = 329.63 * pitchMult; // E4
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.005, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
        break;
      }
      default: {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440 * pitchMult, now);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
    }
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const length = sampleRate * duration;
    const buffer = (this.ctx || new AudioContext()).createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

// Leitor de AIFF/AIFC sem compressão (PCM 8/16/24/32 bits, big-endian ou 'sowt' little-endian).
function decodeAiff(ctx: AudioContext, data: ArrayBuffer): AudioBuffer | null {
  const view = new DataView(data);
  const tag = (o: number) => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));
  if (data.byteLength < 12 || tag(0) !== 'FORM' || !['AIFF', 'AIFC'].includes(tag(8))) return null;

  let channels = 0, frames = 0, bits = 0, rate = 0, littleEndian = false, ssnd = -1;
  for (let o = 12; o + 8 <= data.byteLength;) {
    const id = tag(o);
    const size = view.getUint32(o + 4);
    const body = o + 8;
    if (id === 'COMM') {
      channels = view.getInt16(body);
      frames = view.getUint32(body + 2);
      bits = view.getInt16(body + 6);
      // taxa de amostragem em ponto flutuante estendido de 80 bits
      const exp = (view.getUint16(body + 8) & 0x7fff) - 16383;
      const mant = view.getUint32(body + 10) * 2 ** 32 + view.getUint32(body + 14);
      rate = mant * 2 ** (exp - 63);
      if (tag(8) === 'AIFC' && size >= 22) {
        const comp = tag(body + 18);
        if (comp === 'sowt') littleEndian = true;
        else if (comp !== 'NONE') return null;
      }
    } else if (id === 'SSND') {
      ssnd = body + 8 + view.getUint32(body);
    }
    o = body + size + (size % 2);
  }
  if (!channels || !frames || !rate || ssnd < 0 || ![8, 16, 24, 32].includes(bits)) return null;

  const bytes = bits / 8;
  const buffer = ctx.createBuffer(channels, frames, Math.round(rate));
  const out = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  for (let f = 0; f < frames; f++) {
    for (let c = 0; c < channels; c++) {
      const o = ssnd + (f * channels + c) * bytes;
      if (o + bytes > data.byteLength) return buffer;
      let v: number;
      if (bits === 8) v = view.getInt8(o) / 128;
      else if (bits === 16) v = view.getInt16(o, littleEndian) / 32768;
      else if (bits === 32) v = view.getInt32(o, littleEndian) / 2147483648;
      else {
        const [b0, b1, b2] = littleEndian
          ? [view.getUint8(o + 2), view.getUint8(o + 1), view.getUint8(o)]
          : [view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2)];
        v = (((b0 << 24) | (b1 << 16) | (b2 << 8)) >> 8) / 8388608;
      }
      out[c][f] = v;
    }
  }
  return buffer;
}

export const audioEngine = new AudioEngine();
