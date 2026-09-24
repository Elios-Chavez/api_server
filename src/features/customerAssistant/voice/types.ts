export type VoiceStatus = 'unsupported' | 'idle' | 'listening' | 'speaking';
export type SpeechRecognitionErrorCode = 'no-speech' | 'audio-capture' | 'not-allowed' | 'service-not-allowed' | 'network' | 'aborted' | string;
export type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
export type SpeechResultEvent = Event & { resultIndex: number; results: ArrayLike<SpeechResult> };
export type SpeechErrorEvent = Event & { error?: SpeechRecognitionErrorCode };
export type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; processLocally?: boolean; onresult: ((event: SpeechResultEvent) => void) | null; onerror: ((event: SpeechErrorEvent) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
export type SpeechRecognitionHandlers = { onFinal: (transcript: string) => void; onError: (code?: SpeechRecognitionErrorCode) => void; onEnd: () => void };
