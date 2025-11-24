# AI/ML Pipeline

This directory contains the machine learning components for tracker detection and dynamic rule generation.

## 📁 Structure

```
03_AI_ML_Pipeline/
├── model_training/           # Model development
│   ├── tracker_detection_model.py
│   ├── datasets/            # Training data
│   └── notebooks/           # Jupyter notebooks
│
└── deployment/              # Model deployment
    ├── tfjs_converter/      # TensorFlow.js conversion
    └── dynamic_rules_generator.py
```

## 🤖 Machine Learning Model

### Overview

The tracker detection model uses deep learning to identify tracking patterns in web requests. It's trained on features extracted from URLs, domains, and request characteristics.

### Model Architecture

```
Input Layer (50 features)
    ↓
Dense Layer (128 neurons, ReLU)
    ↓
Dropout (0.3)
    ↓
Dense Layer (64 neurons, ReLU)
    ↓
Dropout (0.3)
    ↓
Dense Layer (32 neurons, ReLU)
    ↓
Dropout (0.2)
    ↓
Output Layer (1 neuron, Sigmoid)
```

## 📊 Training the Model

### Prerequisites

```bash
pip install tensorflow keras numpy pandas scikit-learn
```

### Training Process

```bash
cd model_training
python tracker_detection_model.py
```

### Creating Training Data

Training data should be in CSV format with columns:
- `url`: Full request URL
- `domain`: Domain name
- `type`: Request type (script, xmlhttprequest, etc.)
- `has_cookies`: Boolean
- `cookie_count`: Integer
- `has_referer`: Boolean
- `has_user_agent`: Boolean
- `is_tracker`: Boolean (label)

Example:
```csv
url,domain,type,has_cookies,cookie_count,has_referer,has_user_agent,is_tracker
https://doubleclick.net/track,doubleclick.net,script,1,3,1,1,1
https://example.com/page,example.com,document,0,0,0,1,0
```

## 🔄 Model Deployment

### Converting to TensorFlow.js

```bash
cd deployment/tfjs_converter

tensorflowjs_converter \
    --input_format=keras \
    ../../model_training/tracker_model.h5 \
    ./tfjs_model/
```

### Using the Model in Extension

```javascript
// Load model in service worker
const model = await tf.loadLayersModel('tfjs_model/model.json');

// Make predictions
const features = extractFeatures(request);
const prediction = model.predict(tf.tensor2d([features]));
const isTracker = prediction.dataSync()[0] > 0.5;
```

## 📈 Feature Engineering

The model extracts the following features from web requests:

### URL Features
- URL length
- Number of dots in URL
- Number of slashes
- Has query parameters
- Number of parameters
- Contains tracking keywords ('track', 'analytics', 'pixel')

### Domain Features
- Domain length
- Subdomain count
- Known tracker domain match

### Request Features
- Request type (encoded)
- Cookie presence
- Cookie count
- Referer header presence
- User agent presence

## 🎯 Dynamic Rule Generation

### Overview

The `dynamic_rules_generator.py` script creates browser blocking rules from:
1. Known tracker lists
2. ML model predictions
3. Pattern analysis

### Usage

```python
from deployment.dynamic_rules_generator import DynamicRulesGenerator

generator = DynamicRulesGenerator()

# Add known trackers
generator.known_trackers.add('doubleclick.net')

# Add ML-detected patterns
generator.add_suspicious_pattern('tracker.example.com', confidence=0.95)

# Generate rules
generator.export_rules('blocking_rules.json', browser='chrome')
```

## 📓 Jupyter Notebooks

The `notebooks/` directory contains:

### 01_data_exploration.ipynb
- Explore training data
- Visualize patterns
- Feature analysis

### 02_model_training.ipynb
- Interactive model training
- Hyperparameter tuning
- Performance evaluation

### 03_model_evaluation.ipynb
- Test model performance
- Confusion matrix
- ROC curves
- Feature importance

## 🔬 Datasets

### Required Datasets

Store datasets in `model_training/datasets/`:

1. **tracker_data.csv**: Labeled training data
2. **test_data.csv**: Test set for evaluation
3. **known_trackers.json**: List of known tracking domains

### Dataset Sources

- [EasyPrivacy List](https://easylist.to/easylist/easyprivacy.txt)
- [Disconnect Tracking Protection](https://disconnect.me/)
- [uBlock Origin filters](https://github.com/uBlockOrigin/uAssets)

## 📊 Model Performance

### Metrics

Track these metrics:
- **Accuracy**: Overall correctness
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **F1-Score**: Harmonic mean of precision and recall

### Expected Performance

Target metrics:
- Accuracy: > 95%
- Precision: > 93%
- Recall: > 90%
- F1-Score: > 91%

## 🛠️ Model Improvement

### Tips for Better Performance

1. **More Training Data**: Collect more labeled examples
2. **Feature Engineering**: Add new relevant features
3. **Hyperparameter Tuning**: Optimize learning rate, batch size, etc.
4. **Ensemble Methods**: Combine multiple models
5. **Regular Updates**: Retrain with new tracking patterns

## 🔄 Continuous Learning

### Updating the Model

1. Collect new tracking patterns
2. Label new data
3. Retrain model
4. Convert to TensorFlow.js
5. Update extension

## 🧪 Testing

### Unit Tests

```bash
cd ../04_Testing/unit_tests
python test_tracker_model.py
```

### Integration Tests

Test model integration with extension:
1. Load model in extension
2. Make predictions on real requests
3. Verify blocking behavior

## 📚 Resources

- [TensorFlow Documentation](https://www.tensorflow.org/)
- [Keras Guide](https://keras.io/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [scikit-learn](https://scikit-learn.org/)

---

For questions about the ML pipeline, refer to the main project documentation.
