import { useCallback, useEffect, useState } from 'react';

export interface SpeakOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~#]/g, '')
    .replace(/>\s*/g, '')
    .trim();
}

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices && availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      } catch (err) {
        console.warn('Failed to retrieve speech synthesis voices:', err);
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  const getVoices = useCallback(() => voices, [voices]);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return;

      try {
        window.speechSynthesis.cancel();

        const clean = stripMarkdown(text);
        if (!clean) return;

        // Take up to first 500 characters to prevent browser speech synthesis engine hangs
        const spokenText = clean.length > 500 ? clean.slice(0, 500) + '...' : clean;

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = options?.lang ?? 'en-US';
        utterance.pitch = options?.pitch ?? 1;
        utterance.rate = options?.rate ?? 1;
        utterance.volume = options?.volume ?? 1;

        if (options?.voiceName && options.voiceName !== 'default') {
          const selected = voices.find((voice) => voice.name === options.voiceName);
          if (selected) utterance.voice = selected;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak error:', err);
      }
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    speak,
    stop,
    getVoices,
  };
}
