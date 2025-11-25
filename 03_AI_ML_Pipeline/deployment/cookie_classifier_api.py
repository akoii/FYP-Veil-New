"""
Cookie Classification API Service
This service uses a Hugging Face model to classify cookies into categories
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from huggingface_hub import InferenceClient
import re
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# Initialize Hugging Face Inference Client
# You can use a pre-trained text classification model or your own fine-tuned model
HF_TOKEN = os.getenv('HF_TOKEN', '')  # Set via environment variable
MODEL_NAME = os.getenv('MODEL_NAME', 'distilbert-base-uncased-finetuned-sst-2-english')

# Initialize client
client = InferenceClient(token=HF_TOKEN)

# Cookie categories mapping
COOKIE_CATEGORIES = {
    'necessary': {
        'keywords': ['session', 'csrf', 'auth', 'login', 'security', 'consent'],
        'description': 'Essential for website functionality'
    },
    'analytics': {
        'keywords': ['analytics', 'ga', '_gid', '_gat', 'utm', 'tracking', 'stats'],
        'description': 'Used for analyzing user behavior'
    },
    'advertising': {
        'keywords': ['ads', 'doubleclick', 'facebook', 'fb', 'advert', 'marketing', 'pixel'],
        'description': 'Used for targeted advertising'
    },
    'functional': {
        'keywords': ['pref', 'lang', 'currency', 'theme', 'settings'],
        'description': 'Enhances user experience'
    },
    'social_media': {
        'keywords': ['twitter', 'linkedin', 'instagram', 'social', 'share'],
        'description': 'Social media integration'
    },
    'performance': {
        'keywords': ['performance', 'speed', 'load', 'cache'],
        'description': 'Website performance optimization'
    }
}


def extract_cookie_features(cookie: Dict[str, Any]) -> str:
    """
    Extract relevant features from cookie for classification
    
    Args:
        cookie: Cookie object with name, domain, path, etc.
        
    Returns:
        Feature string for model input
    """
    name = cookie.get('name', '').lower()
    domain = cookie.get('domain', '').lower()
    path = cookie.get('path', '').lower()
    
    # Combine features into a text description
    feature_text = f"Cookie name: {name}. Domain: {domain}. Path: {path}."
    
    # Add security attributes
    if cookie.get('httpOnly'):
        feature_text += " HTTPOnly enabled."
    if cookie.get('secure'):
        feature_text += " Secure flag set."
    if cookie.get('sameSite'):
        feature_text += f" SameSite: {cookie.get('sameSite')}."
    
    return feature_text


def rule_based_classification(cookie: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule-based classification as fallback or supplement to ML
    
    Args:
        cookie: Cookie object
        
    Returns:
        Classification result with category and confidence
    """
    name = cookie.get('name', '').lower()
    domain = cookie.get('domain', '').lower()
    
    # Check against known patterns
    for category, data in COOKIE_CATEGORIES.items():
        for keyword in data['keywords']:
            if keyword in name or keyword in domain:
                return {
                    'category': category,
                    'confidence': 0.85,
                    'description': data['description'],
                    'method': 'rule-based'
                }
    
    # Default to functional if no match
    return {
        'category': 'functional',
        'confidence': 0.5,
        'description': 'Default classification',
        'method': 'rule-based-default'
    }


def ml_based_classification(cookie: Dict[str, Any]) -> Dict[str, Any]:
    """
    Machine learning based classification using Hugging Face model
    
    Args:
        cookie: Cookie object
        
    Returns:
        Classification result
    """
    try:
        # Extract features
        feature_text = extract_cookie_features(cookie)
        
        # Use Hugging Face Inference API
        # For text classification, you can use various models
        # Here we'll use a sentiment model as an example and map it to categories
        
        # TODO: Replace with actual cookie classification model
        # For now, using rule-based as primary method
        result = rule_based_classification(cookie)
        result['method'] = 'hybrid-ml-fallback'
        
        return result
        
    except Exception as e:
        logger.error(f"ML classification error: {str(e)}")
        # Fallback to rule-based
        return rule_based_classification(cookie)


