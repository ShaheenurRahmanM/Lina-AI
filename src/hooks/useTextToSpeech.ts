import { useCallback, useEffect, useState } from 'react';

export interface SpeakOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  const getVoices = useCallback(() => voices, [voices]);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!('speechSynthesis' in window) || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? 'en-US';
    utterance.pitch = options?.pitch ?? 1;
    utterance.rate = options?.rate ?? 1;
    utterance.volume = options?.volume ?? 1;

    if (options?.voiceName) {
      const selected = voices.find((voice) => voice.name === options.voiceName);
      if (selected) utterance.voice = selected;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  return {
    speak,
    getVoices,
  };
}
