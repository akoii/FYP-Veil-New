"""
Unit tests for Tracker Detection Model
"""

import unittest
import numpy as np
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from model_training.tracker_detection_model import TrackerDetectionModel


class TestTrackerDetectionModel(unittest.TestCase):
    """Test cases for TrackerDetectionModel"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.model = TrackerDetectionModel(input_dim=50)
        
    def test_model_initialization(self):
        """Test model initialization"""
        self.assertIsNotNone(self.model)
        self.assertEqual(self.model.input_dim, 50)
        
    def test_build_model(self):
        """Test model building"""
        model = self.model.build_model()
        self.assertIsNotNone(model)
        self.assertEqual(len(model.layers), 10)  # Including input layer
        
    def test_extract_features(self):
        """Test feature extraction"""
        request_data = {
            'url': 'https://doubleclick.net/track?id=123',
            'domain': 'doubleclick.net',
            'type': 'script',
            'has_cookies': 1,
            'cookie_count': 3,
            'has_referer': 1,
            'has_user_agent': 1
        }
        
        features = self.model.extract_features(request_data)
        
        self.assertEqual(len(features), 50)
        self.assertIsInstance(features, np.ndarray)
        self.assertTrue(np.all(np.isfinite(features)))
        
    def test_extract_features_tracking_keywords(self):
        """Test feature extraction identifies tracking keywords"""
        request_data = {
            'url': 'https://analytics.google.com/track',
            'domain': 'analytics.google.com',
            'type': 'script'
        }
        
        features = self.model.extract_features(request_data)
        
        # Check that 'track' and 'analytics' keywords are detected
        self.assertGreater(features[5], 0)  # 'track' feature
        self.assertGreater(features[6], 0)  # 'analytics' feature
        
    def test_extract_features_missing_data(self):
        """Test feature extraction with missing data"""
        request_data = {}
        
        features = self.model.extract_features(request_data)
        
        self.assertEqual(len(features), 50)
        self.assertIsInstance(features, np.ndarray)


if __name__ == '__main__':
    unittest.main()