def calculate_risk_score(cookie: Dict[str, Any], category: str) -> int:
    """
    Calculate privacy risk score (0-100) based on cookie properties
    
    Args:
        cookie: Cookie object
        category: Classified category
        
    Returns:
        Risk score (0 = low risk, 100 = high risk)
    """
    risk = 0
    
    # Category-based risk
    category_risk = {
        'necessary': 10,
        'functional': 20,
        'performance': 30,
        'analytics': 60,
        'advertising': 80,
        'social_media': 70
    }
    risk += category_risk.get(category, 50)
    
    # Security flags reduce risk
    if cookie.get('httpOnly'):
        risk -= 10
    if cookie.get('secure'):
        risk -= 10
    if cookie.get('sameSite') in ['strict', 'lax']:
        risk -= 5
    
    # Third-party cookies increase risk
    if cookie.get('domain', '').startswith('.'):
        risk += 15
    
    # Session cookies are lower risk
    if cookie.get('session'):
        risk -= 5
    
    # Clamp between 0-100
    return max(0, min(100, risk))


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'version': '1.0.0'
    })


@app.route('/classify', methods=['POST'])
def classify_cookie():
    """
    Classify a single cookie
    
    Expected JSON body:
    {
        "name": "cookie_name",
        "domain": "example.com",
        "path": "/",
        "value": "...",  # Optional, not used in classification
        "httpOnly": true,
        "secure": true,
        "sameSite": "lax",
        "session": false
    }
    """
    try:
        cookie = request.json
        
        if not cookie or 'name' not in cookie:
            return jsonify({'error': 'Invalid cookie data'}), 400
        
        # Classify using hybrid approach
        result = ml_based_classification(cookie)
        
        # Add risk score
        risk_score = calculate_risk_score(cookie, result['category'])
        
        response = {
            'cookie_name': cookie.get('name'),
            'category': result['category'],
            'confidence': result['confidence'],
            'description': result['description'],
            'risk_score': risk_score,
            'classification_method': result['method']
        }
        
        logger.info(f"Classified cookie '{cookie.get('name')}' as '{result['category']}'")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/classify-batch', methods=['POST'])
def classify_cookies_batch():
    """
    Classify multiple cookies at once
    
    Expected JSON body:
    {
        "cookies": [
            { "name": "...", "domain": "...", ... },
            ...
        ]
    }
    """
    try:
        data = request.json
        cookies = data.get('cookies', [])
        
        if not cookies:
            return jsonify({'error': 'No cookies provided'}), 400
        
        results = []
        for cookie in cookies:
            # Classify each cookie
            classification = ml_based_classification(cookie)
            risk_score = calculate_risk_score(cookie, classification['category'])
            
            results.append({
                'cookie_name': cookie.get('name'),
                'domain': cookie.get('domain'),
                'category': classification['category'],
                'confidence': classification['confidence'],
                'description': classification['description'],
                'risk_score': risk_score,
                'classification_method': classification['method']
            })
        
        # Calculate aggregate statistics
        stats = {
            'total_cookies': len(results),
            'by_category': {},
            'average_risk_score': sum(r['risk_score'] for r in results) / len(results)
        }
        
        for result in results:
            category = result['category']
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
        
        logger.info(f"Batch classified {len(results)} cookies")
        
        return jsonify({
            'results': results,
            'statistics': stats
        })
        
    except Exception as e:
        logger.error(f"Batch classification error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/categories', methods=['GET'])
def get_categories():
    """Get available cookie categories and their descriptions"""
    return jsonify({
        'categories': {
            category: data['description'] 
            for category, data in COOKIE_CATEGORIES.items()
        }
    })


if __name__ == '__main__':
    # Run the Flask server
    # In production, use a proper WSGI server like Gunicorn
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
