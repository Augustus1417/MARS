# MARS Backend Server

This is the FastAPI backend server for the Multi-modal Aspect-based Review System (MARS).

## Features

- **WebSocket Endpoint**: Real-time communication with React frontend
- **VADER Sentiment Analysis**: Aspect-based sentiment classification
- **CORS Support**: Configured for cross-origin requests
- **Production Ready**: Modular, well-documented code structure

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Development mode with auto-reload:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at:
- **WebSocket**: `ws://localhost:8000/ws`
- **Health Check**: `http://localhost:8000/health`
- **API Docs**: `http://localhost:8000/docs`

## API Endpoints

### WebSocket: `/ws`

Real-time sentiment analysis for detected aspects.

**Input Format:**
```json
{
    "detected_aspect": "Chicken",
    "clipped_sentence": "The chicken was really delicious!",
    "timestamp": "2026-03-01T10:30:00.000Z"
}
```

**Response Format:**
```json
{
    "aspect": "Chicken",
    "compound_score": 0.6588,
    "sentiment_label": "positive",
    "sentiment_details": {
        "positive": 0.742,
        "negative": 0.0,
        "neutral": 0.258
    },
    "original_sentence": "The chicken was really delicious!",
    "timestamp": "2026-03-01T10:30:00.000Z",
    "analysis_timestamp": "2026-03-01T10:30:01.123Z"
}
```

### Health Check: `/health`

Returns server status and timestamp.

## Sentiment Classification

Uses VADER sentiment analysis with the following thresholds:
- **Positive**: compound score ≥ 0.05
- **Negative**: compound score ≤ -0.05
- **Neutral**: -0.05 < compound score < 0.05

## Architecture

- `main.py`: Main FastAPI application with WebSocket handling
- `SentimentAnalyzer`: VADER sentiment analysis wrapper
- `ConnectionManager`: WebSocket connection management
- Comprehensive error handling and logging