import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(
    type: 'result',
    listener: (event: SpeechRecognitionEvent) => void
  ): void;
  addEventListener(
    type: 'error',
    listener: (event: SpeechRecognitionErrorEvent) => void
  ): void;
  addEventListener(
    type: 'start' | 'end' | 'speechstart' | 'speechend',
    listener: (event: Event) => void
  ): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hr-HR'; // Croatian language
      recognition.maxAlternatives = 1;

      recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
        const result = event.results[0];
        if (result && result[0]) {
          const spokenText = result[0].transcript;
          setTranscript(spokenText);
          setIsListening(false);
          setError(null);
        }
      });

      recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      });

      recognition.addEventListener('start', () => {
        setIsListening(true);
        setError(null);
        
        // Auto-stop after 10 seconds to prevent hanging
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, 10000);
      });

      recognition.addEventListener('end', () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });

      recognition.addEventListener('speechstart', () => {
        setError(null);
      });

      recognition.addEventListener('speechend', () => {
        // Speech has ended, recognition will process the result
      });
    } else {
      setIsSupported(false);
      setError("Speech recognition is not supported in this browser");
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("Speech recognition is not available");
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setTranscript("");
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError("Failed to start speech recognition");
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
