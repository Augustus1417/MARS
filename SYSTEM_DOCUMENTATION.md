# MARS Analytics System Documentation

## 🤖 Multi-modal Aspect-based Review System (MARS)

MARS is a real-time sentiment analysis dashboard designed for analyzing food reviews with aspect-specific sentiment detection. The system provides live analytics on customer feedback for multiple food items using modern web technologies and machine learning.

## 🏗️ System Architecture

### High-Level Overview
```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│                 │◄──────────────►│                 │
│   React Client  │                │ FastAPI Server  │
│   (Frontend)    │                │   (Backend)     │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
        │                                    │
        ▼                                    ▼
┌─────────────────┐                ┌─────────────────┐
│  TensorFlow.js  │                │ VADER Sentiment │
│ (Audio Models)  │                │    Analysis     │
└─────────────────┘                └─────────────────┘
```

### Technology Stack

**Frontend:**
- **React.js** - Component-based UI framework
- **Vite** - Fast development server and build tool
- **TensorFlow.js** - Client-side machine learning
- **CSS Grid** - Responsive layout system
- **WebSocket API** - Real-time communication

**Backend:**
- **FastAPI** - Modern Python web framework
- **WebSockets** - Bi-directional real-time communication
- **VADER** - Sentiment analysis library
- **Uvicorn** - ASGI server
- **Python 3.13** - Runtime environment

## 🔧 Core Components

### 1. Frontend Components

#### MARSDashboard.jsx
**Purpose:** Main dashboard component orchestrating the entire user interface

**Key Features:**
- Real-time sentiment analysis display
- Aggregated food item statistics
- Speech recognition interface
- WebSocket communication management
- Responsive sidebar layout

**State Management:**
```javascript
const [foodItemStats, setFoodItemStats] = useState({
  Chicken: { total: 0, positive: 0, negative: 0, neutral: 0 },
  Burger: { total: 0, positive: 0, negative: 0, neutral: 0 },
  Spaghetti: { total: 0, positive: 0, negative: 0, neutral: 0 },
  Fries: { total: 0, positive: 0, negative: 0, neutral: 0 },
  Hotdog: { total: 0, positive: 0, negative: 0, neutral: 0 }
});
```

#### Custom Hooks

**useWebSocket.js**
- Manages WebSocket connections to the backend
- Handles aspect data transmission with field validation
- Provides connection status and message handling

**useSpeechRecognition.js**
- Browser-based speech-to-text functionality
- Real-time transcription for voice input
- Cross-browser compatibility handling

**useTeachableMachine.js**
- TensorFlow.js model loading and inference
- Audio classification capabilities
- Model state management

### 2. Backend Components

#### main.py (FastAPI Server)
**Core Functionality:**
- WebSocket endpoint for real-time communication
- VADER sentiment analysis integration
- Aspect validation and processing
- CORS configuration for cross-origin requests

**Key Endpoints:**
```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Real-time sentiment analysis processing
    
@app.get("/")
async def root():
    # Health check endpoint
```

#### Sentiment Analysis Pipeline
```python
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_sentiment(text):
    analyzer = SentimentIntensityAnalyzer()
    scores = analyzer.polarity_scores(text)
    return {
        'compound': scores['compound'],
        'positive': scores['pos'],
        'negative': scores['neg'],
        'neutral': scores['neu']
    }
```

### 3. Utility Components

#### aspectDetection.js
**Purpose:** Extract aspect-specific sentiment phrases from complex sentences

**Key Algorithm:**
1. **Aspect Identification:** Locate food items in text using keyword matching
2. **Phrase Extraction:** Extract relevant context around each aspect
3. **Conjunction Handling:** Parse compound sentences to isolate individual sentiments
4. **Context Preservation:** Maintain semantic meaning while segmenting text

**Example Processing:**
```
Input: "The burger was amazing but the chicken was terrible"
Output: [
  { aspect: "Burger", phrase: "burger was amazing" },
  { aspect: "Chicken", phrase: "chicken was terrible" }
]
```

## 🔄 Data Flow

### 1. User Input Processing
```
User Speech/Text → Speech Recognition → Aspect Detection → WebSocket Transmission
```

### 2. Backend Analysis
```
Received Text → Aspect Validation → VADER Analysis → Sentiment Classification → Response
```

### 3. Frontend Update
```
WebSocket Response → State Update → UI Re-render → Statistics Aggregation
```

### 4. Real-time Analytics
```
Individual Sentiments → Aggregated Statistics → Visual Dashboard → Live Updates
```

## 🎨 User Interface Design

### Design Philosophy
- **Modern Tech Aesthetic:** Blue-gray color palette with clean typography
- **Responsive Layout:** CSS Grid-based design for all screen sizes
- **Real-time Feedback:** Live updates without page refreshes
- **Accessibility:** High contrast ratios and semantic HTML

### Color Scheme
```css
Primary Blue: #3b82f6
Secondary Purple: #6366f1
Background: #f8fafc
Text: #1f2937
Success: #10b981
Warning: #f59e0b
Error: #ef4444
```

### Layout Structure
```
┌─────────────────────────────────────────┐
│              Header Bar                  │
├───────────┬─────────────────────────────┤
│           │                             │
│  Sidebar  │      Main Analytics         │
│ Controls  │        Dashboard            │
│           │                             │
│           │  ┌─────────┬─────────┐      │
│           │  │ Stats   │ Stats   │      │
│           │  │ Card    │ Card    │      │
│           │  └─────────┴─────────┘      │
└───────────┴─────────────────────────────┘
```

## 🚀 Setup and Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.11 or higher)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Frontend Setup
```bash
cd client/
npm install
npm run dev
```
Server runs on: http://localhost:5175

