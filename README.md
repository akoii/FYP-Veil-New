# Veil - Privacy Extension FYP Project

## Project Overview

Veil is an advanced privacy protection browser extension that uses AI-powered tracker detection to safeguard user privacy while browsing the web.

## 📁 Project Structure

```
Veil-FYP-Project/
├── 01_Docs/                    # Project documentation
│   ├── Proposal.docx           # Initial project proposal
│   ├── SRS.docx                # Software Requirements Specification
│   ├── Design.docx             # Detailed architecture and UI/UX
│   └── Presentation/           # Presentation materials
│
├── 02_Extension_App/           # Core Browser Extension
│   ├── manifest.json           # Extension configuration
│   ├── frontend/               # UI/Views
│   │   ├── assets/             # Images, icons, fonts
│   │   ├── pages/
│   │   │   ├── dashboard.html  # Main dashboard
│   │   │   └── popup.html      # Quick-access popup
│   │   ├── scripts/
│   │   │   ├── dashboard.js    # Dashboard logic
│   │   │   └── popup.js        # Popup logic
│   │   ├── styles/
│   │   │   ├── dashboard.css
│   │   │   └── popup.css
│   │   └── index.html          # Main entry point
│   │
│   └── core/                   # Extension Logic
│       ├── service-worker.js   # Background script
│       ├── api-handlers.js     # Chrome API wrappers
│       └── utils/
│           └── blocklist-manager.js  # Blocklist management
│
├── 03_AI_ML_Pipeline/          # Python/TensorFlow Components
│   ├── model_training/
│   │   ├── tracker_detection_model.py  # ML model
│   │   ├── datasets/                   # Training data
│   │   └── notebooks/                  # Jupyter notebooks
│   │
│   └── deployment/
│       ├── tfjs_converter/             # TensorFlow.js tools
│       └── dynamic_rules_generator.py  # Dynamic rule generation
│
├── 04_Testing/
│   ├── unit_tests/             # Unit tests
│   ├── integration_tests/      # Integration tests
│   └── performance_benchmarks/ # Performance tests
│
└── requirements.txt            # Python dependencies
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
