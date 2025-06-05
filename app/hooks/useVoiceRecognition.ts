'use client';

import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'react-toastify';

export const useVoiceRecognition = (
  isIOSDeviceState: boolean,
  isMobileDeviceState: boolean,
  onTranscriptReceived: (transcript: string) => void
) => {
  // Verwende useEffect für die Initialisierung von clientseitigen Zuständen
  const [isListening, setIsListening] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  
  const { browserSupportsSpeechRecognition, finalTranscript } = useSpeechRecognition();

  // Initialisiere den Browser-Support-Status erst nach dem Mounting
  useEffect(() => {
    setIsBrowserSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  // Effect to handle speech recognition transcript updates
  useEffect(() => {
    // When finalTranscript changes and is not empty, update the search query
    if (finalTranscript && !isListening) {
      onTranscriptReceived(finalTranscript);
    }
  }, [finalTranscript, isListening, onTranscriptReceived]);

  const toggleVoiceInput = () => {
    // CRITICAL: iOS devices must be blocked FIRST, regardless of browserSupportsSpeechRecognition
    if (isIOSDeviceState) {
      toast.error('Spracherkennung ist auf iOS-Geräten leider nicht verfügbar. Bitte verwenden Sie die Texteingabe.');
      return;
    }

    if (!isBrowserSupported) {
      if (isMobileDeviceState) {
        toast.error('Spracherkennung wird auf diesem mobilen Gerät nicht unterstützt. Bitte verwenden Sie die Texteingabe.');
      } else {
        toast.error('Spracherkennung wird von Ihrem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Edge.');
      }
      return;
    }

    if (isListening) {
      // Stop listening - the useEffect will handle the transcript processing
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      // Start listening with better error handling
      // CRITICAL SAFEGUARD: Double-check iOS state before starting
      if (isIOSDeviceState) {
        toast.error('Spracherkennung ist auf iOS-Geräten nicht verfügbar.');
        return;
      }

      try {
        SpeechRecognition.startListening({
          language: 'de-DE',
          continuous: false,
          interimResults: false
        });

        // CRITICAL SAFEGUARD: Only set listening state if not on iOS
        if (!isIOSDeviceState) {
          setIsListening(true);
        } else {
          SpeechRecognition.stopListening(); // Stop immediately
        }
      } catch (error) {
        setIsListening(false); // Ensure we reset the state on error
        toast.error('Fehler beim Starten der Spracherkennung. Bitte versuchen Sie es erneut.');
      }
    }
  };

  return {
    isListening,
    browserSupportsSpeechRecognition: isBrowserSupported,
    toggleVoiceInput
  };
};
