import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  onResult: (text: string) => void;
}

export function useSpeechRecognition({ onResult }: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const instance = new SpeechRecognition();
      instance.continuous = false;
      instance.interimResults = true;
      instance.lang = 'en-US';

      instance.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onResult(transcript.trim());
        }
      };

      instance.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        isStartedRef.current = false;
        setListening(false);
      };

      instance.onend = () => {
        isStartedRef.current = false;
        setListening(false);
      };

      recognitionRef.current = instance;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }

    return () => {
      try {
        if (recognitionRef.current && isStartedRef.current) {
          recognitionRef.current.abort();
        }
      } catch {
        // ignore cleanup abort error
      }
    };
  }, [onResult]);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isStartedRef.current) return;

    try {
      recognition.start();
      isStartedRef.current = true;
      setListening(true);
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      isStartedRef.current = false;
      setListening(false);
    }
  }, []);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch {
      // ignore
    } finally {
      isStartedRef.current = false;
      setListening(false);
    }
  }, []);

  return { listening, startRecognition, stopRecognition };
}
