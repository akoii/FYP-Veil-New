# FYP-Veil-New Project Structure

> **Veil Privacy Extension** - A comprehensive Chrome extension for privacy protection with AI-powered cookie classification and real-time tracking detection.

---

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

### **01_Docs/** - Documentation
```
01_Docs/
└── README.md                         # Documentation index
```
*Purpose:* Central documentation repository for project guides, implementation details, and developer references.

---

### **02_Extension_App/** - Chrome Extension

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

#### **Key Components:**

##### **manifest.json**
- Chrome Extension configuration (Manifest V3)
- Permissions: `contentSettings`, `cookies`, `storage`, `tabs`, `webRequest`, `webNavigation`, `declarativeNetRequest`
- Service worker registration
- Extension metadata and icons

##### **core/service-worker.js**
Main background script handling:
- **Cookie Classification:** AI-powered cookie analysis via REST API
- **Hardware Permissions:** Camera, microphone, location, notifications control
- **Privacy Score Calculation:** Real-time privacy score based on blocked items
- **Tracking Detection:** Multi-layer detection system
  - Layer 1: Content Settings API monitoring
  - Layer 2: WebNavigation API tracking
  - Layer 3: WebRequest API interception
  - Layer 4: Pattern analysis for suspicious behavior
- **Statistics Tracking:** Real-time counting of blocked items
- **Message Handling:** Communication with frontend UI

##### **core/utils/cookie-classifier.js**
- Client-side interface for cookie classification API
- Communicates with Flask backend (port 5000)
- Handles cookie data formatting and API responses

##### **core/utils/blocklist-manager.js**
- Manages domain and tracker blocklists
- Provides blocklist update and query functionality

##### **frontend/pages/dashboard.html**
Main dashboard featuring:
- **Privacy Score Display:** Animated circular progress indicator
- **Statistics Cards:** Real-time blocked items counters
  - Cookies Blocked
  - DNS Requests Blocked
  - Fingerprinting Blocked
  - Hardware Access Blocked
- **Hardware Module:** 
  - Permission toggles (Camera, Microphone, Location, Notifications)
  - Activity log with detection method badges
  - Real-time hardware access monitoring
- **Charts:** 
  - Score breakdown pie chart
  - Activity timeline
- **Cookie Classifications:** Category-based cookie analysis

##### **frontend/pages/popup.html**
Quick access popup with:
- Quick stats overview
- One-click privacy mode activation
- Settings shortcuts

##### **frontend/scripts/dashboard.js**
Dashboard functionality including:
- **Phase 1-2:** Hardware UI initialization and controls
- **Phase 3:** Chrome ContentSettings API integration
- **Phase 4:** Enhanced logging with detection methods
- **Phase 5:** Real-time statistics display
  - `loadRealStatistics()`: Loads stats from Chrome storage
  - `updatePrivacyScore()`: Animated score updates with color coding
  - `updateBlockedItemsStats()`: Real-time counter updates
  - `formatNumber()`: Number formatting with commas
  - `updateScoreBreakdownChart()`: Live chart updates
  - Auto-refresh every 10 seconds
- Chart.js integration for data visualization
- Hardware permission management UI

##### **frontend/scripts/popup.js**
- Quick access controls
- Privacy mode toggle
- Navigation to dashboard

##### **frontend/scripts/cookieManager.js**
- Cookie CRUD operations
- Cookie data formatting
- Cookie classification triggers

---

### **03_AI_ML_Pipeline/** - AI/ML Backend

```
03_AI_ML_Pipeline/
├── README.md                         # AI/ML pipeline documentation
│
├── deployment/                       # Production-ready API services
│   ├── cookie_classifier_api.py      # Flask API for cookie classification
│   ├── dynamic_rules_generator.py    # Dynamic rule generation
│   ├── requirements-api.txt          # API server dependencies
│   └── .env.example                  # Environment variables template
│
└── model_training/                   # Model training scripts
    └── tracker_detection_model.py    # Tracker detection ML model training
```

#### **Key Components:**

##### **deployment/cookie_classifier_api.py**
Flask REST API providing:
- **Endpoint:** `POST /classify_cookie`
- **Input:** Cookie data (name, domain, path, value, etc.)
- **Output:** 
  - Category classification (Essential, Functional, Analytics, Advertising)
  - Risk score (0-100)
  - Confidence level
  - Recommendations
- **Features:**
  - Real-time cookie analysis
  - Pattern matching and heuristics
  - Machine learning integration ready
  - Health check endpoint

