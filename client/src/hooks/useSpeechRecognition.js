import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for Web Speech API integration
 * Provides speech recognition functionality with specific MARS requirements
 */
export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(null);
  
  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition settings according to requirements
      recognitionRef.current.continuous = false;  // Don't listen continuously
      recognitionRef.current.interimResults = false;  // No interim results
      recognitionRef.current.lang = 'en-US';  // English US
      
      // Set up event handlers
      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        
        // Call the transcript callback if provided
        if (onTranscriptRef.current) {
          onTranscriptRef.current(result);
        }
      };
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Start recording
  const startListening = useCallback((onTranscript) => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    if (isListening) {
      console.log('Already listening');
      return;
    }
    
    onTranscriptRef.current = onTranscript;
    setTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError(err.message);
    }
  }, [isSupported, isListening]);
  
  // Stop recording
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      return;
    }
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
      setError(err.message);
    }
  }, [isListening]);
  
  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening
  };
};