### Backend Setup
```bash
cd server/
pip install -r requirements.txt
python main.py
```
Server runs on: http://localhost:8000

### Dependencies

**Frontend (package.json):**
```json
{
  "@tensorflow/tfjs": "^4.15.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

**Backend (requirements.txt):**
```
fastapi==0.104.1
uvicorn==0.24.0
websockets==12.0
vaderSentiment==3.3.2
```

## 💡 Key Features

### 1. Real-time Sentiment Analysis
- **Live Processing:** Instant sentiment analysis of user input
- **Aspect-specific Results:** Individual sentiment scores for each food item
- **Aggregated Statistics:** Running totals and percentages for each category

### 2. Multi-modal Input
- **Speech Recognition:** Voice-to-text conversion using browser APIs
- **Text Input:** Direct text entry for review analysis
- **Audio Classification:** TensorFlow.js model integration (placeholder)

### 3. Intelligent Aspect Detection
- **Compound Sentence Parsing:** Handles complex sentences with multiple food items
- **Context Preservation:** Maintains semantic meaning when extracting aspects
- **Conjunction Recognition:** Properly separates contrasting sentiments

### 4. Analytics Dashboard
- **Live Statistics:** Real-time updates of sentiment distributions
- **Visual Indicators:** Color-coded sentiment categories
- **Responsive Design:** Optimized for desktop and mobile devices

## 🔍 Technical Implementation Details

### WebSocket Communication Protocol
```javascript
// Client sends:
{
  "detected_aspect": "Chicken",
  "clipped_sentence": "The chicken was delicious"
}

// Server responds:
{
  "aspect": "Chicken",
  "text": "The chicken was delicious",
  "sentiment": "positive",
  "scores": {
    "compound": 0.6249,
    "positive": 0.746,
    "negative": 0.0,
    "neutral": 0.254
  }
}
```

### Sentiment Classification Logic
```python
def classify_sentiment(compound_score):
    if compound_score >= 0.05:
        return "positive"
    elif compound_score <= -0.05:
        return "negative"
    else:
        return "neutral"
```

### Error Handling
- **Connection Recovery:** Automatic WebSocket reconnection on failure
- **Input Validation:** Server-side validation of required fields
- **Graceful Degradation:** Fallback options when features are unavailable

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=8000
HOST=0.0.0.0
DEBUG=true

# Client Configuration
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000
```

### Browser Compatibility
- **Speech Recognition:** Chrome, Edge (WebKit-based browsers)
- **WebSockets:** All modern browsers
- **TensorFlow.js:** All browsers with WebGL support

## 📊 Performance Considerations

### Optimization Strategies
- **Component Memoization:** React.memo for expensive components
- **State Batching:** Efficient state updates for real-time data
- **WebSocket Pooling:** Connection reuse for multiple requests
- **CSS Grid:** Hardware-accelerated layout rendering

### Scalability Features
- **Stateless Backend:** Each WebSocket connection is independent
- **Client-side Processing:** TensorFlow.js reduces server load
- **Efficient Updates:** Only changed statistics trigger re-renders

## 🛡️ Security Considerations

### Data Protection
- **Input Sanitization:** Server-side validation of all inputs
- **CORS Configuration:** Controlled cross-origin access
- **WebSocket Authentication:** Connection validation (extensible)

### Privacy Features
- **Local Processing:** Speech recognition happens in browser
- **No Data Persistence:** Sentiment data is not stored permanently
- **Minimal Data Transfer:** Only necessary data sent over network

## 🚀 Future Enhancements

### Planned Features
1. **Advanced ML Models:** Custom-trained aspect detection models
2. **Data Persistence:** Database integration for historical analysis
3. **Authentication:** User accounts and personalized dashboards
4. **Export Functionality:** Report generation and data export
5. **Multi-language Support:** International sentiment analysis

### Technical Improvements
- **Offline Capability:** Service worker for offline analysis
- **Performance Monitoring:** Real-time performance metrics
- **Automated Testing:** Comprehensive test suite
- **CI/CD Pipeline:** Automated deployment and testing

## 📝 Troubleshooting

### Common Issues

**WebSocket Connection Errors:**
- Verify backend server is running on port 8000
- Check firewall settings for WebSocket connections
- Ensure CORS configuration matches client origin

**Speech Recognition Not Working:**
- Use Chrome or Edge browser
- Grant microphone permissions
- Check browser settings for media access

**Sentiment Analysis Inaccurate:**
- Review aspect detection logic in aspectDetection.js
- Verify VADER sentiment model is properly installed
- Check for proper phrase extraction in compound sentences

## 📋 API Reference

### WebSocket Events

**Client → Server:**
```typescript
interface AspectAnalysis {
  detected_aspect: string;
  clipped_sentence: string;
}
```

**Server → Client:**
```typescript
interface SentimentResult {
  aspect: string;
  text: string;
  sentiment: "positive" | "negative" | "neutral";
  scores: {
    compound: number;
    positive: number;
    negative: number;
    neutral: number;
  };
}
```

### REST Endpoints

**GET /**
- **Description:** Health check endpoint
- **Response:** `{"message": "Welcome to MARS Sentiment Analysis API"}`
- **Status:** 200 OK

## 📚 Additional Resources

### External Dependencies Documentation
- [React.js Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [VADER Sentiment Analysis](https://github.com/cjhutto/vaderSentiment)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)

### Development Tools
- [Vite Build Tool](https://vitejs.dev/)
- [Uvicorn ASGI Server](https://www.uvicorn.org/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

*MARS Analytics System - Real-time Multi-modal Aspect-based Review Sentiment Analysis*

**Version:** 1.0.0  
**Last Updated:** March 1, 2026  
**Maintained By:** MARS Development Team