##### **deployment/dynamic_rules_generator.py**
- Generates dynamic blocking rules
- Updates declarativeNetRequest rules
- Adapts to new tracking patterns

##### **model_training/tracker_detection_model.py**
- ML model training for tracker detection
- Feature engineering for tracking behavior
- Model evaluation and optimization

---

### **04_Testing/** - Testing Suite

```
04_Testing/
├── README.md                         # Testing documentation
│
├── unit_tests/                       # Unit tests
│   └── test_tracker_model.py        # Tracker model unit tests
│
└── performance_benchmarks/           # Performance testing
    └── page_load_benchmark.py        # Page load impact measurement
```

---

## 🔧 Technology Stack

### **Frontend (Chrome Extension)**
- **Languages:** JavaScript (ES6+), HTML5, CSS3
- **Frameworks/Libraries:**
  - Chart.js (data visualization)
  - Tailwind CSS (utility-first CSS)
- **APIs:**
  - Chrome Extension APIs (Manifest V3)
  - Chrome ContentSettings API
  - Chrome WebRequest API
  - Chrome WebNavigation API
  - Chrome Storage API
  - Chrome DeclarativeNetRequest API

### **Backend (AI/ML Pipeline)**
- **Language:** Python 3.x
- **Framework:** Flask (REST API)
- **Libraries:**
  - scikit-learn (machine learning)
  - pandas (data processing)
  - numpy (numerical operations)
  - requests (HTTP client)

### **Development Tools**
- **Version Control:** Git/GitHub
- **Package Management:** 
  - npm/yarn (JavaScript)
  - pip (Python)
- **Testing:** 
  - Chrome Extension Testing Framework
  - Python unittest/pytest

---

## 🚀 Key Features Implemented

### **1. Hardware Access Control**
- ✅ Real-time hardware permission monitoring
- ✅ Block/Allow toggles for Camera, Microphone, Location, Notifications
- ✅ Activity logging with timestamps and detection methods
- ✅ Multi-layer detection system (4 layers)

### **2. Cookie Management**
- ✅ AI-powered cookie classification
- ✅ Category-based organization
- ✅ Risk score calculation
- ✅ Automatic blocking based on classification

### **3. Privacy Protection**
- ✅ Real-time tracking detection
- ✅ DNS request blocking
- ✅ Fingerprinting prevention
- ✅ Privacy score calculation

### **4. Statistics & Analytics**
- ✅ Real-time statistics display
- ✅ Animated privacy score with color coding
- ✅ Interactive charts and visualizations
- ✅ Historical data tracking
- ✅ Auto-refresh (10-second intervals)

### **5. User Interface**
- ✅ Modern, responsive design
- ✅ Dark theme with cyan accent colors
- ✅ Comprehensive dashboard
- ✅ Quick-access popup
- ✅ Real-time updates

---

## 📊 Data Flow

```
┌─────────────────┐
│   Web Browser   │
│   (User Action) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Chrome Extension Frontend       │
│  (dashboard.html, popup.html)       │
│  - UI Components                    │
│  - User Interactions                │
│  - Chart Visualizations             │
└────────┬────────────────────────────┘
         │ chrome.runtime.sendMessage()
         ▼
┌─────────────────────────────────────┐
│     Service Worker (Background)     │
│  (service-worker.js)                │
│  - Event Listeners                  │
│  - Permission Management            │
│  - Statistics Tracking              │
│  - Detection Layers (1-4)           │
└────┬────────────────────────┬───────┘
     │                        │
     │ Chrome APIs            │ HTTP POST
     │                        │
     ▼                        ▼
┌──────────────┐      ┌────────────────┐
│ Chrome APIs  │      │  Flask API     │
│ - Storage    │      │  (port 5000)   │
│ - Cookies    │      │  - Cookie      │
│ - WebRequest │      │    Classifier  │
│ - Settings   │      │  - ML Model    │
└──────────────┘      └────────────────┘
```

---

## 🔐 Permission Model

### **Required Permissions (manifest.json)**
```json
{
  "permissions": [
    "storage",           // Store statistics and settings
    "cookies",           // Cookie management
    "tabs",              // Tab access for tracking
    "webRequest",        // Request interception
    "webNavigation",     // Navigation tracking
    "declarativeNetRequest",      // Dynamic blocking rules
    "declarativeNetRequestFeedback", // Rule feedback
    "contentSettings"    // Hardware permission control
  ],
  "host_permissions": [
    "<all_urls>"         // Access to all websites
  ]
}
```

---


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

Asjad Hashmi aj0_0h @github
Umair Rasheed
M. Aqib


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
