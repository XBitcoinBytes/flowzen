// Audio management for zen sound effects
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isEnabled = false;
        this.volume = 0.3;
        
        this.initializeAudio();
        this.setupSounds();
    }
    
    async initializeAudio() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    setupSounds() {
        // Define zen-like sound effects using oscillators
        this.soundDefinitions = {
            pickup: {
                frequency: 440,
                type: 'sine',
                duration: 0.1,
                envelope: { attack: 0.01, decay: 0.09, sustain: 0, release: 0 }
            },
            drop: {
                frequency: 330,
                type: 'sine',
                duration: 0.15,
                envelope: { attack: 0.02, decay: 0.13, sustain: 0, release: 0 }
            },
            create: {
                frequency: 523,
                type: 'triangle',
                duration: 0.2,
                envelope: { attack: 0.01, decay: 0.19, sustain: 0, release: 0 }
            },
            error: {
                frequency: 220,
                type: 'sawtooth',
                duration: 0.3,
                envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.24 }
            },
            ripple: {
                frequency: 880,
                type: 'sine',
                duration: 0.8,
                envelope: { attack: 0.1, decay: 0.7, sustain: 0, release: 0 }
            }
        };
    }
    
    async playSound(soundName) {
        if (!this.isEnabled || !this.audioContext || !this.soundDefinitions[soundName]) {
            return;
        }
        
        try {
            // Resume audio context if suspended (required by browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const soundDef = this.soundDefinitions[soundName];
            this.createAndPlayTone(soundDef);
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }
    
    createAndPlayTone(soundDef) {
        const now = this.audioContext.currentTime;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = soundDef.type;
        oscillator.frequency.setValueAtTime(soundDef.frequency, now);
        
        // Create envelope (ADSR)
        const envelope = this.audioContext.createGain();
        envelope.gain.setValueAtTime(0, now);
        
        const { attack, decay, sustain, release } = soundDef.envelope;
        const sustainLevel = sustain * 0.5; // Keep sustain level moderate
        
        // Attack
        envelope.gain.linearRampToValueAtTime(0.5, now + attack);
        
        // Decay
        envelope.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
        
        // Release
        envelope.gain.linearRampToValueAtTime(0, now + soundDef.duration);
        
        // Connect nodes
        oscillator.connect(envelope);
        envelope.connect(this.masterGain);
        
        // Schedule playback
        oscillator.start(now);
        oscillator.stop(now + soundDef.duration);
        
        // Add some zen-like effects for certain sounds
        if (soundDef.frequency > 400) {
            this.addReverbEffect(envelope);
        }
    }
    
    addReverbEffect(source) {
        try {
            // Simple reverb using delay and feedback
            const delay = this.audioContext.createDelay(0.3);
            const feedback = this.audioContext.createGain();
            const wet = this.audioContext.createGain();
            
            delay.delayTime.setValueAtTime(0.1, this.audioContext.currentTime);
            feedback.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            wet.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            
            source.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wet);
            wet.connect(this.masterGain);
        } catch (error) {
            console.warn('Reverb effect error:', error);
        }
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            const icon = soundBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-feather', this.isEnabled ? 'volume-2' : 'volume-x');
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        }
        
        // Play a test sound when enabling
        if (this.isEnabled) {
            setTimeout(() => this.playSound('ripple'), 100);
        }
        
        // Save preference
        localStorage.setItem('zenflow_sound_enabled', this.isEnabled.toString());
        
        return this.isEnabled;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
        localStorage.setItem('zenflow_volume', this.volume.toString());
    }
    
    loadSettings() {
        // Load sound preference
        const soundEnabled = localStorage.getItem('zenflow_sound_enabled');
        if (soundEnabled !== null) {
            this.isEnabled = soundEnabled === 'true';
        }
        
        // Load volume preference
        const savedVolume = localStorage.getItem('zenflow_volume');
        if (savedVolume !== null) {
            this.setVolume(parseFloat(savedVolume));
        }
        
        // Update UI
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            const icon = soundBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-feather', this.isEnabled ? 'volume-2' : 'volume-x');
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        }
    }
    
    // Ambient background sounds (optional)
    async startAmbientSound() {
        if (!this.isEnabled || !this.audioContext) return;
        
        try {
            // Create a gentle water-like ambient sound
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
            
            const noise = this.createWhiteNoise();
            const ambientGain = this.audioContext.createGain();
            ambientGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            
            noise.connect(filter);
            filter.connect(ambientGain);
            ambientGain.connect(this.masterGain);
            
            this.ambientSource = noise;
        } catch (error) {
            console.warn('Ambient sound error:', error);
        }
    }
    
    createWhiteNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);
        
        return whiteNoise;
    }
    
    stopAmbientSound() {
        if (this.ambientSource) {
            this.ambientSource.stop();
            this.ambientSource = null;
        }
    }
    
    // Zen meditation bell (special feature)
    async playMeditationBell() {
        if (!this.isEnabled || !this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            
            // Create a bell-like sound with multiple harmonics
            const fundamentalFreq = 220; // A3
            const harmonics = [1, 2, 3, 4, 5];
            const duration = 3;
            
            harmonics.forEach((harmonic, index) => {
                const oscillator = this.audioContext.createOscillator();
                const envelope = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(fundamentalFreq * harmonic, now);
                
                const amplitude = 1 / (harmonic * 2); // Decreasing amplitude for higher harmonics
                envelope.gain.setValueAtTime(0, now);
                envelope.gain.linearRampToValueAtTime(amplitude * 0.3, now + 0.1);
                envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
                
                oscillator.connect(envelope);
                envelope.connect(this.masterGain);
                
                oscillator.start(now);
                oscillator.stop(now + duration);
            });
        } catch (error) {
            console.warn('Meditation bell error:', error);
        }
    }
}

// Initialize audio manager and set up controls
document.addEventListener('DOMContentLoaded', () => {
    window.audioManager = new AudioManager();
    
    // Set up sound toggle button
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            window.audioManager.toggle();
        });
    }
    
    // Load saved settings
    window.audioManager.loadSettings();
    
    // Auto-enable sound on first user interaction
    const enableSoundOnInteraction = () => {
        if (!window.audioManager.isEnabled) {
            window.audioManager.toggle();
        }
        document.removeEventListener('click', enableSoundOnInteraction);
        document.removeEventListener('touchstart', enableSoundOnInteraction);
    };
    
    // Wait for user interaction before enabling audio (browser requirement)
    document.addEventListener('click', enableSoundOnInteraction, { once: true });
    document.addEventListener('touchstart', enableSoundOnInteraction, { once: true });
});
