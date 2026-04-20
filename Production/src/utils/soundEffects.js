// src/utils/soundEffects.js

/**
 * 🎵 8-Bit Web Audio Synthesizer
 * Generate classic retro sounds without needing external MP3 files!
 */

export const play8BitClick = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume context if suspended (browser auto-play policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // 8-bit systems famous for 'square' and 'sawtooth' waves
        oscillator.type = 'square';
        
        // 🎛️ Pitch: Starts high (900Hz) and drops slightly (600Hz) for a "blip" sound
        oscillator.frequency.setValueAtTime(900, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);

        // 🔊 Volume: Very short curve to sound like a crisp button click
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Lowered volume to not be annoying
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.06);
    } catch (e) {
        console.warn("Web Audio API not supported or blocked", e);
    }
};

export const play8BitSuccess = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // เปลี่ยนมาใช้ Triangle แทน Square เพื่อให้เสียงดู "ใส" และไม่กวนแบบเสียงเลเซอร์
        osc.type = 'triangle';
        const now = audioCtx.currentTime;
        
        // สร้างเสียงแนว "วิ้งง-ติ๊งง!" สองจังหวะเพื่อให้รู้ว่าเป็นการแจ้งเตือน
        // E5 (659Hz) -> C6 (1046Hz) 
        osc.frequency.setValueAtTime(659.25, now);       
        osc.frequency.setValueAtTime(1046.50, now + 0.15); 

        // จัดการระดับเสียงให้สว่างขึ้นแต่ไม่หนวกหู
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05); // Fade in
        gainNode.gain.setValueAtTime(0.1, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // Fade out longer

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    } catch (e) {}
};
