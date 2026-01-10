# Smart Livestock Care (SLC) - PRD

## Original Problem Statement
Build & Deploy: SMART LIVESTOCK CARE (SLC) - A government-grade, professional livestock health management system.

### Core Purpose
- Digitize livestock health records
- Support veterinarians with reference-based interpretation
- Improve safety, documentation, reporting, and compliance
- **CRITICAL**: System must NEVER replace a veterinarian's clinical judgment - all outputs are supportive & advisory only

## User Personas

### 1. Farmer (Primary End User)
- Register animals & farm
- View own records
- Enter vaccination/deworming/AI history
- ❌ No diagnostics access
- ❌ No Knowledge Center access

### 2. Paravet (Field Worker)
- Enter field data
- Vaccination, deworming, AI, census
- Sample collection entry
- ❌ Cannot diagnose
- ❌ Cannot approve reports

### 3. Veterinarian (Clinical Authority)
- Enter & interpret diagnostic values
- Generate official PDFs
- Access Knowledge Center (READ-ONLY)
- Final responsibility always with vet

### 4. Admin/Department
- Manage users
- Control permissions
- Edit Knowledge Center backend logic
- Configure safety alerts
- ❌ No clinical data entry

### 5. Guest (No Registration)
- Area measurement calculator
- Interest calculator
- Download PDFs
- ❌ No animal data
- ❌ No diagnostics

## Core Requirements (Static)

### A. Authentication & RBAC
- [x] JWT-based secure login
- [x] Role isolation (Farmer, Paravet, Vet, Admin, Guest)
- [x] Session management
- [ ] Audit logs (Phase 2)

### B. Animal & Farm Registry
- [x] Species (Cattle, Buffalo, Sheep, Goat, Pig, Poultry, Dog, Cat, Horse, Camel, Donkey)
- [x] Breed, tag ID tracking
- [x] Farmer linkage
- [ ] History timeline (Phase 2)

### C. Diagnostics Module (Vet Only)
- [x] Blood Tests support
- [x] Dung (Fecal) Tests support
- [x] Milk Tests support
- [x] Urine Tests support
- [x] Nasal/Respiratory Tests support
- [x] Skin Scraping Tests support
- [x] Auto-interpretation based on reference data

### D. Knowledge Center
- [x] Test Category > Test Type > Species structure
- [x] Reference data (normal ranges)
- [x] Increase/decrease causes
- [x] Suggested actions
- [ ] Admin editing interface (Phase 2)

### E. Safety Engine
- [x] High-risk disease detection (Brucellosis, Anthrax, Leptospirosis, Tuberculosis, Avian Influenza, Rabies, FMD)
- [x] Safety block display
- [x] PPE requirements in alerts
- [x] Auto-inclusion in PDF reports

### F. PDF Generation
- [x] Server-side generation (reportlab)
- [x] Test results
- [x] Interpretation
- [x] Safety alerts
- [x] Mandatory disclaimer

## What's Been Implemented (January 2026)

### Backend (FastAPI + MongoDB)
- Complete REST API with 24+ endpoints
- JWT authentication with role-based access control
- User management (register, login, status toggle)
- Animals CRUD operations
- Vaccinations CRUD operations
- Deworming CRUD operations
- Breeding CRUD operations
- Diagnostics with auto-interpretation
- Knowledge Center CRUD
- Guest utilities (area calculator, interest calculator)
- PDF report generation with safety alerts
- Dashboard statistics for all roles

### Frontend (React + Tailwind + Shadcn)
- Professional green theme matching government/veterinary standards
- Responsive design (mobile-first PWA-ready)
- Role-based routing and layouts
- Login page with role selection
- Farmer Dashboard: My Animals, Vaccinations pages
- Vet Dashboard: Stats, Quick Actions, Diagnostics, Knowledge Center
- Admin Dashboard: User management, system stats
- Guest Utilities: Area Calculator, Interest Calculator
- Disclaimer footer on every page

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Complete Deworming page functionality
- [ ] Complete Breeding page functionality
- [ ] Animal detail view with health timeline
- [ ] Profile page for users

### P1 - High Priority
- [ ] Offline support (PWA service worker)
- [ ] Admin Knowledge Center editor
- [ ] Audit logging
- [ ] OTP-based mobile verification
- [ ] Sample collection workflow for Paravet

### P2 - Medium Priority
- [ ] Ration Calculator
- [ ] Ayurvedic Practice reference
- [ ] Animal Market feature
- [ ] Analytics dashboard with charts
- [ ] Reports generation

### P3 - Low Priority
- [ ] Tips & Advice module
- [ ] Observed Problems tracking
- [ ] Multi-language support
- [ ] Dark mode

## Test Credentials
- Farmer: 9876543210 / test123
- Vet: 9876543211 / vet123
- Admin: 9876543212 / admin123
- Guest: No registration required

## Tech Stack
- Backend: FastAPI + MongoDB + reportlab (PDF)
- Frontend: React + Tailwind CSS + Shadcn UI
- Auth: JWT tokens
- State: React Context API
