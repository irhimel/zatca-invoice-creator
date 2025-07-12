# 🧪 Testing Guide

## Pre-Testing Setup

```bash
npm run dev
```

## Core Tests

### 1. Invoice Creation

- [ ] Create new invoice
- [ ] Add items with tax calculations
- [ ] Generate PDF with QR code
- [ ] Verify ZATCA compliance

### 2. Client Management

- [ ] Add new client
- [ ] Edit client details
- [ ] Search and filter clients
- [ ] Export client data

### 3. Data Persistence

- [ ] Create invoice offline
- [ ] Verify data saves locally
- [ ] Test Azure SQL sync (if configured)
- [ ] Import/export functionality

### 4. Cross-Platform

- [ ] Test on target operating system
- [ ] Verify file paths and permissions
- [ ] Check installer/uninstaller

## Expected Results

✅ All features work without errors  
✅ Data persists across sessions  
✅ PDFs generate with valid QR codes  
✅ ZATCA validation passes  
✅ Responsive UI on all screen sizes
