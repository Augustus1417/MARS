import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WebSocket communication with MARS backend
 * Handles real-time sentiment analysis communication using native WebSockets
 */
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [sentimentResults, setSentimentResults] = useState([]);
  
  const socketRef = useRef(null);
  const onResultRef = useRef(null);
  
  // WebSocket server URL
  const WS_URL = 'ws://localhost:8000/ws';
  
  useEffect(() => {
    // Create WebSocket connection
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;
        
        ws.onopen = () => {
          console.log('WebSocket connected to MARS backend');
          setIsConnected(true);
          setError(null);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received sentiment analysis result:', data);
            
            if (data.error) {
              setError(data.error);
              return;
            }
            
            // Add to results array
            setSentimentResults(prev => [data, ...prev].slice(0, 50)); // Keep last 50 results
            
            // Call callback if provided
            if (onResultRef.current) {
              onResultRef.current(data);
            }
            
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
            setError('Invalid response format');
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected from MARS backend');
          setIsConnected(false);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error');
          setIsConnected(false);
        };
        
      } catch (err) {
        console.error('Error creating WebSocket connection:', err);
        setError(err.message);
      }
    };
    
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  // Send aspect data for sentiment analysis
  const sendAspectForAnalysis = useCallback((aspectData, onResult) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }
    
    onResultRef.current = onResult;
    
    try {
      // Validate required fields before sending
      const detectedAspect = aspectData.detected_aspect || aspectData.aspect;
      const clippedSentence = aspectData.clipped_sentence || aspectData.clippedSentence || aspectData.sentence;
      
      if (!aspectData || !detectedAspect || !clippedSentence) {
        console.error('Invalid aspect data:', aspectData);
        setError('Invalid aspect data: missing detected_aspect or clipped_sentence');
        return;
      }
      
      const message = {
        detected_aspect: detectedAspect,
        clipped_sentence: clippedSentence,
        timestamp: aspectData.timestamp || new Date().toISOString()
      };
      
      console.log('Sending aspect for analysis:', message);
      
      // Final validation that all required fields are present
      if (!message.detected_aspect || !message.clipped_sentence || !message.timestamp) {
        console.error('Missing required fields in message:', message);
        setError('Missing required fields: detected_aspect, clipped_sentence, or timestamp');
        return;
      }
      
      socketRef.current.send(JSON.stringify(message));
      
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
      setError(err.message);
    }
  }, []);
  
  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    setTimeout(() => {
      window.location.reload(); // Simple reconnect for now
    }, 1000);
  }, []);
  
  // Clear results
  const clearResults = useCallback(() => {
    setSentimentResults([]);
  }, []);
  
  return {
    isConnected,
    error,
    sentimentResults,
    sendAspectForAnalysis,
    reconnect,
    clearResults
  };
};