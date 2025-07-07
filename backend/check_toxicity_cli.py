#!/usr/bin/env python
"""
Simple toxicity checker that can be called directly from command line
Usage: python check_toxicity_cli.py "text to check"
"""
import sys
import json
import joblib
import re
from pathlib import Path

def preprocess_text(text):
    """Preprocess text for model prediction"""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def check_toxicity(text):
    """Check if text is toxic"""
    try:
        # Load model and vectorizer
        model_path = Path(__file__).parent.parent / 'models' / 'toxic_model.pkl'
        vectorizer_path = Path(__file__).parent.parent / 'models' / 'tfidf_vectorizer.pkl'
        
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        
        # Preprocess and predict
        processed_text = preprocess_text(text)
        text_vectorized = vectorizer.transform([processed_text])
        prediction = model.predict(text_vectorized)[0]
        probability = model.predict_proba(text_vectorized)[0]
        
        confidence = float(max(probability))
        is_toxic = bool(prediction == 1)
        
        return {
            'success': True,
            'is_toxic': is_toxic,
            'confidence': confidence
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No text provided'}))
        sys.exit(1)
    
    text = sys.argv[1]
    result = check_toxicity(text)
    print(json.dumps(result))
