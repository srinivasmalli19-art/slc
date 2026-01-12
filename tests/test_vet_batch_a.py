"""
Test suite for Smart Livestock Care (SLC) - Veterinarian Batch A: Preventive & Breeding Services
Tests: Vaccination Register, Deworming Register, AI Register (Artificial Insemination), Calf Birth Register
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from main agent
VET_PHONE = "9111222333"
VET_PASSWORD = "password"
VET_ROLE = "veterinarian"


@pytest.fixture(scope="module")
def vet_token():
    """Get vet authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": VET_PHONE,
        "password": VET_PASSWORD,
        "role": VET_ROLE
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip(f"Vet authentication failed - {response.status_code}: {response.text}")


@pytest.fixture(scope="module")
def vet_headers(vet_token):
    """Get headers with vet auth token"""
    return {
        "Authorization": f"Bearer {vet_token}",
        "Content-Type": "application/json"
    }


class TestVetAuth:
    """Veterinarian authentication tests for Batch A"""
    
    def test_vet_login_success(self):
        """Test vet login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": VET_PHONE,
            "password": VET_PASSWORD,
            "role": VET_ROLE
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["role"] == VET_ROLE
        print(f"SUCCESS: Vet login successful - User: {data['user']['name']}")


# ============ VACCINATION REGISTER TESTS ============

class TestVaccinationRegister:
    """Vaccination Register tests - Large and Small Animals"""
    
    def test_get_vaccination_records(self, vet_headers):
        """Test getting vaccination records list"""
        response = requests.get(f"{BASE_URL}/api/vet/vaccination", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of vaccination records"
        print(f"SUCCESS: Get vaccination records - Count: {len(data)}")
    
    def test_create_vaccination_large_animal_cattle_fmd(self, vet_headers):
        """Test creating vaccination record for large animal (cattle, FMD vaccine)"""
        vacc_data = {
            "animal_type": "large",
            "tag_number": f"TEST-VAC-L-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Large Animal",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543210",
            "species": "cattle",
            "breed": "Holstein Friesian",
            "age_months": 24,
            "vaccine_name": "fmd",
            "batch_number": "FMD-BATCH-001",
            "manufacturer": "Indian Immunologicals",
            "dose_rate": "2 ml/animal",
            "dose_given": "2 ml",
            "route": "intramuscular",
            "vaccination_date": datetime.now().strftime("%Y-%m-%d"),
            "next_due_date": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
            "animals_vaccinated": 1,
            "remarks": "Test vaccination - FMD for cattle"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/vaccination", headers=vet_headers, json=vacc_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing id in response"
        assert "case_number" in data, "Missing case_number in response"
        assert "serial_number" in data, "Missing serial_number in response"
        
        # Verify case number format: VAC-L-YYYY-XXXXX for large animals
        current_year = datetime.now().year
        assert data["case_number"].startswith(f"VAC-L-{current_year}-"), f"Case number should start with VAC-L-{current_year}-, got {data['case_number']}"
        
        assert data["animal_type"] == "large"
        assert data["species"] == "cattle"
        assert data["vaccine_name"] == "fmd"
        assert data["vet_name"] is not None
        
        print(f"SUCCESS: Created large animal vaccination - Case Number: {data['case_number']}")
        return data
    
    def test_create_vaccination_small_animal_poultry(self, vet_headers):
        """Test creating vaccination record for small animal (poultry)"""
        vacc_data = {
            "animal_type": "small",
            "tag_number": f"TEST-VAC-S-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Poultry",
            "farmer_village": "Test Village Poultry",
            "farmer_phone": "9876543211",
            "species": "poultry",
            "breed": "Broiler",
            "vaccine_name": "ranikhet",
            "batch_number": "RD-BATCH-001",
            "manufacturer": "Venky's",
            "dose_rate": "0.5 ml/bird",
            "dose_given": "50 ml",
            "route": "drinking_water",
            "vaccination_date": datetime.now().strftime("%Y-%m-%d"),
            "next_due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "flock_size": 500,
            "animals_vaccinated": 500,
            "remarks": "Test vaccination - Ranikhet for poultry flock"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/vaccination", headers=vet_headers, json=vacc_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "case_number" in data
        
        # Verify case number format: VAC-S-YYYY-XXXXX for small animals
        current_year = datetime.now().year
        assert data["case_number"].startswith(f"VAC-S-{current_year}-"), f"Case number should start with VAC-S-{current_year}-, got {data['case_number']}"
        
        assert data["animal_type"] == "small"
        assert data["species"] == "poultry"
        assert data["flock_size"] == 500
        
        print(f"SUCCESS: Created small animal vaccination - Case Number: {data['case_number']}")
        return data
    
    def test_filter_vaccination_by_animal_type(self, vet_headers):
        """Test filtering vaccination records by animal type"""
        response = requests.get(f"{BASE_URL}/api/vet/vaccination?animal_type=large", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["animal_type"] == "large", f"Expected large, got {record['animal_type']}"
        
        print(f"SUCCESS: Filter vaccination by animal type - Large animal records: {len(data)}")
    
    def test_filter_vaccination_by_species(self, vet_headers):
        """Test filtering vaccination records by species"""
        response = requests.get(f"{BASE_URL}/api/vet/vaccination?species=cattle", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["species"] == "cattle", f"Expected cattle, got {record['species']}"
        
        print(f"SUCCESS: Filter vaccination by species - Cattle records: {len(data)}")


# ============ DEWORMING REGISTER TESTS ============

class TestDewormingRegister:
    """Deworming Register tests"""
    
    def test_get_deworming_records(self, vet_headers):
        """Test getting deworming records list"""
        response = requests.get(f"{BASE_URL}/api/vet/deworming", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of deworming records"
        print(f"SUCCESS: Get deworming records - Count: {len(data)}")
    
    def test_create_deworming_record(self, vet_headers):
        """Test creating new deworming record"""
        dew_data = {
            "tag_number": f"TEST-DEW-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Deworming",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543212",
            "species": "cattle",
            "breed": "Jersey",
            "age_months": 18,
            "body_weight_kg": 350.5,
            "drug_used": "albendazole",
            "drug_batch": "ALB-BATCH-001",
            "dose_rate": "10 mg/kg",
            "dose_given": "3.5 g",
            "route": "oral",
            "deworming_date": datetime.now().strftime("%Y-%m-%d"),
            "next_due_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
            "result": "completed",
            "fecal_sample_taken": False,
            "remarks": "Test deworming - Albendazole for cattle"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/deworming", headers=vet_headers, json=dew_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing id in response"
        assert "case_number" in data, "Missing case_number in response"
        assert "serial_number" in data, "Missing serial_number in response"
        
        # Verify case number format: DEW-YYYY-XXXXX
        current_year = datetime.now().year
        assert data["case_number"].startswith(f"DEW-{current_year}-"), f"Case number should start with DEW-{current_year}-, got {data['case_number']}"
        
        assert data["drug_used"] == "albendazole"
        assert data["result"] == "completed"
        
        print(f"SUCCESS: Created deworming record - Case Number: {data['case_number']}")
        return data
    
    def test_create_deworming_with_epg_testing(self, vet_headers):
        """Test creating deworming record with EPG testing checkbox enabled"""
        dew_data = {
            "tag_number": f"TEST-DEW-EPG-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer EPG",
            "farmer_village": "Test Village EPG",
            "farmer_phone": "9876543213",
            "species": "goat",
            "breed": "Jamunapari",
            "age_months": 12,
            "body_weight_kg": 45.0,
            "drug_used": "ivermectin",
            "drug_batch": "IVM-BATCH-001",
            "dose_rate": "0.2 mg/kg",
            "dose_given": "9 mg",
            "route": "subcutaneous",
            "deworming_date": datetime.now().strftime("%Y-%m-%d"),
            "next_due_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
            "result": "completed",
            "fecal_sample_taken": True,
            "epg_before": 1500,
            "epg_after": 200,
            "remarks": "Test deworming with EPG testing - Ivermectin for goat"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/deworming", headers=vet_headers, json=dew_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["fecal_sample_taken"] == True, "fecal_sample_taken should be True"
        assert data["epg_before"] == 1500, f"Expected epg_before 1500, got {data['epg_before']}"
        assert data["epg_after"] == 200, f"Expected epg_after 200, got {data['epg_after']}"
        
        print(f"SUCCESS: Created deworming with EPG testing - Case Number: {data['case_number']}, EPG Before: {data['epg_before']}, EPG After: {data['epg_after']}")
        return data
    
    def test_filter_deworming_by_species(self, vet_headers):
        """Test filtering deworming records by species"""
        response = requests.get(f"{BASE_URL}/api/vet/deworming?species=cattle", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["species"] == "cattle", f"Expected cattle, got {record['species']}"
        
        print(f"SUCCESS: Filter deworming by species - Cattle records: {len(data)}")


# ============ AI REGISTER TESTS (CRITICAL - 25+ FIELDS) ============

class TestAIRegister:
    """AI Register (Artificial Insemination) tests - Most critical component"""
    
    def test_get_ai_records(self, vet_headers):
        """Test getting AI records list"""
        response = requests.get(f"{BASE_URL}/api/vet/ai-register", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of AI records"
        print(f"SUCCESS: Get AI records - Count: {len(data)}")
    
    def test_create_ai_record_all_required_fields(self, vet_headers):
        """Test creating AI record with all required fields"""
        ai_data = {
            # Location Details
            "village": "Test AI Village",
            "mandal": "Test Mandal",
            "district": "Test District",
            "state": "Test State",
            # Semen Straw Details
            "ss_number": f"SS-{datetime.now().strftime('%H%M%S')}",
            "bull_id": "BULL-001",
            "bull_breed": "HF",
            "semen_batch": "SB-2025-001",
            "semen_station": "Test Semen Station",
            # Animal Details
            "tag_number": f"TEST-AI-{datetime.now().strftime('%H%M%S')}",
            "sire_number": "SIRE-001",
            "species": "cattle",
            "breed": "Jersey Cross",
            "age_years": 4,
            "parity": 2,
            "body_condition_score": 3.5,
            "milk_yield_liters": 12.5,
            # Farmer Details
            "farmer_name": "Test Farmer AI",
            "farmer_father_name": "Test Father",
            "farmer_address": "Test Address, Test Village",
            "farmer_phone": "9876543214",
            "farmer_aadhaar": "123456789012",
            # AI Details
            "ai_date": datetime.now().strftime("%Y-%m-%d"),
            "ai_time": "10:30",
            "heat_symptoms": "Standing Heat",
            "ai_attempt_number": 1,
            "ai_type": "frozen",
            "straws_used": 1,
            "insemination_site": "Mid-cervix",
            # Stock Details
            "opening_balance": 50,
            "straws_received": 0,
            "straws_used_today": 1,
            "closing_balance": 49,
            # Fee Details
            "fee_amount": 100.0,
            "fee_receipt_number": "REC-001",
            "fee_date": datetime.now().strftime("%Y-%m-%d"),
            # Additional
            "remarks": "Test AI record with all required fields"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/ai-register", headers=vet_headers, json=ai_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing id in response"
        assert "case_number" in data, "Missing case_number in response"
        assert "serial_number" in data, "Missing serial_number in response"
        assert "monthly_number" in data, "Missing monthly_number in response"
        assert "yearly_number" in data, "Missing yearly_number in response"
        
        # Verify case number format: AI-YYYY-XXXXX
        current_year = datetime.now().year
        assert data["case_number"].startswith(f"AI-{current_year}-"), f"Case number should start with AI-{current_year}-, got {data['case_number']}"
        
        # Verify required fields
        assert data["village"] == "Test AI Village"
        assert data["ss_number"] == ai_data["ss_number"]
        assert data["tag_number"] == ai_data["tag_number"]
        assert data["farmer_name"] == "Test Farmer AI"
        assert data["farmer_phone"] == "9876543214"
        assert data["ai_date"] == ai_data["ai_date"]
        
        print(f"SUCCESS: Created AI record - Case Number: {data['case_number']}, Monthly: {data['monthly_number']}, Yearly: {data['yearly_number']}")
        return data
    
    def test_get_ai_record_by_id(self, vet_headers):
        """Test getting AI record by ID"""
        # First create a record
        ai_data = {
            "village": "Test Village Get",
            "ss_number": f"SS-GET-{datetime.now().strftime('%H%M%S')}",
            "tag_number": f"TEST-AI-GET-{datetime.now().strftime('%H%M%S')}",
            "species": "cattle",
            "farmer_name": "Test Farmer Get",
            "farmer_phone": "9876543215",
            "ai_date": datetime.now().strftime("%Y-%m-%d"),
        }
        
        create_response = requests.post(f"{BASE_URL}/api/vet/ai-register", headers=vet_headers, json=ai_data)
        assert create_response.status_code == 200
        created = create_response.json()
        
        # Get by ID
        response = requests.get(f"{BASE_URL}/api/vet/ai-register/{created['id']}", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == created["id"]
        assert data["case_number"] == created["case_number"]
        
        print(f"SUCCESS: Get AI record by ID - {data['case_number']}")
    
    def test_update_ai_record_pd_result(self, vet_headers):
        """Test updating AI record with PD (Pregnancy Diagnosis) result"""
        # First create a record
        ai_data = {
            "village": "Test Village PD",
            "ss_number": f"SS-PD-{datetime.now().strftime('%H%M%S')}",
            "tag_number": f"TEST-AI-PD-{datetime.now().strftime('%H%M%S')}",
            "species": "buffalo",
            "farmer_name": "Test Farmer PD",
            "farmer_phone": "9876543216",
            "ai_date": (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d"),
        }
        
        create_response = requests.post(f"{BASE_URL}/api/vet/ai-register", headers=vet_headers, json=ai_data)
        assert create_response.status_code == 200
        created = create_response.json()
        
        # Update with PD result
        update_data = {
            **ai_data,
            "pd_date": datetime.now().strftime("%Y-%m-%d"),
            "pd_result": "positive",
            "pd_days": 60,
        }
        
        response = requests.put(f"{BASE_URL}/api/vet/ai-register/{created['id']}", headers=vet_headers, json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["pd_result"] == "positive", f"Expected pd_result positive, got {data['pd_result']}"
        assert data["pd_days"] == 60, f"Expected pd_days 60, got {data['pd_days']}"
        
        print(f"SUCCESS: Updated AI record with PD result - Case: {data['case_number']}, PD Result: {data['pd_result']}")
    
    def test_filter_ai_by_species(self, vet_headers):
        """Test filtering AI records by species"""
        response = requests.get(f"{BASE_URL}/api/vet/ai-register?species=cattle", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["species"] == "cattle", f"Expected cattle, got {record['species']}"
        
        print(f"SUCCESS: Filter AI by species - Cattle records: {len(data)}")
    
    def test_filter_ai_by_pd_result(self, vet_headers):
        """Test filtering AI records by PD result"""
        response = requests.get(f"{BASE_URL}/api/vet/ai-register?pd_result=positive", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["pd_result"] == "positive", f"Expected positive, got {record['pd_result']}"
        
        print(f"SUCCESS: Filter AI by PD result - Positive records: {len(data)}")


# ============ CALF BIRTH REGISTER TESTS ============

class TestCalfBirthRegister:
    """Calf Birth Register tests"""
    
    def test_get_calf_birth_records(self, vet_headers):
        """Test getting calf birth records list"""
        response = requests.get(f"{BASE_URL}/api/vet/calf-birth", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of calf birth records"
        print(f"SUCCESS: Get calf birth records - Count: {len(data)}")
    
    def test_create_calf_birth_record(self, vet_headers):
        """Test creating new calf birth record"""
        calf_data = {
            "farmer_name": "Test Farmer Calf",
            "farmer_village": "Test Village Calf",
            "farmer_phone": "9876543217",
            "dam_tag_number": f"DAM-{datetime.now().strftime('%H%M%S')}",
            "dam_species": "cattle",
            "dam_breed": "HF Cross",
            "sire_tag_number": "SIRE-001",
            "sire_breed": "HF",
            "ai_done_date": (datetime.now() - timedelta(days=280)).strftime("%Y-%m-%d"),
            "ai_case_number": "AI-2025-00001",
            "expected_birth_date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
            "actual_birth_date": datetime.now().strftime("%Y-%m-%d"),
            "birth_type": "normal",
            "calf_sex": "female",
            "calf_weight_kg": 28.5,
            "calf_tag_number": f"CALF-{datetime.now().strftime('%H%M%S')}",
            "calf_color": "Black & White",
            "twins": False,
            "stillborn": False,
            "dam_condition": "good",
            "calf_condition": "healthy",
            "first_colostrum_time": "02:30",
            "remarks": "Test calf birth - Normal delivery, healthy female calf"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/calf-birth", headers=vet_headers, json=calf_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing id in response"
        assert "case_number" in data, "Missing case_number in response"
        assert "serial_number" in data, "Missing serial_number in response"
        
        # Verify case number format: CALF-YYYY-XXXXX
        current_year = datetime.now().year
        assert data["case_number"].startswith(f"CALF-{current_year}-"), f"Case number should start with CALF-{current_year}-, got {data['case_number']}"
        
        assert data["calf_sex"] == "female"
        assert data["birth_type"] == "normal"
        assert data["stillborn"] == False
        
        print(f"SUCCESS: Created calf birth record - Case Number: {data['case_number']}, Sex: {data['calf_sex']}")
        return data
    
    def test_create_calf_birth_twins(self, vet_headers):
        """Test creating calf birth record with twins"""
        calf_data = {
            "farmer_name": "Test Farmer Twins",
            "farmer_village": "Test Village Twins",
            "farmer_phone": "9876543218",
            "dam_tag_number": f"DAM-TWIN-{datetime.now().strftime('%H%M%S')}",
            "dam_species": "goat",
            "dam_breed": "Jamunapari",
            "actual_birth_date": datetime.now().strftime("%Y-%m-%d"),
            "birth_type": "normal",
            "calf_sex": "male",
            "calf_weight_kg": 2.5,
            "twins": True,
            "stillborn": False,
            "dam_condition": "good",
            "calf_condition": "healthy",
            "remarks": "Test calf birth - Twins"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/calf-birth", headers=vet_headers, json=calf_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["twins"] == True, "twins should be True"
        
        print(f"SUCCESS: Created calf birth with twins - Case Number: {data['case_number']}")
    
    def test_filter_calf_birth_by_species(self, vet_headers):
        """Test filtering calf birth records by species"""
        response = requests.get(f"{BASE_URL}/api/vet/calf-birth?species=cattle", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["dam_species"] == "cattle", f"Expected cattle, got {record['dam_species']}"
        
        print(f"SUCCESS: Filter calf birth by species - Cattle records: {len(data)}")
    
    def test_filter_calf_birth_by_sex(self, vet_headers):
        """Test filtering calf birth records by calf sex"""
        response = requests.get(f"{BASE_URL}/api/vet/calf-birth?calf_sex=female", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        for record in data:
            assert record["calf_sex"] == "female", f"Expected female, got {record['calf_sex']}"
        
        print(f"SUCCESS: Filter calf birth by sex - Female calf records: {len(data)}")


# ============ CASE NUMBER FORMAT TESTS ============

class TestCaseNumberFormats:
    """Test case number formats for all registers"""
    
    def test_vaccination_large_case_number_format(self, vet_headers):
        """Test vaccination large animal case number format: VAC-L-YYYY-XXXXX"""
        vacc_data = {
            "animal_type": "large",
            "tag_number": f"TEST-FMT-L-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Format Large",
            "farmer_village": "Test Village",
            "species": "buffalo",
            "vaccine_name": "hs",
            "dose_rate": "3 ml",
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/vaccination", headers=vet_headers, json=vacc_data)
        assert response.status_code == 200
        
        data = response.json()
        parts = data["case_number"].split("-")
        assert len(parts) == 4, f"Case number should have 4 parts, got {len(parts)}: {data['case_number']}"
        assert parts[0] == "VAC", f"First part should be VAC, got {parts[0]}"
        assert parts[1] == "L", f"Second part should be L for large, got {parts[1]}"
        assert parts[2] == str(datetime.now().year), f"Third part should be current year"
        assert len(parts[3]) == 5 and parts[3].isdigit(), f"Fourth part should be 5 digits"
        
        print(f"SUCCESS: Vaccination large case number format verified - {data['case_number']}")
    
    def test_vaccination_small_case_number_format(self, vet_headers):
        """Test vaccination small animal case number format: VAC-S-YYYY-XXXXX"""
        vacc_data = {
            "animal_type": "small",
            "tag_number": f"TEST-FMT-S-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Format Small",
            "farmer_village": "Test Village",
            "species": "poultry",
            "vaccine_name": "ranikhet",
            "dose_rate": "0.5 ml",
            "flock_size": 100,
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/vaccination", headers=vet_headers, json=vacc_data)
        assert response.status_code == 200
        
        data = response.json()
        parts = data["case_number"].split("-")
        assert parts[1] == "S", f"Second part should be S for small, got {parts[1]}"
        
        print(f"SUCCESS: Vaccination small case number format verified - {data['case_number']}")
    
    def test_deworming_case_number_format(self, vet_headers):
        """Test deworming case number format: DEW-YYYY-XXXXX"""
        dew_data = {
            "tag_number": f"TEST-FMT-DEW-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Format Dew",
            "farmer_village": "Test Village",
            "species": "sheep",
            "drug_used": "fenbendazole",
            "dose_rate": "5 mg/kg",
            "dose_given": "2 g",
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/deworming", headers=vet_headers, json=dew_data)
        assert response.status_code == 200
        
        data = response.json()
        parts = data["case_number"].split("-")
        assert len(parts) == 3, f"Case number should have 3 parts, got {len(parts)}"
        assert parts[0] == "DEW", f"First part should be DEW, got {parts[0]}"
        
        print(f"SUCCESS: Deworming case number format verified - {data['case_number']}")
    
    def test_ai_case_number_format(self, vet_headers):
        """Test AI case number format: AI-YYYY-XXXXX"""
        ai_data = {
            "village": "Test Format Village",
            "ss_number": f"SS-FMT-{datetime.now().strftime('%H%M%S')}",
            "tag_number": f"TEST-FMT-AI-{datetime.now().strftime('%H%M%S')}",
            "species": "cattle",
            "farmer_name": "Test Format AI",
            "farmer_phone": "9876543219",
            "ai_date": datetime.now().strftime("%Y-%m-%d"),
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/ai-register", headers=vet_headers, json=ai_data)
        assert response.status_code == 200
        
        data = response.json()
        parts = data["case_number"].split("-")
        assert len(parts) == 3, f"Case number should have 3 parts, got {len(parts)}"
        assert parts[0] == "AI", f"First part should be AI, got {parts[0]}"
        
        print(f"SUCCESS: AI case number format verified - {data['case_number']}")
    
    def test_calf_birth_case_number_format(self, vet_headers):
        """Test calf birth case number format: CALF-YYYY-XXXXX"""
        calf_data = {
            "farmer_name": "Test Format Calf",
            "farmer_village": "Test Village",
            "dam_tag_number": f"DAM-FMT-{datetime.now().strftime('%H%M%S')}",
            "dam_species": "cattle",
            "actual_birth_date": datetime.now().strftime("%Y-%m-%d"),
            "calf_sex": "male",
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/calf-birth", headers=vet_headers, json=calf_data)
        assert response.status_code == 200
        
        data = response.json()
        parts = data["case_number"].split("-")
        assert len(parts) == 3, f"Case number should have 3 parts, got {len(parts)}"
        assert parts[0] == "CALF", f"First part should be CALF, got {parts[0]}"
        
        print(f"SUCCESS: Calf birth case number format verified - {data['case_number']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
