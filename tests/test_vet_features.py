"""
Test suite for Smart Livestock Care (SLC) - Veterinarian Features (Phase 1)
Tests: Vet Login, Vet Profile, Institution Data, OPD Register
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VET_PHONE = "9876543211"
VET_PASSWORD = "vet123"
VET_ROLE = "veterinarian"

# High-risk zoonotic diseases for testing
HIGH_RISK_DISEASES = ["Brucellosis", "Anthrax", "Leptospirosis", "Tuberculosis", "Avian Influenza", "Rabies", "FMD"]


class TestVetAuth:
    """Veterinarian authentication tests"""
    
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
        assert data["user"]["role"] == VET_ROLE, f"Expected role {VET_ROLE}, got {data['user']['role']}"
        assert data["user"]["phone"] == VET_PHONE, f"Expected phone {VET_PHONE}, got {data['user']['phone']}"
        print(f"SUCCESS: Vet login successful - User: {data['user']['name']}")
    
    def test_vet_login_invalid_password(self):
        """Test vet login with invalid password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": VET_PHONE,
            "password": "wrongpassword",
            "role": VET_ROLE
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Invalid password returns 401")
    
    def test_vet_login_wrong_role(self):
        """Test vet login with wrong role returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": VET_PHONE,
            "password": VET_PASSWORD,
            "role": "farmer"  # Wrong role
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Wrong role returns 401")


@pytest.fixture
def vet_token():
    """Get vet authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": VET_PHONE,
        "password": VET_PASSWORD,
        "role": VET_ROLE
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Vet authentication failed - skipping authenticated tests")


@pytest.fixture
def vet_headers(vet_token):
    """Get headers with vet auth token"""
    return {
        "Authorization": f"Bearer {vet_token}",
        "Content-Type": "application/json"
    }


class TestVetProfile:
    """Vet Profile Register tests"""
    
    def test_get_vet_profile_initial(self, vet_headers):
        """Test getting vet profile (may be null initially)"""
        response = requests.get(f"{BASE_URL}/api/vet/profile", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"SUCCESS: Get vet profile - Response: {response.json()}")
    
    def test_create_vet_profile(self, vet_headers):
        """Test creating vet profile with mandatory fields"""
        # First check if profile exists
        check_response = requests.get(f"{BASE_URL}/api/vet/profile", headers=vet_headers)
        
        profile_data = {
            "registration_number": f"TEST-VET-REG-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "qualification": "BVSc & AH",
            "mobile_number": "9876543211",
            "institution_name": "Test Veterinary Hospital",
            "working_village": "Test Village",
            "mandal": "Test Mandal",
            "district": "Test District",
            "state": "Test State",
            "date_of_joining": "2024-01-15",
            "remarks": "Test profile created by automated tests"
        }
        
        if check_response.json() is None:
            # Create new profile
            response = requests.post(f"{BASE_URL}/api/vet/profile", headers=vet_headers, json=profile_data)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            data = response.json()
            assert "vet_id" in data, "Missing vet_id in response"
            assert data["registration_number"] == profile_data["registration_number"]
            assert data["qualification"] == profile_data["qualification"]
            assert data["is_complete"] == True, "Profile should be marked as complete"
            print(f"SUCCESS: Created vet profile - Vet ID: {data['vet_id']}")
        else:
            # Profile exists, try update
            print(f"INFO: Profile already exists, skipping create test")
    
    def test_update_vet_profile_cannot_change_registration(self, vet_headers):
        """Test that registration number cannot be changed once set"""
        # First get existing profile
        check_response = requests.get(f"{BASE_URL}/api/vet/profile", headers=vet_headers)
        
        if check_response.json() is None:
            pytest.skip("No profile exists to test update")
        
        existing_profile = check_response.json()
        
        # Try to update with different registration number
        update_data = {
            "registration_number": "CHANGED-REG-NUMBER",  # Try to change
            "qualification": existing_profile.get("qualification", "BVSc"),
            "mobile_number": existing_profile.get("mobile_number", "9876543211"),
        }
        
        response = requests.put(f"{BASE_URL}/api/vet/profile", headers=vet_headers, json=update_data)
        
        # Should fail with 400 if registration number is different
        if existing_profile.get("registration_number") and existing_profile["registration_number"] != "CHANGED-REG-NUMBER":
            assert response.status_code == 400, f"Expected 400 when changing registration number, got {response.status_code}"
            print("SUCCESS: Registration number cannot be changed once set")
        else:
            print("INFO: Registration number was not set or matches, update allowed")


