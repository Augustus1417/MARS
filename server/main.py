from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MARS - Multi-modal Aspect-based Review System",
    description="Real-time sentiment analysis for restaurant reviews",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

class SentimentAnalyzer:
    """Handles sentiment analysis using VADER."""
    
    @staticmethod
    def analyze_sentiment(text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of given text using VADER.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict containing sentiment scores and classification
        """
        scores = analyzer.polarity_scores(text)
        compound_score = scores['compound']
        
        # Classify sentiment based on compound score
        if compound_score >= 0.05:
            sentiment_label = "positive"
        elif compound_score <= -0.05:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"
        
        return {
            "compound_score": compound_score,
            "positive": scores['pos'],
            "negative": scores['neg'],
            "neutral": scores['neu'],
            "sentiment_label": sentiment_label
        }

class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept a WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)

# Initialize connection manager
manager = ConnectionManager()

@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "MARS Backend Server",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "MARS Backend",
        "timestamp": datetime.now().isoformat()
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sentiment analysis.
    
    Expected input JSON:
    {
        "detected_aspect": "Chicken",
        "clipped_sentence": "The chicken was really delicious!",
        "timestamp": "2026-03-01T10:30:00.000Z"
    }
    
    Response JSON:
    {
        "aspect": "Chicken",
        "compound_score": 0.6588,
        "sentiment_label": "positive",
        "original_sentence": "The chicken was really delicious!",
        "timestamp": "2026-03-01T10:30:00.000Z",
        "analysis_timestamp": "2026-03-01T10:30:01.123Z"
    }
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                # Parse incoming JSON
                message = json.loads(data)
                logger.info(f"Received message: {message}")
                
                # Validate required fields
                required_fields = ["detected_aspect", "clipped_sentence", "timestamp"]
                if not all(field in message for field in required_fields):
                    error_response = {
                        "error": "Missing required fields",
                        "required_fields": required_fields,
                        "received_fields": list(message.keys())
                    }
                    await manager.send_personal_message(error_response, websocket)
                    continue
                
                # Extract data
                aspect = message["detected_aspect"]
                sentence = message["clipped_sentence"]
                timestamp = message["timestamp"]
                
                # Perform sentiment analysis
                sentiment_results = SentimentAnalyzer.analyze_sentiment(sentence)
                
                # Prepare response
                response = {
                    "aspect": aspect,
                    "compound_score": sentiment_results["compound_score"],
                    "sentiment_label": sentiment_results["sentiment_label"],
                    "sentiment_details": {
                        "positive": sentiment_results["positive"],
                        "negative": sentiment_results["negative"],
                        "neutral": sentiment_results["neutral"]
                    },
                    "original_sentence": sentence,
                    "timestamp": timestamp,
                    "analysis_timestamp": datetime.now().isoformat()
                }
                
                # Send response back to client
                await manager.send_personal_message(response, websocket)
                logger.info(f"Sent analysis result: {aspect} -> {sentiment_results['sentiment_label']}")
                
            except json.JSONDecodeError:
                error_response = {
                    "error": "Invalid JSON format",
                    "message": "Please send valid JSON data"
                }
                await manager.send_personal_message(error_response, websocket)
                
            except Exception as e:
                error_response = {
                    "error": "Internal server error",
                    "message": str(e)
                }
                await manager.send_personal_message(error_response, websocket)
                logger.error(f"Error processing message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )