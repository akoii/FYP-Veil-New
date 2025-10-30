"""
Extension Readiness Checker
Verifies all files are in place for Chrome extension installation
"""

import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
print("🔍 Checking Veil Extension Files...\n")

# Check manifest.json
manifest_path = BASE_DIR / "manifest.json"
if manifest_path.exists():
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        print("✅ manifest.json - Valid")
        print(f"   Name: {manifest.get('name')}")
        print(f"   Version: {manifest.get('version')}")
    except json.JSONDecodeError as e:
        print(f"❌ manifest.json - Invalid JSON: {e}")
else:
    print("❌ manifest.json - NOT FOUND")

# Check required files
required_files = [
    "frontend/pages/dashboard.html",
    "frontend/scripts/cookieClassifier.js",
    "frontend/scripts/cookieManager.js",
    "frontend/scripts/dashboard.js",
    "frontend/styles/dashboard.css",
    "core/service-worker.js",
    "core/rules/tracker_rules.json"
]

print("\n📁 Required Files:")
all_exist = True
for file in required_files:
    file_path = BASE_DIR / file
    if file_path.exists():
        size = file_path.stat().st_size
        print(f"✅ {file} ({size:,} bytes)")
    else:
        print(f"❌ {file} - NOT FOUND")
        all_exist = False

# Check icons
print("\n🎨 Icons:")
icon_files = ["icon16.svg", "icon48.svg", "icon128.svg"]
for icon in icon_files:
    icon_path = BASE_DIR / "frontend" / "assets" / icon
    if icon_path.exists():
        print(f"✅ {icon}")
    else:
        print(f"❌ {icon} - NOT FOUND")

# Summary
print("\n" + "="*50)
if all_exist:
    print("🎉 Extension is READY for installation!")
    print("\n📋 Next Steps:")
    print("1. Open Chrome: chrome://extensions/")
    print("2. Enable 'Developer mode'")
    print("3. Click 'Load unpacked'")
    print(f"4. Select folder: {BASE_DIR}")
    print("\n📖 See EXTENSION_INSTALL_GUIDE.md for detailed instructions")
else:
    print("⚠️  Some files are missing. Please check above.")

print("="*50)
