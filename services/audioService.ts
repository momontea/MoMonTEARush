
class AudioController {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicNodes: { osc: OscillatorNode, gain: GainNode }[] = [];
    private isPlaying: boolean = false;
    private tempo: number = 0.15; // Seconds per 16th note
    private currentNote: number = 0;
    private nextNoteTime: number = 0;
    private scheduleAheadTime: number = 0.1;
    private lookahead: number = 25;
    private timerID: number | null = null;
    
    // Scales for procedural music
    private bassLine = [55, 55, 55, 55, 58, 58, 62, 62]; // A1...
    private melodyLine = [440, 0, 440, 554, 0, 659, 0, 554]; // A4, C#5, E5...

    constructor() {}

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private createOscillator(type: OscillatorType, freq: number, duration: number, startTime: number, vol: number = 0.5) {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // --- SOUND EFFECTS ---

    playCollect(combo: number) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Pitch goes up with combo (Candy Crush style)
        // Pentatonic scale steps approx: 0, 2, 4, 7, 9, 12...
        const baseFreq = 440; // A4
        const semitones = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
        const index = Math.min(combo, semitones.length - 1);
        const freq = baseFreq * Math.pow(2, semitones[index] / 12);

        // "Bloop" sound
        this.createOscillator('sine', freq, 0.1, now, 0.3);
        this.createOscillator('triangle', freq * 2, 0.05, now, 0.1); // Harmonic
    }

    playBad() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // "Crunch" / Hit sound
        this.createOscillator('sawtooth', 100, 0.1, now, 0.4);
        this.createOscillator('square', 50, 0.2, now, 0.4);
        // Pitch drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playFreeze() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Glass breaking / Freezing sound (High freq noise-ish)
        this.createOscillator('sine', 2000, 0.1, now, 0.2);
        this.createOscillator('triangle', 1500, 0.15, now + 0.05, 0.2);
        this.createOscillator('sine', 1800, 0.2, now + 0.1, 0.1);
    }

    playPowerUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Arpeggio Up
        this.createOscillator('sine', 523.25, 0.1, now, 0.3); // C5
        this.createOscillator('sine', 659.25, 0.1, now + 0.1, 0.3); // E5
        this.createOscillator('sine', 783.99, 0.2, now + 0.2, 0.3); // G5
        this.createOscillator('sine', 1046.50, 0.4, now + 0.3, 0.3); // C6
    }

    playSugarRush() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Fast high energy sequence
        this.createOscillator('square', 880, 0.1, now, 0.1);
        this.createOscillator('square', 880, 0.1, now + 0.1, 0.1);
        this.createOscillator('square', 880, 0.1, now + 0.2, 0.1);
        this.createOscillator('sawtooth', 1760, 1.0, now + 0.3, 0.2);
    }

    // --- MUSIC LOOP ---

    private scheduler() {
        while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    private scheduleNote(beatNumber: number, time: number) {
        if (!this.ctx || !this.masterGain) return;

        const step = beatNumber % 8;
        
        // Kick Drum (on 0, 4)
        if (step === 0 || step === 4) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.5);
        }

        // Hi-Hat (every odd step)
        if (step % 2 !== 0) {
            // Simulated with high freq noise/triangle
            this.createOscillator('square', 800, 0.05, time, 0.05);
        }

        // Bass Line
        const bassFreq = this.bassLine[step];
        if (bassFreq > 0) {
             this.createOscillator('triangle', bassFreq, 0.2, time, 0.3);
        }

        // Melody (randomized slightly)
        if (Math.random() > 0.3) {
            const melodyFreq = this.melodyLine[step];
            if (melodyFreq > 0) {
                this.createOscillator('sine', melodyFreq, 0.1, time, 0.1);
            }
        }
    }

    private nextNote() {
        const secondsPerBeat = this.tempo;
        this.nextNoteTime += secondsPerBeat;
        this.currentNote++;
        if (this.currentNote === 8) {
            this.currentNote = 0;
        }
    }

    startMusic(isRush: boolean = false) {
        if (this.isPlaying || !this.ctx) return;
        this.isPlaying = true;
        this.tempo = isRush ? 0.10 : 0.15; // Faster tempo for rush
        this.currentNote = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduler();
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.timerID) {
            window.clearTimeout(this.timerID);
            this.timerID = null;
        }
    }
    
    setRushMode(isRush: boolean) {
        this.tempo = isRush ? 0.10 : 0.15;
        if (isRush) this.playSugarRush();
    }
}

export const AudioService = new AudioController();
