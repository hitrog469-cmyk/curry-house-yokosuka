// Notification Sound Utility - Web Audio API based (no mp3 files needed)
// Works on all modern browsers, generates sounds programmatically

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

async function ensureResumed(): Promise<AudioContext> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx
}

async function playTone(frequency: number, duration: number, volume: number = 0.8, type: OscillatorType = 'square', startDelay: number = 0) {
  try {
    const ctx = await ensureResumed()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay)

    // Attack: quick ramp up
    gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay)
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.01)
    // Sustain then decay
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + startDelay + duration * 0.7)
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime + startDelay)
    oscillator.stop(ctx.currentTime + startDelay + duration)
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

// ==========================================
// NEW ORDER - LOUD alarm for reception desk
// 3 ascending beeps, repeated twice
// ==========================================
export async function playNewOrderSound(volume: number = 1.0) {
  try {
    await ensureResumed()
    // First set of 3 ascending beeps
    playTone(880, 0.15, volume, 'square', 0)
    playTone(1100, 0.15, volume, 'square', 0.2)
    playTone(1400, 0.3, volume, 'square', 0.4)
    // Second set after pause
    playTone(880, 0.15, volume, 'square', 0.9)
    playTone(1100, 0.15, volume, 'square', 1.1)
    playTone(1400, 0.3, volume, 'square', 1.3)
    // Third set - even louder for urgency
    playTone(880, 0.15, Math.min(volume * 1.2, 1.0), 'square', 1.8)
    playTone(1100, 0.15, Math.min(volume * 1.2, 1.0), 'square', 2.0)
    playTone(1400, 0.4, Math.min(volume * 1.2, 1.0), 'square', 2.2)
  } catch (e) {
    console.warn('New order sound failed:', e)
  }
}

// ==========================================
// ORDER UPDATE - Pleasant notification beep
// ==========================================
export async function playOrderUpdateSound(volume: number = 0.6) {
  try {
    await ensureResumed()
    playTone(660, 0.12, volume, 'sine', 0)
    playTone(880, 0.2, volume, 'sine', 0.15)
  } catch (e) {
    console.warn('Order update sound failed:', e)
  }
}

// ==========================================
// DELIVERY ALERT - Two quick beeps
// ==========================================
export async function playDeliveryAlertSound(volume: number = 0.7) {
  try {
    await ensureResumed()
    playTone(1000, 0.1, volume, 'triangle', 0)
    playTone(1200, 0.15, volume, 'triangle', 0.18)
  } catch (e) {
    console.warn('Delivery alert sound failed:', e)
  }
}

// ==========================================
// BILL REQUEST - Gentle descending tone
// ==========================================
export async function playBillRequestSound(volume: number = 0.5) {
  try {
    await ensureResumed()
    playTone(800, 0.15, volume, 'sine', 0)
    playTone(600, 0.2, volume, 'sine', 0.2)
  } catch (e) {
    console.warn('Bill request sound failed:', e)
  }
}

// ==========================================
// ENABLE AUDIO - Call on first user click
// Plays a short confirmation beep so user knows it works
// ==========================================
export async function enableAudio() {
  try {
    const ctx = getAudioContext()

    // Force resume
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    // Play a short audible confirmation beep so user hears that sound is now enabled
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)

    // Second confirmation beep (higher pitch)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.15)

    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15)
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.17)
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.3)

    return true
  } catch (e) {
    console.error('Failed to enable audio:', e)
    return false
  }
}

// Check if audio context is active
export function isAudioEnabled(): boolean {
  return audioContext !== null && audioContext.state === 'running'
}
