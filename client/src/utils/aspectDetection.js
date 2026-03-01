/**
 * Aspect detection utilities for MARS
 * Handles detection of the 5 specific food item keywords
 */

// The 5 fixed aspects that must be detected
export const FIXED_ASPECTS = ['Chicken', 'Burger', 'Spaghetti', 'Fries', 'Hotdog'];

// Create case-insensitive regex patterns for each aspect
const createAspectPatterns = () => {
  const patterns = {};
  FIXED_ASPECTS.forEach(aspect => {
    // Create word boundary regex for exact matches
    patterns[aspect.toLowerCase()] = new RegExp(`\\b${aspect}\\b`, 'gi');
  });
  return patterns;
};

const ASPECT_PATTERNS = createAspectPatterns();

/**
 * Extract aspect-specific sentiment phrase from text
 * @param {string} text - The full text to search
 * @param {string} keyword - The keyword/aspect to find
 * @returns {string|null} - The aspect-specific phrase, or null if not found
 */
export const extractSentenceWithKeyword = (text, keyword) => {
  if (!text || !keyword) return null;
  
  // Create case-insensitive regex for the keyword
  const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
  
  if (!keywordRegex.test(text)) {
    return null;
  }
  
  // First try to extract a specific clause around the keyword
  const aspectSpecificPhrase = extractAspectSpecificPhrase(text, keyword);
  if (aspectSpecificPhrase) {
    return aspectSpecificPhrase;
  }
  
  // Fallback: Split text into sentences and find the one containing the keyword
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const matchingSentence = sentences.find(sentence => keywordRegex.test(sentence));
  
  return matchingSentence || null;
};

/**
 * Extract aspect-specific phrase that contains sentiment about the aspect
 * @param {string} text - The full text
 * @param {string} aspect - The aspect/keyword
 * @returns {string|null} - Aspect-specific phrase or null
 */
const extractAspectSpecificPhrase = (text, aspect) => {
  const aspectRegex = new RegExp(`\\b${aspect}\\b`, 'gi');
  const match = aspectRegex.exec(text);
  
  if (!match) return null;
  
  const aspectIndex = match.index;
  const words = text.split(/\s+/);
  let aspectWordIndex = -1;
  let currentIndex = 0;
  
  // Find the word index of the aspect
  for (let i = 0; i < words.length; i++) {
    if (currentIndex <= aspectIndex && currentIndex + words[i].length >= aspectIndex) {
      aspectWordIndex = i;
      break;
    }
    currentIndex += words[i].length + 1; // +1 for space
  }
  
  if (aspectWordIndex === -1) return null;
  
  // Look for conjunctions that might split sentiments
  const conjunctions = ['and', 'but', 'however', 'though', 'although', 'while'];
  
  // Find the start of the phrase
  let startIndex = 0;
  for (let i = aspectWordIndex - 1; i >= 0; i--) {
    const word = words[i].toLowerCase();
    if (conjunctions.includes(word) || word.includes(',')) {
      startIndex = i + 1;
      break;
    }
  }
  
  // Find the end of the phrase
  let endIndex = words.length - 1;
  for (let i = aspectWordIndex + 1; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (conjunctions.includes(word) || word.includes(',')) {
      endIndex = i - 1;
      break;
    }
  }
  
  // Extract the phrase
  const phrase = words.slice(startIndex, endIndex + 1).join(' ');
  
  // Make sure the phrase contains the aspect and some descriptive words
  if (phrase.split(/\s+/).length >= 3 && new RegExp(`\\b${aspect}\\b`, 'i').test(phrase)) {
    return phrase.trim();
  }
  
  return null;
};

/**
 * Detect aspects in a given transcript
 * @param {string} transcript - The speech transcript to analyze
 * @returns {Array} - Array of detected aspect objects
 */
export const detectAspects = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return [];
  }
  
  const detectedAspects = [];
  const processedAspects = new Set(); // Prevent duplicates
  
  // Check for each aspect in the transcript
  FIXED_ASPECTS.forEach(aspect => {
    const pattern = ASPECT_PATTERNS[aspect.toLowerCase()];
    const matches = transcript.match(pattern);
    
    if (matches && !processedAspects.has(aspect.toLowerCase())) {
      // Extract the sentence containing this keyword
      const clippedSentence = extractSentenceWithKeyword(transcript, aspect);
      
      if (clippedSentence) {
        detectedAspects.push({
          aspect: aspect,
          clippedSentence: clippedSentence,
          timestamp: new Date().toISOString(),
          originalTranscript: transcript
        });
        
        processedAspects.add(aspect.toLowerCase());
      }
    }
  });
  
  return detectedAspects;
};

/**
 * Check if transcript contains any of the target aspects
 * @param {string} transcript - The speech transcript to check
 * @returns {boolean} - True if any aspect is found
 */
export const hasAnyAspect = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return false;
  }
  
  return FIXED_ASPECTS.some(aspect => {
    const pattern = ASPECT_PATTERNS[aspect.toLowerCase()];
    return pattern.test(transcript);
  });
};

/**
 * Get all aspects mentioned in transcript with their sentences
 * @param {string} transcript - The speech transcript to analyze
 * @returns {Object} - Object mapping aspects to their sentences
 */
export const getAllAspectsWithSentences = (transcript) => {
  const aspectSentences = {};
  
  FIXED_ASPECTS.forEach(aspect => {
    const pattern = ASPECT_PATTERNS[aspect.toLowerCase()];
    if (pattern.test(transcript)) {
      const sentence = extractSentenceWithKeyword(transcript, aspect);
      if (sentence) {
        aspectSentences[aspect] = sentence;
      }
    }
  });
  
  return aspectSentences;
};

/**
 * Process multiple aspects in a single transcript
 * Each aspect in the same sentence will be treated as a separate event
 * @param {string} transcript - The speech transcript to process
 * @returns {Array} - Array of aspect events for backend processing
 */
export const processAspectsForAnalysis = (transcript) => {
  const detectedAspects = detectAspects(transcript);
  
  // Transform for backend communication
  return detectedAspects.map(detection => ({
    detected_aspect: detection.aspect,
    clipped_sentence: detection.clippedSentence,
    timestamp: detection.timestamp
  }));
};

/**
 * Validate aspect detection result
 * @param {Object} aspectResult - Result from aspect detection
 * @returns {boolean} - True if valid
 */
export const isValidAspectResult = (aspectResult) => {
  return (
    aspectResult &&
    typeof aspectResult.aspect === 'string' &&
    typeof aspectResult.clippedSentence === 'string' &&
    FIXED_ASPECTS.includes(aspectResult.aspect) &&
    aspectResult.clippedSentence.trim().length > 0
  );
};

/**
 * Format aspect for display
 * @param {string} aspect - The aspect name
 * @returns {string} - Formatted aspect name
 */
export const formatAspectName = (aspect) => {
  if (!aspect) return '';
  return aspect.charAt(0).toUpperCase() + aspect.slice(1).toLowerCase();
};

/**
 * Get aspect color for UI display
 * @param {string} aspect - The aspect name
 * @returns {string} - CSS color class or hex color
 */
export const getAspectColor = (aspect) => {
  const colorMap = {
    'Chicken': '#FF6B6B',
    'Burger': '#4ECDC4',
    'Spaghetti': '#45B7D1',
    'Fries': '#96CEB4',
    'Hotdog': '#FFEAA7'
  };
  
  return colorMap[aspect] || '#95A5A6';
};