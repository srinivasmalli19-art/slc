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
- Use utility calculators
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

## Species List (11 Animals - FIXED)
1. Cattle
2. Buffalo
3. Sheep
4. Goat
5. Pig
6. Poultry
7. Dog (Canine)
8. Cat (Feline)
9. Horse
10. Donkey
11. Camel

## What's Been Implemented

### ✅ Farmer Section - COMPLETE (January 10, 2026)
- **Login Page**: Role selection with Farmer/Paravet/Vet/Admin/Guest cards
- **My Profile**: Farmer details, edit functionality, stats display
- **My Animals**: List view with species filter tabs, search, animal cards
- **Add Animal**: 3-step wizard (Species/Breed → Age/Gender/Status → Additional details)
- **Vaccinations**: List view, species-specific vaccine selection, history records
- **Deworming**: List view, drug selection, due date tracking with overdue alerts
- **Breeding**: Natural mating and AI records with expected calving dates
- **Ration Calculator**: Buffalo ICAR-aligned calculator with feeds and costs
- **Area Measurement**: Length/Width calculator with 6 unit conversions
- **Interest Calculator**: Simple and Compound interest with EMI calculation

### ✅ Veterinarian Section - Phase 1 COMPLETE (January 11, 2026)
- **VetLayout**: Enhanced sidebar with 14 numbered modules and collapsible submenus
- **Vet Dashboard**:
  - Summary cards (OPD Today, IPD Active, Vaccinations, AI Cases, Mortality)
  - Alerts Panel with zoonotic disease warnings and profile completion alerts
  - Quick Actions (New OPD Case, Diagnostics, Registers, Certificates, Knowledge Center, Reports)
  - Overall Statistics (Total OPD, Total IPD, Animals Registered, Pending Follow-ups)
  - Zoonotic Safety Reminder banner
- **Vet Profile Register**:
  - Registration Details (Registration Number - locked once saved, Qualification, Mobile, Date of Joining)
  - Institution & Location (Institution Name, Village, Mandal, District, State)
  - Profile completion status badge (VET-YYYY-XXXXX format)
- **Institution Basic Data**:
  - Institution list with verification status
  - Add Institution dialog with all required fields
  - Jurisdiction villages multi-select
  - Admin verification lock note
- **OPD Register**:
  - Case list with yearly auto-numbering (OPD-2026-00001)
  - Serial numbers
  - Patient & Farmer details (Tag, Species, Owner, Village, Phone, Age)
  - Clinical details (Symptoms, Tentative Diagnosis, Treatment)
  - Result tracking (Ongoing, Recovered, Referred, Follow-up, Died)
  - Zoonotic disease warning for high-risk diagnoses
  - Search and filter (by species, result)
- **Knowledge Center**: Reference database (existing)
- **Diagnostics**: Auto-interpretation (existing)

## Backend APIs

### Vet Profile & Institution
- POST `/api/vet/profile` - Create vet profile
- GET `/api/vet/profile` - Get vet profile
- PUT `/api/vet/profile` - Update vet profile (registration number locked)
- POST `/api/vet/institution` - Create institution
- GET `/api/vet/institutions` - Get institutions list
- GET `/api/vet/institution/{id}` - Get institution by ID

### OPD/IPD
- POST `/api/vet/opd` - Create OPD case
- GET `/api/vet/opd` - Get OPD cases with filters
- GET `/api/vet/opd/{id}` - Get single OPD case
- PUT `/api/vet/opd/{id}` - Update OPD case
- POST `/api/vet/ipd` - Create IPD case
- GET `/api/vet/ipd` - Get IPD cases

### Dashboard & Alerts
- GET `/api/dashboard/vet-stats-detailed` - Enhanced vet statistics
- GET `/api/vet/alerts` - Vet alerts (follow-ups, profile, zoonotic)

## Prioritized Backlog

### P1 - High Priority (Next)
- [ ] **IPD Register** - Full implementation with admission/discharge
- [ ] **Vaccination Register** - Large Animals & Small Animals/Flock
- [ ] **AI Register** - With PD result and calf birth linkage
- [ ] **Surgical Case Register** - Surgery types, anesthesia, outcomes
- [ ] **Certificates** - Health Certificate, Health & Valuation Certificate

### P2 - Medium Priority
- [ ] Expand Ration Calculator for Cattle, Sheep, Goat, Pig
- [ ] Implement Milk Records module
- [ ] Clinical Registers (Gynaecology, Castration)
- [ ] Disease & Mortality (Outbreak Register, Mortality Register)
- [ ] Post-Mortem Register and Certificate

### P3 - Paravet Section
- [ ] Paravet Dashboard
- [ ] Paravet-specific registers (subset of Vet modules)
- [ ] "Raise Request" workflow to Vet

### P4 - Admin Section
- [ ] Master Admin Dashboard with RBAC
- [ ] User Management (Farmer/Paravet/Vet)
- [ ] Knowledge Center Editor
- [ ] Audit Logs & Compliance

### P5 - Future/Backlog
- [ ] PDF Report Generation
- [ ] Offline PWA support
- [ ] Multi-language support
- [ ] Stock Management registers
- [ ] GVA Analytics

## Test Credentials
- Farmer: 9876543210 / test123
- Veterinarian: 9876543211 / vet123
- Admin: To be created
- Guest: No registration required

## Tech Stack
- Backend: FastAPI + MongoDB + reportlab (PDF)
- Frontend: React + Tailwind CSS + Shadcn UI
- Auth: JWT tokens
- State: React Context API

## Testing Status
- **Farmer Tests**: 33/33 passed (100%) - `/app/test_reports/iteration_2.json`
- **Vet Tests**: 17/17 backend + all frontend passed (100%) - `/app/test_reports/iteration_3.json`

## High-Risk Zoonotic Diseases (Safety Engine)
1. Brucellosis
2. Anthrax
3. Leptospirosis
4. Tuberculosis
5. Avian Influenza
6. Rabies
7. FMD (Foot and Mouth Disease)

## Global Disclaimer
"This system provides clinical reference and decision support only. Final diagnosis and treatment decisions must be made by a registered veterinarian."
