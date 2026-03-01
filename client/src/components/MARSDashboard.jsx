import React, { useState, useCallback, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTeachableMachine } from '../hooks/useTeachableMachine';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  detectAspects, 
  processAspectsForAnalysis, 
  FIXED_ASPECTS,
  getAspectColor,
  formatAspectName 
} from '../utils/aspectDetection';
import './MARSDashboard.css';

/**
 * Main MARS Dashboard Component
 * Integrates speech recognition, Teachable Machine model, and sentiment analysis
 */
export const MARSDashboard = () => {
  // Component state
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [detectedAspects, setDetectedAspects] = useState([]);
  const [realtimeAudio, setRealtimeAudio] = useState([]);
  const [systemStatus, setSystemStatus] = useState('idle'); // idle, recording, processing
  const [foodItemStats, setFoodItemStats] = useState({
    'Chicken': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
    'Burger': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
    'Spaghetti': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
    'Fries': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
    'Hotdog': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 }
  });
  
  // Custom hooks
  const speechRecognition = useSpeechRecognition();
  const teachableMachine = useTeachableMachine();
  const webSocket = useWebSocket();

  // Update food item statistics
  const updateFoodItemStats = useCallback((result) => {
    if (!result || !result.aspect || !result.sentiment_label || typeof result.compound_score !== 'number') {
      return;
    }

    const aspect = result.aspect;
    const sentiment = result.sentiment_label;
    const score = result.compound_score;

    setFoodItemStats(prev => {
      const currentStats = prev[aspect] || { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 };
      
      const newStats = {
        ...currentStats,
        total: currentStats.total + 1,
        [sentiment]: currentStats[sentiment] + 1,
        averageScore: ((currentStats.averageScore * currentStats.total) + score) / (currentStats.total + 1)
      };

      return {
        ...prev,
        [aspect]: newStats
      };
    });
  }, []);
  
  // Handle speech transcript received
  const handleTranscriptReceived = useCallback((transcript) => {
    console.log('Received transcript:', transcript);
    setCurrentTranscript(transcript);
    setSystemStatus('processing');
    
    // Detect aspects in the transcript
    const aspects = detectAspects(transcript);
    console.log('Detected aspects:', aspects);
    
    if (aspects.length > 0) {
      // Process each detected aspect
      const aspectsForAnalysis = processAspectsForAnalysis(transcript);
      console.log('Aspects for analysis:', aspectsForAnalysis);
      
      // Send each aspect to backend for sentiment analysis
      aspectsForAnalysis.forEach(aspectData => {
        console.log('Sending aspect data:', aspectData);
        webSocket.sendAspectForAnalysis(aspectData, (result) => {
          console.log('Received sentiment analysis:', result);
          setDetectedAspects(prev => [result, ...prev].slice(0, 20)); // Keep last 20
          
          // Update food item statistics
          updateFoodItemStats(result);
        });
      });
    } else {
      console.log('No aspects detected in transcript:', transcript);
    }
    
    setTimeout(() => setSystemStatus('idle'), 2000);
  }, [webSocket]);
  
  // Handle Teachable Machine predictions
  const handleAudioPrediction = useCallback((predictions) => {
    setRealtimeAudio(predictions);
  }, []);
  
  // Start review session
  const startReview = useCallback(() => {
    if (!speechRecognition.isSupported) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }
    
    if (!teachableMachine.isModelLoaded) {
      alert('Audio model is still loading. Please wait...');
      return;
    }
    
    if (!webSocket.isConnected) {
      alert('Backend connection is not available. Please check if the server is running.');
      return;
    }
    
    setCurrentTranscript('');
    setSystemStatus('recording');
    
    // Start speech recognition
    speechRecognition.startListening(handleTranscriptReceived);
    
    // Start audio classification
    teachableMachine.startListening(handleAudioPrediction);
  }, [speechRecognition, teachableMachine, webSocket, handleTranscriptReceived, handleAudioPrediction]);
  
  // Stop review session
  const stopReview = useCallback(() => {
    setSystemStatus('idle');
    
    // Stop speech recognition
    speechRecognition.stopListening();
    
    // Stop audio classification
    teachableMachine.stopListening();
  }, [speechRecognition, teachableMachine]);
  
  // Clear all results
  const clearResults = useCallback(() => {
    setDetectedAspects([]);
    setCurrentTranscript('');
    setRealtimeAudio([]);
    setFoodItemStats({
      'Chicken': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
      'Burger': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
      'Spaghetti': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
      'Fries': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 },
      'Hotdog': { total: 0, positive: 0, negative: 0, neutral: 0, averageScore: 0 }
    });
    webSocket.clearResults();
  }, [webSocket]);

  // Test WebSocket connection with a sample sentence
  const testWebSocketConnection = useCallback(() => {
    const testTranscript = "The chicken was absolutely delicious and well seasoned.";
    console.log('Testing with sample transcript:', testTranscript);
    
    // Process the test transcript
    const aspects = detectAspects(testTranscript);
    console.log('Test detected aspects:', aspects);
    
    if (aspects.length > 0) {
      const aspectsForAnalysis = processAspectsForAnalysis(testTranscript);
      console.log('Test aspects for analysis:', aspectsForAnalysis);
      
      aspectsForAnalysis.forEach(aspectData => {
        console.log('Test sending aspect data:', aspectData);
        webSocket.sendAspectForAnalysis(aspectData, (result) => {
          console.log('Test received sentiment analysis:', result);
          setDetectedAspects(prev => [result, ...prev].slice(0, 20));
          updateFoodItemStats(result);
        });
      });
    } else {
      console.log('No aspects detected in test transcript');
    }
  }, [webSocket]);
  
  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#27AE60';
      case 'negative': return '#E74C3C';
      case 'neutral': return '#F39C12';
      default: return '#95A5A6';
    }
  };
  
  // Get system status color
  const getStatusColor = () => {
    switch (systemStatus) {
      case 'recording': return '#E67E22';
      case 'processing': return '#3498DB';
      case 'idle': return '#95A5A6';
      default: return '#95A5A6';
    }
  };
  
  return (
    <div className="mars-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <h1>🤖 MARS Analytics</h1>
            <p>Multi-modal Aspect-based Review System</p>
          </div>
          
          {/* Quick Status */}
          <div className="quick-status">
            <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}>
              {systemStatus.toUpperCase()}
            </div>
            <div className="connection-indicators">
              <span className={`mini-indicator ${speechRecognition.isSupported ? 'connected' : 'disconnected'}`}>🎤</span>
              <span className={`mini-indicator ${teachableMachine.isModelLoaded ? 'connected' : 'disconnected'}`}>🧠</span>
              <span className={`mini-indicator ${webSocket.isConnected ? 'connected' : 'disconnected'}`}>🔗</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Left Sidebar - Controls */}
        <aside className="sidebar">
          <div className="control-section">
            <h3>� Controls</h3>
            <div className="primary-controls">
              <button 
                className={`primary-btn ${speechRecognition.isListening ? 'recording' : 'start'}`}
                onClick={speechRecognition.isListening ? stopReview : startReview}
                disabled={systemStatus === 'processing'}
              >
                {speechRecognition.isListening ? '⏹️ Stop Recording' : '🎤 Start Recording'}
              </button>
            </div>
            
            <div className="secondary-controls">
              <button className="secondary-btn" onClick={clearResults}>
                🗑️ Clear All
              </button>
              <button 
                className="secondary-btn" 
                onClick={testWebSocketConnection}
                disabled={!webSocket.isConnected}
              >
                🧪 Test
              </button>
            </div>
          </div>
          
          {/* Current Transcript */}
          <div className="transcript-section">
            <h3>📝 Transcript</h3>
            <div className="transcript-display">
              {currentTranscript || 'Press "Start Recording" to begin...'}
            </div>
          </div>
          
          {/* Target Items */}
          <div className="targets-section">
            <h3>� Targets</h3>
            <div className="target-items">
              {FIXED_ASPECTS.map(aspect => {
                const foodEmojis = {
                  'Chicken': '🍗',
                  'Burger': '🍔',
                  'Spaghetti': '🍝',
                  'Fries': '🍟',
                  'Hotdog': '🌭'
                };
                
                return (
                  <div key={aspect} className="target-item">
                    <span className="target-emoji">{foodEmojis[aspect]}</span>
                    <span className="target-name">{aspect}</span>
                    <span className="target-count">{foodItemStats[aspect].total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        
        {/* Main Content Area */}
        <main className="main-content">
          {/* Analytics Dashboard - Primary Focus */}
          <section className="analytics-dashboard">
            <h2>📊 Sentiment Analytics</h2>
            <div className="food-metrics-grid">
              {FIXED_ASPECTS.map(aspect => {
                const stats = foodItemStats[aspect];
                const overallSentiment = stats.total > 0 ? 
                  (stats.averageScore >= 0.05 ? 'positive' : 
                   stats.averageScore <= -0.05 ? 'negative' : 'neutral') : 'neutral';
                
                const foodEmojis = {
                  'Chicken': '🍗',
                  'Burger': '🍔',
                  'Spaghetti': '🍝',
                  'Fries': '🍟',
                  'Hotdog': '🌭'
                };
                
                return (
                  <div key={aspect} className="metric-card">
                    <div className="metric-header">
                      <span className="food-emoji">{foodEmojis[aspect]}</span>
                      <h3>{aspect}</h3>
                    </div>
                    <div className={`sentiment-score ${overallSentiment}`}>
                      {stats.total > 0 ? stats.averageScore.toFixed(2) : '0.00'}
                    </div>
                    <div className="metric-stats">
                      <div className="stat-row">
                        <span className="stat-icon">📝</span>
                        <span className="stat-value">{stats.total}</span>
                      </div>
                      <div className="sentiment-breakdown">
                        <div className="sentiment-item positive">
                          <span>😊</span>
                          <span>{stats.positive}</span>
                        </div>
                        <div className="sentiment-item neutral">
                          <span>😐</span>
                          <span>{stats.neutral}</span>
                        </div>
                        <div className="sentiment-item negative">
                          <span>😞</span>
                          <span>{stats.negative}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
          {/* Recent Activity */}
          <section className="activity-section">
            <h2>⚡ Recent Reviews</h2>
            <div className="activity-feed">
              {detectedAspects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎤</div>
                  <p>Start recording to see live sentiment analysis</p>
                </div>
              ) : (
                <div className="activity-list">
                  {detectedAspects.slice(0, 6).map((result, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-aspect" style={{ color: getAspectColor(result.aspect) }}>
                            {result.aspect}
                          </span>
                          <span className={`activity-sentiment ${result.sentiment_label}`}>
                            {result.sentiment_label === 'positive' ? '👍' : 
                             result.sentiment_label === 'negative' ? '👎' : '👌'}
                          </span>
                          <span className="activity-score">
                            {result.compound_score.toFixed(2)}
                          </span>
                        </div>
                        <p className="activity-text">\"{result.original_sentence}\"</p>
                        <span className="activity-time">
                          {new Date(result.analysis_timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
      
      {/* Error Display */}
      {(speechRecognition.error || teachableMachine.error || webSocket.error) && (
        <div className="error-panel">
          <div className="error-content">
            <h4>⚠️ System Errors</h4>
            <div className="error-list">
              {speechRecognition.error && <div className="error-item"><strong>Speech:</strong> {speechRecognition.error}</div>}
              {teachableMachine.error && <div className="error-item"><strong>TM Model:</strong> {teachableMachine.error}</div>}
              {webSocket.error && <div className="error-item"><strong>WebSocket:</strong> {webSocket.error}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};