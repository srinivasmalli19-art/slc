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

## What's Been Implemented (January 2026)

### ✅ Backend (FastAPI + MongoDB) - COMPLETE
- REST API with 24+ endpoints
- JWT authentication with role-based access control
- User management (register, login, status toggle)
- Animals CRUD operations (all 11 species)
- Vaccinations CRUD operations
- Deworming CRUD operations
- Breeding/AI CRUD operations
- Diagnostics with auto-interpretation (Vet only)
- Knowledge Center CRUD
- Guest utilities (area calculator, interest calculator)
- PDF report generation with safety alerts
- Dashboard statistics for all roles

### ✅ Frontend - Farmer Section - COMPLETE
- **Login Page**: Role selection with Farmer/Paravet/Vet/Admin/Guest cards
- **My Profile**: Farmer details, edit functionality, stats display
- **My Animals**: List view with species filter tabs, search, animal cards
- **Add Animal**: 3-step wizard (Species/Breed → Age/Gender/Status → Additional details)
- **Vaccinations**: List view, species-specific vaccine selection, history records
- **Deworming**: List view, drug selection, due date tracking with overdue alerts
- **Breeding**: Natural mating and AI records with expected calving dates
- **Ration Calculator**: Buffalo ICAR-aligned calculator with feeds and costs (Cattle/Sheep/Goat coming soon)
- **Area Measurement**: Length/Width calculator with 6 unit conversions
- **Interest Calculator**: Simple and Compound interest with EMI calculation

### ✅ Frontend - Other Sections
- **Vet Dashboard**: Stats, Quick Actions, Diagnostics, Knowledge Center
- **Admin Dashboard**: User management, system stats
- **Guest Utilities**: Area Calculator, Interest Calculator
- **Common Components**: Disclaimer footer, responsive layouts

## Prioritized Backlog

### P0 - Critical (Next Sprint) - DONE ✅
- ✅ Complete Farmer Profile page
- ✅ Complete My Animals with Add Animal wizard
- ✅ Complete Vaccinations page with species-specific vaccines
- ✅ Complete Deworming page
- ✅ Complete Breeding page
- ✅ Complete Ration Calculator for Buffalo
- ✅ Complete Area Measurement calculator
- ✅ Complete Interest Calculator

### P1 - High Priority (Next)
- [ ] Expand Ration Calculator for Cattle, Sheep, Goat, Pig
- [ ] Implement Milk Records module
- [ ] Implement Vet Diagnostics entry with auto-interpretation
- [ ] Offline support (PWA service worker)
- [ ] Admin Knowledge Center editor

### P2 - Medium Priority
- [ ] Reports generation module (Vaccination, Deworming, Breeding reports)
- [ ] Ayurvedic Practice reference page
- [ ] Animal Care Tips page
- [ ] Near By Animal Sales page
- [ ] Analytics dashboard with charts

### P3 - Low Priority
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Observed Problems tracking

## Test Credentials
- Farmer: 9876543210 / test123
- Vet: 9876543211 / vet123 (may need registration)
- Admin: 9876543212 / admin123 (may need registration)
- Guest: No registration required

## Tech Stack
- Backend: FastAPI + MongoDB + reportlab (PDF)
- Frontend: React + Tailwind CSS + Shadcn UI
- Auth: JWT tokens
- State: React Context API

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login with phone/password/role
- GET `/api/auth/me` - Get current user
- POST `/api/auth/guest-session` - Create guest session

### Animals
- POST `/api/animals` - Create animal
- GET `/api/animals` - Get all animals (with optional species filter)
- GET `/api/animals/{id}` - Get animal by ID
- PUT `/api/animals/{id}` - Update animal
- DELETE `/api/animals/{id}` - Delete animal

### Health Records
- POST `/api/vaccinations` - Create vaccination record
- GET `/api/vaccinations` - Get vaccination records
- POST `/api/deworming` - Create deworming record
- GET `/api/deworming` - Get deworming records
- POST `/api/breeding` - Create breeding record
- GET `/api/breeding` - Get breeding records

### Utilities
- POST `/api/utilities/area-calculator` - Calculate area
- POST `/api/utilities/interest-calculator` - Calculate interest

### Dashboard
- GET `/api/dashboard/farmer-stats` - Get farmer statistics
- GET `/api/dashboard/vet-stats` - Get vet statistics

## Testing Status
- **Backend Tests**: 33/33 passed (100%)
- **Frontend Tests**: All farmer pages verified
- **Test Report**: `/app/test_reports/iteration_2.json`
