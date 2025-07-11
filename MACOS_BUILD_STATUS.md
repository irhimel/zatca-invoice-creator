# macOS Build Status

## ✅ Build Completed Successfully

**Date:** July 10, 2025
**Platform:** macOS
**Project:** ZATCA Invoice Creator

## 📦 Created Installers

### DMG Installers (Disk Images)

- **Intel Macs (x64):** `ZATCA Invoice Creator-1.0.0-x64.dmg` (118 MB)
- **Apple Silicon Macs (ARM64):** `ZATCA Invoice Creator-1.0.0-arm64.dmg` (113 MB)

### ZIP Archives

- **Intel Macs (x64):** `ZATCA Invoice Creator-1.0.0-x64.zip` (114 MB)
- **Apple Silicon Macs (ARM64):** `ZATCA Invoice Creator-1.0.0-arm64.zip` (109 MB)

## 📁 File Location

All installers are located in the `release/` directory:

```

release/
├── ZATCA Invoice Creator-1.0.0-x64.dmg      (Intel)
├── ZATCA Invoice Creator-1.0.0-arm64.dmg    (Apple Silicon)
├── ZATCA Invoice Creator-1.0.0-x64.zip      (Intel)
└── ZATCA Invoice Creator-1.0.0-arm64.zip    (Apple Silicon)

```

## 🖥️ System Requirements

### Intel Macs (x64)

- macOS 10.15 (Catalina) or later
- Intel x64 processor
- 4GB RAM minimum, 8GB recommended
- 500MB available disk space

### Apple Silicon Macs (ARM64)

- macOS 11.0 (Big Sur) or later
- Apple M1, M2, or newer processors
- 4GB RAM minimum, 8GB recommended
- 500MB available disk space

## 📲 Installation Instructions

### DMG Installation (Recommended)

1. Double-click the appropriate `.dmg` file for your Mac
2. Wait for the disk image to mount
3. Drag "ZATCA Invoice Creator.app" to the Applications folder
4. Eject the disk image
5. Launch the app from Applications or Spotlight

### ZIP Installation (Alternative)

1. Double-click the `.zip` file to extract
2. Move "ZATCA Invoice Creator.app" to Applications folder
3. Launch the app from Applications or Spotlight

## 🔒 Security Notes

### First Launch

When launching for the first time, macOS may show a security warning because the app is not code-signed:

1. If prompted with "cannot be opened because it is from an unidentified developer"
2. Go to **System Preferences > Security & Privacy > General**
3. Click **"Open Anyway"** next to the blocked app message
4. Confirm by clicking **"Open"** in the dialog

### Gatekeeper Bypass (Alternative Method)

If the above doesn't work:
1. Right-click on the app in Applications
2. Select **"Open"** from the context menu
3. Click **"Open"** in the security dialog

## ✨ Features Included

- ✅ ZATCA Phase 2 compliant invoice generation
- ✅ QR code generation with cryptographic stamps
- ✅ UBL 2.1 XML format support
- ✅ PDF/A-3 generation with embedded XML
- ✅ Client and quote management
- ✅ Offline-first operation with Azure SQL sync
- ✅ Bilingual UI (Arabic/English)
- ✅ Export capabilities (Excel, CSV, PDF)
- ✅ Advanced validation and templates
- ✅ Real-time auto-save functionality

## 🚀 Ready for Distribution

Both Intel and Apple Silicon versions are ready for:

- Internal company distribution
- Beta testing with clients
- Production deployment
- App Store submission (with proper code signing)

## 📞 Support

For installation or usage support:

- Check the included documentation
- Refer to SETUP_GUIDE.md
- Contact your system administrator

---

**Build Tool:** electron-builder v26.0.12
**Electron Version:** 37.2.0
**Node.js Version:** 18.20.8
