"""
Tracker Detection Model - TensorFlow/Keras Implementation
This module trains a neural network to detect tracking patterns in web requests
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import json

class TrackerDetectionModel:
    """
    Neural network model for detecting tracking behavior in web requests
    """
    
    def __init__(self, input_dim=50):
        """
        Initialize the model
        
        Args:
            input_dim: Number of input features
        """
        self.input_dim = input_dim
        self.model = None
        self.scaler = StandardScaler()
        
    def build_model(self):
        """
        Build the neural network architecture
        """
        model = keras.Sequential([
            # Input layer
            layers.Input(shape=(self.input_dim,)),
            
            # Hidden layers with dropout for regularization
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.3),
            layers.BatchNormalization(),
            
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.3),
            layers.BatchNormalization(),
            
            layers.Dense(32, activation='relu'),
            layers.Dropout(0.2),
            
            # Output layer (binary classification: tracker or not)
            layers.Dense(1, activation='sigmoid')
        ])
        
        # Compile the model
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        self.model = model
        return model
    
    def extract_features(self, request_data):
        """
        Extract features from web request data
        
        Args:
            request_data: Dictionary containing request information
            
        Returns:
            numpy array of features
        """
        features = []
        
        # URL-based features
        url = request_data.get('url', '')
        features.append(len(url))  # URL length
        features.append(url.count('.'))  # Number of dots
        features.append(url.count('/'))  # Number of slashes
        features.append(url.count('?'))  # Has query params
        features.append(url.count('&'))  # Number of params
        features.append(1 if 'track' in url.lower() else 0)  # Contains 'track'
        features.append(1 if 'analytics' in url.lower() else 0)  # Contains 'analytics'
        features.append(1 if 'pixel' in url.lower() else 0)  # Contains 'pixel'
        
        # Domain-based features
        domain = request_data.get('domain', '')
        features.append(len(domain))  # Domain length
        features.append(domain.count('.'))  # Subdomain count
        
        # Request type features
        request_type = request_data.get('type', '')
        type_encoding = {
            'script': 1,
            'xmlhttprequest': 2,
            'image': 3,
            'stylesheet': 4,
            'font': 5,
            'other': 0
        }
        features.append(type_encoding.get(request_type, 0))
        
        # Cookie features
        features.append(request_data.get('has_cookies', 0))
        features.append(request_data.get('cookie_count', 0))
        
        # Header features
        features.append(request_data.get('has_referer', 0))
        features.append(request_data.get('has_user_agent', 0))
        
        # Pad to input_dim if needed
        while len(features) < self.input_dim:
            features.append(0)
        
        return np.array(features[:self.input_dim])
    
    def prepare_data(self, data_path):
        """
        Load and prepare training data
        
        Args:
            data_path: Path to training data CSV
            
        Returns:
            X_train, X_test, y_train, y_test
        """
        # Load data
        df = pd.read_csv(data_path)
        
        # Extract features
        X = np.array([self.extract_features(row) for _, row in df.iterrows()])
        y = df['is_tracker'].values
        
        # Normalize features
        X = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        return X_train, X_test, y_train, y_test
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50, batch_size=32):
        """
        Train the model
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features
            y_val: Validation labels
            epochs: Number of training epochs
            batch_size: Batch size
            
        Returns:
            Training history
        """
        # Early stopping callback
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True
        )
        
        # Model checkpoint callback
        checkpoint = keras.callbacks.ModelCheckpoint(
            'best_model.h5',
            monitor='val_accuracy',
            save_best_only=True
        )
        
        # Train the model
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stopping, checkpoint],
            verbose=1
        )
        
        return history
    
    def predict(self, request_data):
        """
        Predict if a request is a tracker
        
        Args:
            request_data: Dictionary containing request information
            
        Returns:
            Probability of being a tracker (0-1)
        """
        features = self.extract_features(request_data)
        features = self.scaler.transform([features])
        prediction = self.model.predict(features, verbose=0)[0][0]
        return float(prediction)
    
    def save_model(self, path='tracker_model'):
        """
        Save the model to disk
        
        Args:
            path: Directory to save model
        """
        self.model.save(f'{path}.h5')
        
        # Save scaler
        import joblib
        joblib.dump(self.scaler, f'{path}_scaler.pkl')
        
        print(f"Model saved to {path}")
    
    def load_model(self, path='tracker_model'):
        """
        Load a saved model
        
        Args:
            path: Path to saved model
        """
        self.model = keras.models.load_model(f'{path}.h5')
        
        # Load scaler
        import joblib
        self.scaler = joblib.load(f'{path}_scaler.pkl')
        
        print(f"Model loaded from {path}")


def main():
    """
    Main training script
    """
    print("Initializing Tracker Detection Model...")
    
    # Create model
    model = TrackerDetectionModel(input_dim=50)
    model.build_model()
    
    print("Model architecture:")
    model.model.summary()
    
    # Load and prepare data
    print("\nPreparing training data...")
    # Note: You'll need to create the training dataset
    # X_train, X_test, y_train, y_test = model.prepare_data('datasets/tracker_data.csv')
    
    # Train model
    # print("\nTraining model...")
    # history = model.train(X_train, y_train, X_test, y_test, epochs=50)
    
    # Save model
    # model.save_model('tracker_model')
    
    print("\nTraining complete!")


if __name__ == '__main__':
    main()
