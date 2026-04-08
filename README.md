# MARS - Multi-modal Aspect-based Review System

A real-time web application for performing aspect-based sentiment analysis on spoken restaurant reviews using cutting-edge web technologies.

![MARS-preview](MARS_PREVIEW.png)

## Target Food Aspects

The system detects exactly these 5 menu items:
- **Chicken**
- **Burger** 
- **Spaghetti**
- **Fries**
- **Hotdog**

## Teachable Machine Integration

**Model URL**: https://teachablemachine.withgoogle.com/models/oqK-N66SL/

**Classes**: Background noise, Chicken, Burger, Fries, Hotdog, Spaghetti

The model provides real-time audio classification confidence for each food item, enhancing the speech-to-text keyword detection.

## Aentiment Classification

Uses VADER sentiment analysis with these thresholds:
- **Positive**: compound score ≥ 0.05
- **Negative**: compound score ≤ -0.05  
- **Neutral**: -0.05 < compound score < 0.05

## Quick Start

### Prerequisites
- **Node.js** (v16+)
- **Python** (v3.8+)
- **Google Chrome** (for Web Speech API support)

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

The backend will be available at:
- **WebSocket**: `ws://localhost:8000/ws`
- **API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 2. Frontend Setup

```bash
# Navigate to client directory  
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## License

Academic use only - Built for educational and research purposes.

---
