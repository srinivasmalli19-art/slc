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

### 4. Admin/Department (Governance Authority)
- Manage users (activate/deactivate/lock)
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
- **Vet Dashboard**: Summary cards, Alerts Panel, Quick Actions, Zoonotic Safety Reminder
- **Vet Profile Register**: Registration details (locked once saved), Institution & Location
- **Institution Basic Data**: Institution list with verification status
- **OPD Register**: Yearly auto-numbering (OPD-2026-00001), Clinical details, Zoonotic alerts

### ✅ Veterinarian Section - Batch 2 (Clinical Registers) COMPLETE (January 11, 2026)
- **Surgical Case Register**: 
  - Stats cards (Total Surgeries, Successful, Complications, Mortality)
  - Case list with SURG-YYYY-XXXXX format, surgery type, species, outcome badge
  - New case dialog with: Tag/ID, Farmer, Species, Surgery Type (13 options), Pre-Op Condition, Anesthesia Type/Details, Surgical Procedure, Findings, Post-Op Care, Outcome, Follow-up Date
  - Search and filter by species/outcome
  - View details dialog
- **Gynaecology Register**:
  - Stats cards (Total Cases, Recovered, Pregnant, Ongoing)
  - Case list with GYN-YYYY-XXXXX format, condition, species, result badge
  - New case dialog with: Tag/ID, Farmer, Species, Parity, Last Calving Date, Breeding History, Condition (13 options), Symptoms, Per-Rectal Findings, Diagnosis, Treatment, Prognosis, Result
  - Search and filter by species/condition
  - View details dialog
- **Castration Register**:
  - Stats cards (Total Castrations, Successful, Bloodless, Surgical)
  - Case list with CAST-YYYY-XXXXX format, method, species, outcome badge
  - New case dialog with: Tag/ID, Farmer, Species, Body Weight, Method (5 options), Anesthesia, Procedure Details, Outcome, Post-Op Care
  - Search and filter by species/method
  - View details dialog

### ✅ GVA & Economic Analysis COMPLETE (January 11, 2026)
- **Input Data Tab**: Livestock Census (Cattle, Buffalo, Sheep, Goat, Poultry), Milk Parameters (Yield, Price), Meat Parameters (Live Weight, Price), Poultry & Egg Parameters, Location Details
- **Results Tab**: Total Village GVA with breakdown - Milk GVA, Sheep & Goat Meat GVA, Buffalo Meat GVA, Poultry Meat GVA, Egg GVA (showing GSDP, Input Costs, and final GVA for each)
- **History Tab**: List of previous reports with View and Download buttons
- **PDF Download**: Working PDF generation with detailed GVA breakdown

### ✅ Admin Section - Batch 1 COMPLETE (January 11, 2026)
- **AdminLayout**: Dark sidebar with 12 numbered modules, Governance & Audit Authority theme
- **Admin Dashboard**:
  - Summary cards (Total Farmers/Paravets/Vets/Animals/Institutions)
  - Pending Approvals cards (User Approvals, Institution Verifications, Knowledge Entries)
  - Quick Actions (User Management, Knowledge Center, Safety Rules, Audit Logs, Settings, Reports)
  - Alerts Panel (Institution Verification Pending, Zoonotic Disease Outbreak)
  - Governance Mode banner explaining admin restrictions
- **User Management**:
  - Stats cards (Total Users, Active, Inactive, Locked)
  - Role tabs (All, Farmers, Paravets, Vets, Admins)
  - Search and status filter
  - User table with role badges, status badges, actions
  - User Detail page with activate/deactivate/lock/unlock actions
  - Vet-specific actions (verify registration, enable/disable certificates)
  - Audit Notice footer
- **Audit Logs**:
  - Immutable Audit Trail banner
  - Export CSV functionality
  - Filters (Action Type, Target Type, Date Range)
  - Log entries with action badges, before/after values
  - Detail dialog with full audit information
- **Safety Rules**:
  - Pre-configured High-Risk Diseases (Brucellosis, Anthrax, Leptospirosis, Tuberculosis, Avian Influenza, Rabies, FMD)
  - Create/Edit safety rules with: PPE Instructions, Isolation Protocols, Milk/Meat Restrictions, Disposal Procedures, Government Reporting
  - Species-affected multi-select
  - Version control and audit logging
- **Institution Management**:
  - Stats cards (Total, Verified, Pending)
  - Institution list with verification status
  - Verify/Revoke verification with remarks
  - Jurisdiction villages display

## Backend APIs

### Clinical Registers APIs (NEW - January 11, 2026)
- POST `/api/vet/surgical` - Create surgical case (auto-generates SURG-YYYY-XXXXX)
- GET `/api/vet/surgical` - List surgical cases (with species/outcome filters)
- GET `/api/vet/surgical/{id}` - Get surgical case by ID
- PUT `/api/vet/surgical/{id}` - Update surgical case
- POST `/api/vet/gynaecology` - Create gynaecology case (auto-generates GYN-YYYY-XXXXX)
- GET `/api/vet/gynaecology` - List gynaecology cases (with species/condition filters)
- GET `/api/vet/gynaecology/{id}` - Get gynaecology case by ID
- PUT `/api/vet/gynaecology/{id}` - Update gynaecology case
- POST `/api/vet/castration` - Create castration case (auto-generates CAST-YYYY-XXXXX)
- GET `/api/vet/castration` - List castration cases (with species/method filters)
- GET `/api/vet/castration/{id}` - Get castration case by ID
- PUT `/api/vet/castration/{id}` - Update castration case

