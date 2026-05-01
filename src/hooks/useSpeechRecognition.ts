import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseSpeechRecognitionOptions {
  onResult: (text: string) => void;
}

export function useSpeechRecognition({ onResult }: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recognition = useMemo(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const instance = new SpeechRecognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'en-US';
    return instance;
  }, []);

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  }, [recognition, onResult]);

  const startRecognition = useCallback(() => {
    if (!recognition) return;
    recognition.start();
    setListening(true);
  }, [recognition]);

  const stopRecognition = useCallback(() => {
    if (!recognition) return;
    recognition.stop();
    setListening(false);
  }, [recognition]);

  return { listening, startRecognition, stopRecognition };
}
