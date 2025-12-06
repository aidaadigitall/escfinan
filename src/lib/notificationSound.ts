// Notification sound utility using Web Audio API

let audioContext: AudioContext | null = null;

// Initialize AudioContext on first user interaction (required by browsers)
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Play a notification sound using Web Audio API
export const playNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Resume audio context if suspended (required after user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for notification sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Notification-style beep sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(988, ctx.currentTime + 0.1); // B5 note
    oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.2); // C6 note

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};
