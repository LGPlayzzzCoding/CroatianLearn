import { useState, useCallback, useRef } from "react";

interface UseAudioReturn {
  isPlaying: boolean;
  playAudio: (text: string, lang?: string) => Promise<void>;
  stopAudio: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useAudio(): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const playAudio = useCallback(async (text: string, lang: string = 'hr-HR'): Promise<void> => {
    if (!isSupported) {
      setError("Text-to-speech is not supported in this browser");
      return;
    }

    if (!text.trim()) {
      setError("No text provided for audio playback");
      return;
    }

    try {
      // Stop any currently playing audio
      if (currentUtteranceRef.current) {
        window.speechSynthesis.cancel();
      }

      setError(null);
      setIsPlaying(true);

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      // Configure utterance
      utterance.lang = lang;
      utterance.rate = 0.8; // Slightly slower for learning
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a Croatian voice, fallback to default
      const voices = window.speechSynthesis.getVoices();
      const croatianVoice = voices.find(voice => 
        voice.lang.startsWith('hr') || 
        voice.lang.startsWith('hr-HR') ||
        voice.name.toLowerCase().includes('croatian')
      );
      
      if (croatianVoice) {
        utterance.voice = croatianVoice;
      }

      // Set up event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setError(null);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setError(`Audio playback error: ${event.error}`);
        setIsPlaying(false);
        currentUtteranceRef.current = null;
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);

      // If voices aren't loaded yet, try again after a delay
      if (voices.length === 0) {
        setTimeout(() => {
          const newVoices = window.speechSynthesis.getVoices();
          const newCroatianVoice = newVoices.find(voice => 
            voice.lang.startsWith('hr') || 
            voice.lang.startsWith('hr-HR') ||
            voice.name.toLowerCase().includes('croatian')
          );
          
          if (newCroatianVoice && currentUtteranceRef.current) {
            currentUtteranceRef.current.voice = newCroatianVoice;
          }
        }, 100);
      }

    } catch (err) {
      console.error('Error in playAudio:', err);
      setError("Failed to play audio");
      setIsPlaying(false);
      currentUtteranceRef.current = null;
    }
  }, [isSupported]);

  const stopAudio = useCallback(() => {
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  return {
    isPlaying,
    playAudio,
    stopAudio,
    isSupported,
    error,
  };
}
