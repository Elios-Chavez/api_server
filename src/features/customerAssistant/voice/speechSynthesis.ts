import { VOICE_LANGUAGE } from './speechRecognition';
export function canUseSpeechSynthesis() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'; }
export function getSpeechVoices() { return canUseSpeechSynthesis() ? window.speechSynthesis.getVoices() : []; }
export function subscribeToVoicesChanged(listener: () => void) { if (!canUseSpeechSynthesis()) return () => undefined; window.speechSynthesis.addEventListener('voiceschanged', listener); return () => window.speechSynthesis.removeEventListener('voiceschanged', listener); }
export function chooseSpeechVoice() { const voices = getSpeechVoices(); return voices.find((voice) => voice.lang.toLowerCase() === VOICE_LANGUAGE.toLowerCase()) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('es-')) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('es')) ?? voices[0]; }
export function cancelSpeech() { if (canUseSpeechSynthesis()) window.speechSynthesis.cancel(); }
export function createSpeechUtterance(text: string) { const utterance = new SpeechSynthesisUtterance(text); utterance.lang = VOICE_LANGUAGE; return utterance; }
