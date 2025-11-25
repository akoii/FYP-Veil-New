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

## 📝 Recent Implementation (Phase 5)

### **Real-Time Statistics Display**
- **File Modified:** `dashboard.js` (lines 1214-1456)
- **Features Added:**
  1. `loadRealStatistics()` - Main loader with auto-refresh
  2. `updatePrivacyScore()` - Animated score with color coding
  3. `updateBlockedItemsStats()` - Live counter updates
  4. `formatNumber()` - Comma-separated number formatting
  5. `updateScoreBreakdownChart()` - Dynamic chart updates
  6. `getStatisticsSummary()` - Statistics aggregation
  7. `exportStatistics()` - JSON export functionality
  8. `resetStatistics()` - Admin reset function

### **Privacy Score Color Coding**
- **80-100:** 🎉 Excellent Protection (Green #EBFF3D)
- **60-79:** ✅ Good Protection (Cyan #4DD4E8)
- **40-59:** ⚠️ Moderate Protection (Orange #FFB366)
- **0-39:** 🚨 Weak Protection (Red #FF6B6B)

---

## 📖 Documentation Files (Root)

| File | Description |
|------|-------------|
| `CHANGELOG.md` | Version history and changes |
| `COLOR_PALETTE_QUICK_REFERENCE.md` | UI color palette guide |
| `COLOR_SYSTEM_DESIGN.md` | Design system documentation |
| `COOKIE_CLASSIFICATION_GUIDE.md` | Cookie classification details |
| `COOKIE_CLASSIFICATION_QUICKSTART.md` | Quick start for cookie features |
| `DIAGNOSTIC_REPORT.md` | System diagnostics |
| `FUNCTIONALITY_VERIFICATION.md` | Feature verification checklist |
| `GETTING_STARTED.md` | Project setup guide |
| `IMPLEMENTATION_SUMMARY.md` | Implementation overview |
| `PIE_CHART_COLOR_RECOMMENDATIONS.md` | Chart color guidelines |
| `PROJECT_SETUP_COMPLETE.md` | Setup completion confirmation |
| `TESTING_CHECKLIST.md` | Testing procedures |
| `TIMEFRAME_TOGGLE_IMPLEMENTATION.md` | Timeframe feature docs |

---

## 🛠️ Setup & Installation

### **Prerequisites**
- Node.js & npm
- Python 3.x
- Chrome/Chromium browser

### **Installation Steps**
1. Clone repository: `git clone https://github.com/akoii/FYP-Veil-New.git`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Install API dependencies: `pip install -r 03_AI_ML_Pipeline/deployment/requirements-api.txt`
4. Start API server: `.\start-api.ps1` or `python 03_AI_ML_Pipeline/deployment/cookie_classifier_api.py`
5. Load extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `02_Extension_App/` directory

---

## 🔄 Git Branches
- **main:** Production-ready code
- **asjad-branch:** Development branch (merged to main)

---

## 👥 Project Information
- **Repository:** https://github.com/akoii/FYP-Veil-New
- **Owner:** akoii
- **Type:** Final Year Project (FYP)
- **Category:** Privacy & Security Chrome Extension

---

## 📅 Last Updated
November 25, 2025 - Phase 5 Completed

---

*This structure represents the complete FYP-Veil privacy extension with real-time tracking detection, AI-powered cookie classification, and comprehensive hardware access control.*
