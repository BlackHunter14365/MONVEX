'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  lang = 'en-IN',
  onResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const toast = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(Boolean(hasSpeech));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      onError?.('not-supported');
      return;
    }

    // Stop any existing active session first
    stopListening();

    try {
      // 1. Explicitly request microphone stream to ensure browser prompt & permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
        } catch (mediaErr: any) {
          if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
            toast.error('Microphone permission was denied. Please allow microphone access in your browser address bar.');
            onError?.('permission-denied');
            return;
          }
        }
      }

      // 2. Create a FRESH instance on every click (avoids InvalidStateError)
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscriptAccumulator = '';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        toast.info('🎙️ Microphone active. Speak naturally...');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript + ' ';
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        if (currentFinal) {
          finalTranscriptAccumulator += currentFinal;
        }

        const combinedText = (finalTranscriptAccumulator + interimTranscript).trim();
        setTranscript(combinedText);
        onResult?.(combinedText, Boolean(currentFinal));
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access blocked. Click the lock icon in your URL bar and set Microphone to "Allow".');
        } else if (event.error === 'network') {
          toast.error('Voice service network glitch. Check your connection or type manually.');
        } else if (event.error === 'no-speech') {
          // No speech detected, quietly stop
        } else {
          toast.error(`Voice recognition error: ${event.error}`);
        }

        onError?.(event.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      toast.error('Could not initialize microphone. Please check browser permissions.');
      stopListening();
    }
  }, [lang, onResult, onError, stopListening, toast]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
