# Veil - Privacy Extension FYP Project

## Project Overview

Veil is an advanced privacy protection browser extension that uses AI-powered tracker detection to safeguard user privacy while browsing the web.

## 📁 Project Structure
## 📁 Root Directory

```
FYP-Veil-New/
├── 01_Docs/                          # Documentation
├── 02_Extension_App/                 # Chrome Extension (Main Application)
├── 03_AI_ML_Pipeline/                # AI/ML Backend Services
├── 04_Testing/                       # Testing Suite
├── .gitignore                        # Git ignore rules
├── README.md                         # Project overview
├── requirements.txt                  # Python dependencies
├── start-api.ps1                     # PowerShell script to start API server
└── [Documentation Files]             # Various implementation guides
```

---

## 📂 Detailed Structure

```
01_Docs/
└── README.md                         # Documentation index
```
                                      *Purpose:* Central documentation repository for project guides, implementation details, and developer references.
```
02_Extension_App/
├── manifest.json                     # Chrome Extension Manifest V3 configuration
├── README.md                         # Extension documentation
├── test-console.js                   # Console testing utilities
├── test-cookies.html                 # Cookie testing page
├── TEST-GUIDE.md                     # Testing instructions
├── TESTING.md                        # Testing documentation
│
├── core/                             # Background Scripts & Core Logic
│   ├── service-worker.js             # Main service worker (background script)
│   ├── api-handlers.js               # API communication handlers
│   └── utils/                        # Utility modules
│       ├── blocklist-manager.js      # Domain/tracker blocklist management
│       └── cookie-classifier.js      # Cookie classification client
│
└── frontend/                         # User Interface
    ├── pages/                        # HTML Pages
    │   ├── dashboard.html            # Main dashboard page
    │   └── popup.html                # Extension popup interface
    │
    ├── scripts/                      # JavaScript for UI
    │   ├── dashboard.js              # Dashboard functionality & charts
    │   ├── popup.js                  # Popup interface logic
    │   └── cookieManager.js          # Cookie management utilities
    │
    ├── styles/                       # CSS Stylesheets
    │   ├── dashboard.css             # Dashboard styling
    │   └── popup.css                 # Popup styling
    │
    └── assets/                       # Static assets (images, icons, fonts)
```

```

## 🚀 Features

- **Real-time Privacy Score**: Visual representation of your browsing privacy
- **Interactive Timeframe Toggle**: View tracking history across different time periods (7D, 30D, 3M, Total) ✨ **NEW**
- **Cookie Management**: Block and manage tracking cookies
- **DNS Request Blocking**: Prevent DNS-based tracking
- **Fingerprinting Protection**: Protect against browser fingerprinting
- **Hardware Access Control**: Manage camera, microphone, and location access
- **AI-Powered Detection**: Machine learning model for detecting new trackers
- **Dynamic Blocklists**: Auto-updating tracker blocklists

## 🛠️ Installation

### Extension Setup

1. Navigate to `02_Extension_App/`
2. Load the unpacked extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `02_Extension_App` directory

### Python Environment Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Navigate to AI/ML pipeline
cd 03_AI_ML_Pipeline/model_training

# Train the model (optional)
python tracker_detection_model.py
```

## 💻 Development

### Running Tests

```bash
# Run unit tests
cd 04_Testing/unit_tests
python -m pytest

# Run performance benchmarks
cd 04_Testing/performance_benchmarks
python page_load_benchmark.py
```

### Training the ML Model

```bash
cd 03_AI_ML_Pipeline/model_training
python tracker_detection_model.py
```

## 📊 Performance

The extension is designed to have minimal impact on page load times while providing maximum privacy protection. See `04_Testing/performance_benchmarks/` for detailed performance analysis.

## 🔒 Privacy Features

### Cookie Blocking
- Blocks third-party tracking cookies
- Manages advertising cookies
- Allows necessary functional cookies

### DNS Protection
- Blocks known tracking domains
- Uses EasyPrivacy and uBlock Origin lists
- Dynamic rule generation

### Fingerprinting Protection
- Canvas fingerprinting protection
- WebRTC IP leak prevention
- User agent randomization

## 📈 Privacy Score Calculation

The privacy score is calculated based on:
- Number of cookies blocked
- DNS requests blocked
- Fingerprinting attempts blocked
- Hardware access requests blocked

Score ranges:
- 0-50: Privacy at risk
- 50-75: Room for improvement
- 75-100: Excellent privacy protection

## 🤝 Contributing

This is an FYP (Final Year Project). For questions or contributions, please contact the project team.

## 📄 License

This project is part of an academic final year project.

## 👥 Team

[Add your team member names and roles here]

## 📚 Documentation

Detailed documentation can be found in the `01_Docs/` directory:
- **Proposal**: Initial project proposal and objectives
- **SRS**: Software Requirements Specification
- **Design**: System architecture and UI/UX design

### Feature Documentation
- **[TIMEFRAME_TOGGLE_IMPLEMENTATION.md](TIMEFRAME_TOGGLE_IMPLEMENTATION.md)**: Complete technical guide for the timeframe toggle feature
- **[TIMEFRAME_TOGGLE_QUICKSTART.md](TIMEFRAME_TOGGLE_QUICKSTART.md)**: Developer quick reference
- **[TIMEFRAME_TOGGLE_VISUAL_GUIDE.md](TIMEFRAME_TOGGLE_VISUAL_GUIDE.md)**: Visual design and layout reference
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**: Implementation status and checklist

## 🔗 References

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [EasyPrivacy List](https://easylist.to/)
- [uBlock Origin](https://github.com/gorhill/uBlock)

---

**Note**: This project is for educational purposes as part of a Final Year Project (FYP).
