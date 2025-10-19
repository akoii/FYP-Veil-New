# Getting Started with Veil Privacy Extension

This guide will help you set up and run the Veil Privacy Extension project.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Google Chrome** (or Chromium-based browser)
- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Text Editor/IDE** (VS Code, PyCharm, etc.)

## 🚀 Quick Start (Extension Only)

If you just want to use the extension without the ML components:

1. **Navigate to the Extension Directory**
   ```bash
   cd Veil-FYP-Project/02_Extension_App
   ```

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `02_Extension_App` folder
   - The Veil icon should appear in your browser toolbar

3. **Test the Extension**
   - Click the Veil icon to see your privacy score
   - Visit any website to see blocking in action
   - Click "Details" to open the full dashboard

## 🔧 Full Setup (With ML Components)

For complete functionality including ML model training:

### Step 1: Clone/Navigate to Project

```bash
cd "Veil-FYP-Project"
```

### Step 2: Set Up Python Environment

**Option A: Using venv (Recommended)**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

**Option B: Using conda**
```bash
conda create -n veil python=3.9
conda activate veil
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- TensorFlow & Keras (ML framework)
- NumPy & Pandas (data processing)
- scikit-learn (ML utilities)
- Jupyter (notebooks)
- pytest (testing)
- And other dependencies

### Step 4: Load Extension in Browser

Follow steps from "Quick Start" above to load the extension.

### Step 5: (Optional) Train ML Model

```bash
cd 03_AI_ML_Pipeline/model_training
python tracker_detection_model.py
```

**Note**: You'll need training data first. See `03_AI_ML_Pipeline/README.md` for dataset requirements.

## 📚 Project Structure Overview

```
Veil-FYP-Project/
├── 01_Docs/              # Documentation
├── 02_Extension_App/     # Browser extension (START HERE)
├── 03_AI_ML_Pipeline/    # ML model training
├── 04_Testing/           # Tests & benchmarks
└── requirements.txt      # Python dependencies
```

## ✅ Verify Installation

### Check Extension

1. Open Chrome DevTools (F12)
2. Click Veil extension icon
3. Check console for errors
4. Privacy score should appear

### Check Python Setup

```bash
python --version          # Should be 3.8+
pip list                  # Should show installed packages
```

### Run Tests

```bash
cd 04_Testing/unit_tests
python -m pytest
```

## 🎨 Using the Extension

### Popup (Quick View)

Click the extension icon to see:
- **Privacy Score**: Visual donut chart (0-100)
- **Go Private**: Quick privacy mode toggle
- **Details**: Opens full dashboard

### Dashboard (Detailed View)

Click "Details" button to see:
- **Privacy Score Breakdown**: See what contributes to your score
- **Blocked Items**: Cookies, DNS, fingerprinting, hardware
- **Tracking History**: Chart showing tracking over time
- **Cookie Management**: View and manage cookies by category
- **DNS Protection**: See blocked DNS requests
- **Fingerprinting**: Browser fingerprinting protection status
- **Hardware Access**: Camera, microphone, location controls

## 🔧 Development Workflow

### Making Changes to Extension

1. **Edit Files**: Modify HTML, CSS, or JS files
2. **Reload Extension**: 
   - Go to `chrome://extensions/`
   - Click reload icon on Veil extension
3. **Test**: Click extension icon to test changes

### Working with ML Model

1. **Edit Model**: Modify `tracker_detection_model.py`
2. **Train**: Run `python tracker_detection_model.py`
3. **Convert**: Convert to TensorFlow.js if needed
4. **Integrate**: Update extension to use new model

### Running Jupyter Notebooks

```bash
cd 03_AI_ML_Pipeline/model_training/notebooks
jupyter notebook
```

## 🐛 Troubleshooting

### Extension Not Loading

- **Check manifest.json**: Ensure valid JSON syntax
- **Check console**: Look for errors in DevTools
- **Permissions**: Ensure all required permissions granted

### Python Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Verify installation
python -c "import tensorflow; print(tensorflow.__version__)"
```

### Extension Not Blocking

- **Check rules**: Verify blocking rules in service worker
- **Clear cache**: Clear browser cache and reload
- **Check permissions**: Ensure webRequest permission granted

### ML Model Issues

- **Missing dependencies**: Run `pip install -r requirements.txt`
- **CUDA errors**: TensorFlow GPU issues (CPU version is fine)
- **Memory errors**: Reduce batch size or model size

## 📖 Next Steps

1. **Read Documentation**: Check `01_Docs/` for detailed docs
2. **Explore Code**: Browse through the codebase
3. **Run Tests**: Execute test suite to ensure everything works
4. **Customize**: Modify extension to your needs
5. **Train Model**: Create/collect data and train ML model

## 📝 Common Tasks

### Update Privacy Score Thresholds

Edit `02_Extension_App/frontend/scripts/popup.js`:
```javascript
function getRingColor(score) {
  if (score < 50) return '#FF4444';      // Red
  else if (score < 75) return '#FFD700'; // Yellow
  else return '#EBFF3D';                 // Green
}
```

### Add New Tracking Domains

Edit `02_Extension_App/core/utils/blocklist-manager.js`:
```javascript
blocklistCache.domains.add('new-tracker.com');
```

### Modify Dashboard Layout

Edit `02_Extension_App/frontend/pages/dashboard.html` and corresponding CSS.

## 🆘 Getting Help

- **Documentation**: Check README files in each directory
- **Issues**: Common issues listed in troubleshooting section
- **Code Comments**: Read inline code comments
- **Supervisor**: Contact your project supervisor

## 🎓 Learning Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [TensorFlow Guide](https://www.tensorflow.org/guide)
- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Python Tutorial](https://docs.python.org/3/tutorial/)

## 🚀 Ready to Build!

You're all set! Start by exploring the extension, then dive into the ML components when you're ready.

**Happy Coding! 🎉**

---

For detailed documentation, see individual README files in each directory.
