import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

/**
 * Custom hook for Teachable Machine audio model integration
 * Provides keyword confidence detection for the 6 classes
 */
export const useTeachableMachine = () => {
  const [model, setModel] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);
  
  const recognizerRef = useRef(null);
  const onPredictionRef = useRef(null);
  
  // Model URL and class names according to requirements
  const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/oqK-N66SL/';
  const CLASS_NAMES = ['Background noise', 'Chicken', 'Burger', 'Fries', 'Hotdog', 'Spaghetti'];
  
  // Load the Teachable Machine model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading Teachable Machine model...');
        setError(null);
        
        // Load model and metadata
        const modelURL = MODEL_URL + 'model.json';
        const metadataURL = MODEL_URL + 'metadata.json';
        
        // Load the TensorFlow.js model
        const loadedModel = await tf.loadLayersModel(modelURL);
        
        // Load metadata to understand the model structure
        const metadataResponse = await fetch(metadataURL);
        const metadata = await metadataResponse.json();
        
        setModel({ model: loadedModel, metadata });
        setIsModelLoaded(true);
        
        console.log('Teachable Machine model loaded successfully');
        
      } catch (err) {
        console.error('Error loading Teachable Machine model:', err);
        setError(`Failed to load model: ${err.message}`);
      }
    };

    loadModel();
    
    return () => {
      // Stop any ongoing audio processing
      if (recognizerRef.current) {
        recognizerRef.current = null;
      }
    };
  }, []);
  
  // Start audio classification
  const startListening = async (onPrediction) => {
    if (!model || !isModelLoaded) {
      setError('Model not loaded yet');
      return;
    }
    
    if (isListening) {
      console.log('Already listening for audio');
      return;
    }
    
    onPredictionRef.current = onPrediction;
    setError(null);
    
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      // Store for cleanup
      recognizerRef.current = { stream, audioContext, analyser };
      
      setIsListening(true);
      console.log('Started audio classification');
      
      // Simple placeholder prediction loop (this is a simplified version)
      // In a real implementation, you would need to process the audio data
      // and convert it to the format expected by your Teachable Machine model
      const processAudio = () => {
        if (!isListening) return;
        
        // Create mock predictions for now
        // In a real implementation, you would process audio data here
        const mockPredictions = CLASS_NAMES.map(className => ({
          className,
          probability: Math.random() * 0.1 // Low random values as placeholder
        }));
        
        setPredictions(mockPredictions);
        
        if (onPredictionRef.current) {
          onPredictionRef.current(mockPredictions);
        }
        
        setTimeout(processAudio, 1000); // Check every second
      };
      
      processAudio();
      
    } catch (err) {
      console.error('Error starting audio classification:', err);
      setError(err.message);
    }
  };
  
  // Stop audio classification
  const stopListening = () => {
    if (!recognizerRef.current || !isListening) {
      return;
    }
    
    try {
      const { stream, audioContext } = recognizerRef.current;
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Close audio context
      audioContext.close();
      
      recognizerRef.current = null;
      setIsListening(false);
      
      console.log('Stopped audio classification');
    } catch (err) {
      console.error('Error stopping audio classification:', err);
      setError(err.message);
    }
  };
  
  // Get the highest confidence prediction (excluding background noise)
  const getTopPrediction = () => {
    if (!predictions.length) return null;
    
    // Filter out background noise and get highest confidence
    const foodPredictions = predictions.filter(p => p.className !== 'Background noise');
    if (!foodPredictions.length) return null;
    
    return foodPredictions.reduce((max, curr) => 
      curr.probability > max.probability ? curr : max
    );
  };
  
  return {
    isModelLoaded,
    isListening,
    predictions,
    error,
    startListening,
    stopListening,
    getTopPrediction,
    classNames: CLASS_NAMES
  };
};