class TestInstitution:
    """Institution Basic Data tests"""
    
    def test_get_institutions(self, vet_headers):
        """Test getting list of institutions"""
        response = requests.get(f"{BASE_URL}/api/vet/institutions", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of institutions"
        print(f"SUCCESS: Get institutions - Count: {len(data)}")
    
    def test_create_institution(self, vet_headers):
        """Test creating new institution with required fields"""
        institution_data = {
            "institution_name": f"TEST-Veterinary Hospital-{datetime.now().strftime('%H%M%S')}",
            "location": "Test Location",
            "mandal": "Test Mandal",
            "district": "Test District",
            "state": "Test State",
            "contact_number": "9876543210",
            "jurisdiction_villages": ["Village1", "Village2", "Village3"]
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/institution", headers=vet_headers, json=institution_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing id in response"
        assert data["institution_name"] == institution_data["institution_name"]
        assert data["is_verified"] == False, "New institution should not be verified"
        print(f"SUCCESS: Created institution - ID: {data['id']}")
        
        return data["id"]


class TestOPDRegister:
    """OPD Register tests"""
    
    def test_get_opd_cases_empty(self, vet_headers):
        """Test getting OPD cases (may be empty initially)"""
        response = requests.get(f"{BASE_URL}/api/vet/opd", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of OPD cases"
        print(f"SUCCESS: Get OPD cases - Count: {len(data)}")
    
    def test_create_opd_case(self, vet_headers):
        """Test creating new OPD case with all required fields"""
        case_data = {
            "tag_number": f"TEST-TAG-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543210",
            "species": "cattle",
            "breed": "Holstein Friesian",
            "age_months": 24,
            "symptoms": "Fever, loss of appetite, reduced milk yield",
            "tentative_diagnosis": "Mastitis",
            "treatment": "Antibiotic therapy - Ceftriaxone 1g IM",
            "result": "ongoing",
            "remarks": "Follow-up in 3 days"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/opd", headers=vet_headers, json=case_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing id in response"
        assert "case_number" in data, "Missing case_number in response"
        assert "serial_number" in data, "Missing serial_number in response"
        
        # Verify case number format: OPD-YYYY-XXXXX
        current_year = datetime.now().year
        assert data["case_number"].startswith(f"OPD-{current_year}-"), f"Case number should start with OPD-{current_year}-, got {data['case_number']}"
        
        print(f"SUCCESS: Created OPD case - Case Number: {data['case_number']}, Serial: {data['serial_number']}")
        return data
    
    def test_create_opd_case_zoonotic_disease(self, vet_headers):
        """Test creating OPD case with zoonotic disease diagnosis"""
        case_data = {
            "tag_number": f"TEST-ZOO-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Zoonotic",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543210",
            "species": "cattle",
            "breed": "Local",
            "age_months": 36,
            "symptoms": "Abortion, retained placenta, orchitis",
            "tentative_diagnosis": "Brucellosis",  # High-risk zoonotic disease
            "treatment": "Isolation, supportive care, notify authorities",
            "result": "ongoing",
            "remarks": "ZOONOTIC ALERT - Follow safety protocols"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/opd", headers=vet_headers, json=case_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["tentative_diagnosis"] == "Brucellosis"
        print(f"SUCCESS: Created OPD case with zoonotic disease - Case Number: {data['case_number']}")
    
    def test_filter_opd_by_species(self, vet_headers):
        """Test filtering OPD cases by species"""
        response = requests.get(f"{BASE_URL}/api/vet/opd?species=cattle", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # All returned cases should be cattle
        for case in data:
            assert case["species"] == "cattle", f"Expected cattle, got {case['species']}"
        
        print(f"SUCCESS: Filter OPD by species - Cattle cases: {len(data)}")
    
    def test_filter_opd_by_result(self, vet_headers):
        """Test filtering OPD cases by result"""
        response = requests.get(f"{BASE_URL}/api/vet/opd?result=ongoing", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # All returned cases should have ongoing result
        for case in data:
            assert case["result"] == "ongoing", f"Expected ongoing, got {case['result']}"
        
        print(f"SUCCESS: Filter OPD by result - Ongoing cases: {len(data)}")
    
    def test_get_single_opd_case(self, vet_headers):
        """Test getting a single OPD case by ID"""
        # First create a case
        case_data = {
            "tag_number": f"TEST-SINGLE-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Single",
            "farmer_village": "Test Village",
            "species": "buffalo",
            "symptoms": "Lameness",
            "tentative_diagnosis": "Foot rot",
            "treatment": "Foot bath, antibiotics",
            "result": "ongoing"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/vet/opd", headers=vet_headers, json=case_data)
        assert create_response.status_code == 200
        created_case = create_response.json()
        
        # Get the case by ID
        response = requests.get(f"{BASE_URL}/api/vet/opd/{created_case['id']}", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == created_case["id"]
        assert data["case_number"] == created_case["case_number"]
        print(f"SUCCESS: Get single OPD case - ID: {data['id']}")
    
    def test_update_opd_case(self, vet_headers):
        """Test updating an OPD case"""
        # First create a case
        case_data = {
            "tag_number": f"TEST-UPDATE-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Update",
            "farmer_village": "Test Village",
            "species": "goat",
            "symptoms": "Diarrhea",
            "tentative_diagnosis": "Enteritis",
            "treatment": "ORS, antibiotics",
            "result": "ongoing"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/vet/opd", headers=vet_headers, json=case_data)
        assert create_response.status_code == 200
        created_case = create_response.json()
        
        # Update the case
        update_data = {
            **case_data,
            "result": "recovered",
            "remarks": "Patient recovered after 5 days of treatment"
        }
        
        response = requests.put(f"{BASE_URL}/api/vet/opd/{created_case['id']}", headers=vet_headers, json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["result"] == "recovered"
        assert data["remarks"] == update_data["remarks"]
        print(f"SUCCESS: Updated OPD case - Result changed to: {data['result']}")


class TestVetDashboardStats:
    """Test vet dashboard statistics endpoints"""
    
    def test_get_auth_me(self, vet_headers):
        """Test getting current user info for dashboard"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=vet_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["role"] == VET_ROLE
        print(f"SUCCESS: Get current user - Name: {data['name']}, Role: {data['role']}")


class TestOPDCaseNumberFormat:
    """Test OPD case number format and yearly reset"""
    
    def test_case_number_format(self, vet_headers):
        """Test that case numbers follow OPD-YYYY-XXXXX format"""
        # Create a case
        case_data = {
            "tag_number": f"TEST-FORMAT-{datetime.now().strftime('%H%M%S')}",
            "farmer_name": "Test Farmer Format",
            "farmer_village": "Test Village",
            "species": "sheep",
            "symptoms": "Wool loss",
            "tentative_diagnosis": "Mange",
            "treatment": "Ivermectin injection",
            "result": "ongoing"
        }
        
        response = requests.post(f"{BASE_URL}/api/vet/opd", headers=vet_headers, json=case_data)
        assert response.status_code == 200
        
        data = response.json()
        case_number = data["case_number"]
        
        # Verify format: OPD-YYYY-XXXXX
        parts = case_number.split("-")
        assert len(parts) == 3, f"Case number should have 3 parts, got {len(parts)}"
        assert parts[0] == "OPD", f"First part should be OPD, got {parts[0]}"
        assert parts[1] == str(datetime.now().year), f"Second part should be current year"
        assert len(parts[2]) == 5, f"Third part should be 5 digits, got {len(parts[2])}"
        assert parts[2].isdigit(), f"Third part should be numeric, got {parts[2]}"
        
        print(f"SUCCESS: Case number format verified - {case_number}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