### GVA APIs (January 11, 2026)
- POST `/api/gva/calculate` - Calculate and store GVA report
- GET `/api/gva/reports` - List GVA reports
- GET `/api/gva/reports/{id}` - Get GVA report by ID
- GET `/api/gva/reports/{id}/pdf` - Download GVA PDF report
- GET `/api/gva/settings` - Get GVA settings (Admin only)
- PUT `/api/gva/settings` - Update GVA settings (Admin only)

### Admin APIs
- GET `/api/admin/dashboard-stats` - Comprehensive admin statistics
- GET `/api/admin/alerts` - Admin-specific alerts
- GET `/api/admin/users` - Get all users with filters (role, status, search)
- GET `/api/admin/users/{id}` - Get user detail with activity
- PUT `/api/admin/users/{id}/status` - Activate/deactivate user
- PUT `/api/admin/users/{id}/lock` - Lock/unlock user account
- GET `/api/admin/users/{id}/activity` - Get user activity log
- PUT `/api/admin/vets/{id}/verify-registration` - Verify vet registration
- PUT `/api/admin/vets/{id}/certificate-privileges` - Enable/disable certificates
- PUT `/api/admin/institutions/{id}/verify` - Verify institution
- POST `/api/admin/knowledge` - Create knowledge entry
- GET `/api/admin/knowledge` - Get knowledge entries
- PUT `/api/admin/knowledge/{id}` - Update knowledge entry (versioned)
- PUT `/api/admin/knowledge/{id}/publish` - Publish knowledge entry
- PUT `/api/admin/knowledge/{id}/archive` - Archive knowledge entry
- POST `/api/admin/safety-rules` - Create safety rule
- GET `/api/admin/safety-rules` - Get all safety rules
- PUT `/api/admin/safety-rules/{id}` - Update safety rule (versioned)
- GET `/api/admin/audit-logs` - Get audit logs with filters
- POST `/api/admin/notifications` - Create system notification
- GET `/api/admin/notifications` - Get admin notifications
- GET `/api/admin/settings` - Get system settings
- PUT `/api/admin/settings/{key}` - Update system setting
- PUT `/api/admin/records/{type}/{id}/lock` - Lock/unlock records
- GET `/api/admin/reports/user-activity` - User activity report
- GET `/api/admin/reports/disease-surveillance` - Disease surveillance report

## Prioritized Backlog

### P1 - High Priority (Next - Batch 3)
- [ ] **IPD Register** - Admission/discharge tracking with bed numbers
- [ ] **Vaccination Register** - Large/Small Animals with species-specific vaccines
- [ ] **Deworming Register** - Drug selection, due date tracking
- [ ] **AI Register** - Artificial Insemination multi-tab records

### ✅ COMPLETED - Batch 2 (January 11, 2026)
- [x] **Surgical Case Register** - Surgery types (13 options), anesthesia (6 types), outcomes (6 options)
- [x] **Gynaecology Register** - Reproductive conditions (13 types), treatments, breeding history
- [x] **Castration Register** - Methods (5 options), body weight, anesthesia tracking
- [x] **GVA & Economic Analysis** - Calculation engine, results breakdown, PDF download

### P2 - GVA & Analytics (Batch 3 - Critical)
- [ ] **GVA Calculation Engine** - Milk, Meat, Egg calculations (admin-configurable percentages)
- [ ] **Village GVA Report** - Combined report with PDF download
- [ ] **Stock Registers** - Biological, Medicine, Feed with batch/expiry tracking
- [ ] **Distribution Registers** - Feed/Seed with auto stock deduction

### P3 - Legal & Compliance (Batch 4)
- [ ] **Post-Mortem Register & Certificate** - Step-wise form with PDF
- [ ] **Health Certificate Generator** - Auto-filled with PDF output
- [ ] **Admin & Guidelines** - Read-only legal content with acceptance flow
- [ ] **My Paravets** - Paravet request approval workflow

### P4 - Paravet Section
- [ ] Paravet Dashboard
- [ ] Paravet-specific registers
- [ ] "Raise Request" workflow to Vet

### P5 - Future/Backlog
- [ ] RBAC Permission Matrix UI
- [ ] System Notifications Management
- [ ] Backup & Data Integrity
- [ ] PDF Report Generation
- [ ] Offline PWA support

## Test Credentials
- Farmer: 9876543210 / test123
- Veterinarian: 9876543211 / vet123
- Admin: 9876543212 / admin123
- Guest: No registration required

## Tech Stack
- Backend: FastAPI + MongoDB + reportlab (PDF)
- Frontend: React + Tailwind CSS + Shadcn UI
- Auth: JWT tokens
- State: React Context API

## Testing Status
- **Farmer Tests**: 33/33 passed (100%) - `/app/test_reports/iteration_2.json`
- **Vet Tests**: 17/17 passed (100%) - `/app/test_reports/iteration_3.json`
- **Admin Tests**: 21/21 backend + all frontend passed (100%) - `/app/test_reports/iteration_4.json`

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

## Admin Governance Principle
"Admin actions govern and control all Paravet, Veterinarian, and Farmer system operations. All actions are logged for compliance."
