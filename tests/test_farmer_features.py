"""
Test suite for Smart Livestock Care (SLC) - Farmer Features
Tests: Authentication, Animals CRUD, Vaccinations, Deworming, Breeding, Utilities
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smartlivestock-2.preview.emergentagent.com')

# Test credentials
FARMER_PHONE = "9876543210"
FARMER_PASSWORD = "test123"
FARMER_ROLE = "farmer"


class TestFarmerAuthentication:
    """Test farmer login and authentication"""
    
    def test_farmer_login_success(self):
        """Test successful farmer login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": FARMER_PHONE,
            "password": FARMER_PASSWORD,
            "role": FARMER_ROLE
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["phone"] == FARMER_PHONE
        assert data["user"]["role"] == FARMER_ROLE
        assert data["token_type"] == "bearer"
    
    def test_farmer_login_invalid_password(self):
        """Test login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": FARMER_PHONE,
            "password": "wrongpassword",
            "role": FARMER_ROLE
        })
        assert response.status_code == 401
    
    def test_farmer_login_invalid_role(self):
        """Test login with wrong role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": FARMER_PHONE,
            "password": FARMER_PASSWORD,
            "role": "veterinarian"  # Wrong role
        })
        assert response.status_code == 401
    
    def test_get_current_user(self, auth_token):
        """Test getting current user profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == FARMER_PHONE
        assert data["role"] == FARMER_ROLE


class TestFarmerDashboard:
    """Test farmer dashboard stats"""
    
    def test_get_farmer_stats(self, auth_token):
        """Test getting farmer dashboard statistics"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/farmer-stats", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_animals" in data
        assert "total_vaccinations" in data
        assert "total_deworming" in data
        assert "total_breeding" in data


class TestAnimalsCRUD:
    """Test Animals CRUD operations"""
    
    def test_create_animal(self, auth_token):
        """Test creating a new animal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        tag_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        
        animal_data = {
            "tag_id": tag_id,
            "species": "buffalo",
            "breed": "Murrah",
            "age_months": 24,
            "gender": "female",
            "status": "milking",
            "color": "Black",
            "weight_kg": 450.5,
            "notes": "Test animal for automated testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/animals", json=animal_data, headers=headers)
        assert response.status_code == 200, f"Create animal failed: {response.text}"
        
        data = response.json()
        assert data["tag_id"] == tag_id
        assert data["species"] == "buffalo"
        assert data["breed"] == "Murrah"
        assert data["age_months"] == 24
        assert "id" in data
        
        # Store for cleanup
        return data["id"]
    
    def test_get_all_animals(self, auth_token):
        """Test getting all animals for farmer"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/animals", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_animals_by_species(self, auth_token):
        """Test filtering animals by species"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/animals?species=buffalo", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned animals should be buffalo
        for animal in data:
            assert animal["species"] == "buffalo"
    
    def test_create_and_get_animal(self, auth_token):
        """Test creating animal and verifying persistence"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        tag_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        
        # Create
        animal_data = {
            "tag_id": tag_id,
            "species": "cattle",
            "breed": "Holstein Friesian",
            "age_months": 36,
            "gender": "female",
            "status": "pregnant"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/animals", json=animal_data, headers=headers)
        assert create_response.status_code == 200
        created = create_response.json()
        animal_id = created["id"]
        
        # Get by ID to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/animals/{animal_id}", headers=headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        
        assert fetched["tag_id"] == tag_id
        assert fetched["species"] == "cattle"
        assert fetched["breed"] == "Holstein Friesian"
    
    def test_update_animal(self, auth_token):
        """Test updating an animal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        tag_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        
        # Create first
        animal_data = {
            "tag_id": tag_id,
            "species": "goat",
            "breed": "Jamunapari",
            "age_months": 12,
            "gender": "male",
            "status": "healthy"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/animals", json=animal_data, headers=headers)
        assert create_response.status_code == 200
        animal_id = create_response.json()["id"]
        
        # Update
        updated_data = {
            "tag_id": tag_id,
            "species": "goat",
            "breed": "Jamunapari",
            "age_months": 18,  # Updated age
            "gender": "male",
            "status": "breeding",  # Updated status
            "weight_kg": 45.0  # Added weight
        }
        
        update_response = requests.put(f"{BASE_URL}/api/animals/{animal_id}", json=updated_data, headers=headers)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/animals/{animal_id}", headers=headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        
        assert fetched["age_months"] == 18
        assert fetched["status"] == "breeding"
        assert fetched["weight_kg"] == 45.0
    
    def test_delete_animal(self, auth_token):
        """Test deleting an animal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        tag_id = f"TEST-DEL-{uuid.uuid4().hex[:8].upper()}"
        
        # Create first
        animal_data = {
            "tag_id": tag_id,
            "species": "sheep",
            "breed": "Deccani",
            "age_months": 6,
            "gender": "female",
            "status": "healthy"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/animals", json=animal_data, headers=headers)
        assert create_response.status_code == 200
        animal_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/animals/{animal_id}", headers=headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/animals/{animal_id}", headers=headers)
        assert get_response.status_code == 404


class TestVaccinations:
    """Test Vaccination records"""
    
    def test_create_vaccination(self, auth_token, test_animal_id):
        """Test creating a vaccination record"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        vaccination_data = {
            "animal_id": test_animal_id,
            "vaccine_name": "FMD (Foot and Mouth Disease)",
            "batch_number": "BATCH-2024-001",
            "dose": "2ml",
            "administered_by": "Dr. Test Vet",
            "next_due_date": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
            "remarks": "Test vaccination record"
        }
        
        response = requests.post(f"{BASE_URL}/api/vaccinations", json=vaccination_data, headers=headers)
        assert response.status_code == 200, f"Create vaccination failed: {response.text}"
        
        data = response.json()
        assert data["animal_id"] == test_animal_id
        assert data["vaccine_name"] == "FMD (Foot and Mouth Disease)"
        assert "id" in data
        assert "date" in data
    
    def test_get_vaccinations(self, auth_token):
        """Test getting all vaccination records"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/vaccinations", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_vaccinations_by_animal(self, auth_token, test_animal_id):
        """Test getting vaccinations for specific animal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/vaccinations?animal_id={test_animal_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestDeworming:
    """Test Deworming records"""
    
    def test_create_deworming(self, auth_token, test_animal_id):
        """Test creating a deworming record"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        deworming_data = {
            "animal_id": test_animal_id,
            "drug_name": "Albendazole",
            "dose": "10ml",
            "administered_by": "Self",
            "next_due_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
            "remarks": "Routine deworming"
        }
        
        response = requests.post(f"{BASE_URL}/api/deworming", json=deworming_data, headers=headers)
        assert response.status_code == 200, f"Create deworming failed: {response.text}"
        
        data = response.json()
        assert data["animal_id"] == test_animal_id
        assert data["drug_name"] == "Albendazole"
        assert "id" in data
        assert "date" in data
    
    def test_get_deworming_records(self, auth_token):
        """Test getting all deworming records"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/deworming", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestBreeding:
    """Test Breeding/AI records"""
    
    def test_create_breeding_natural(self, auth_token, test_animal_id):
        """Test creating a natural breeding record"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        breeding_data = {
            "animal_id": test_animal_id,
            "breeding_type": "natural",
            "sire_details": "Local bull - Tag: BULL-001",
            "expected_calving": (datetime.now() + timedelta(days=280)).strftime("%Y-%m-%d"),
            "remarks": "Natural breeding"
        }
        
        response = requests.post(f"{BASE_URL}/api/breeding", json=breeding_data, headers=headers)
        assert response.status_code == 200, f"Create breeding failed: {response.text}"
        
        data = response.json()
        assert data["animal_id"] == test_animal_id
        assert data["breeding_type"] == "natural"
        assert "id" in data
    
    def test_create_breeding_ai(self, auth_token, test_animal_id):
        """Test creating an AI breeding record"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        breeding_data = {
            "animal_id": test_animal_id,
            "breeding_type": "AI",
            "semen_batch": "SEMEN-2024-HF-001",
            "inseminator": "Dr. AI Technician",
            "expected_calving": (datetime.now() + timedelta(days=280)).strftime("%Y-%m-%d"),
            "remarks": "Artificial Insemination"
        }
        
        response = requests.post(f"{BASE_URL}/api/breeding", json=breeding_data, headers=headers)
        assert response.status_code == 200, f"Create AI breeding failed: {response.text}"
        
        data = response.json()
        assert data["breeding_type"] == "AI"
        assert data["semen_batch"] == "SEMEN-2024-HF-001"
    
    def test_get_breeding_records(self, auth_token):
        """Test getting all breeding records"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/breeding", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestUtilities:
    """Test utility calculators (Area, Interest)"""
    
    def test_area_calculator_feet(self, auth_token):
        """Test area calculator with feet"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        data = {
            "length": 100,
            "width": 50,
            "unit": "feet"
        }
        
        response = requests.post(f"{BASE_URL}/api/utilities/area-calculator", json=data, headers=headers)
        assert response.status_code == 200, f"Area calculator failed: {response.text}"
        
        result = response.json()
        assert "area_sq_feet" in result
        assert "area_sq_meters" in result
        assert "area_acres" in result
        assert "area_hectares" in result
        
        # Verify calculation: 100 * 50 = 5000 sq feet
        assert result["area_sq_feet"] == 5000
    
    def test_area_calculator_meters(self, auth_token):
        """Test area calculator with meters"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        data = {
            "length": 30,
            "width": 20,
            "unit": "meters"
        }
        
        response = requests.post(f"{BASE_URL}/api/utilities/area-calculator", json=data, headers=headers)
        assert response.status_code == 200
        
        result = response.json()
        # 30 * 20 = 600 sq meters
        assert result["area_sq_meters"] == 600
    
    def test_interest_calculator(self, auth_token):
        """Test interest calculator"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        data = {
            "principal": 100000,
            "rate": 7,
            "time_years": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/utilities/interest-calculator", json=data, headers=headers)
        assert response.status_code == 200, f"Interest calculator failed: {response.text}"
        
        result = response.json()
        assert "simple_interest" in result
        assert "simple_total" in result
        assert "compound_interest" in result
        assert "compound_total" in result
        
        # Verify simple interest: (100000 * 7 * 3) / 100 = 21000
        assert result["simple_interest"] == 21000
        assert result["simple_total"] == 121000


class TestAllSpecies:
    """Test animal creation for all species"""
    
    @pytest.mark.parametrize("species,breed", [
        ("cattle", "Holstein Friesian"),
        ("buffalo", "Murrah"),
        ("sheep", "Deccani"),
        ("goat", "Jamunapari"),
        ("pig", "Large White Yorkshire"),
        ("poultry", "Broiler"),
        ("dog", "German Shepherd"),
        ("cat", "Persian"),
        ("horse", "Marwari"),
        ("donkey", "Indian Donkey"),
        ("camel", "Bikaneri"),
    ])
    def test_create_animal_all_species(self, auth_token, species, breed):
        """Test creating animals for all supported species"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        tag_id = f"TEST-{species.upper()[:3]}-{uuid.uuid4().hex[:6].upper()}"
        
        animal_data = {
            "tag_id": tag_id,
            "species": species,
            "breed": breed,
            "age_months": 12,
            "gender": "female",
            "status": "healthy"
        }
        
        response = requests.post(f"{BASE_URL}/api/animals", json=animal_data, headers=headers)
        assert response.status_code == 200, f"Create {species} failed: {response.text}"
        
        data = response.json()
        assert data["species"] == species
        assert data["breed"] == breed


# Fixtures
@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for farmer"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": FARMER_PHONE,
        "password": FARMER_PASSWORD,
        "role": FARMER_ROLE
    })
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.text}")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def test_animal_id(auth_token):
    """Create a test animal for use in other tests"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    tag_id = f"TEST-FIXTURE-{uuid.uuid4().hex[:8].upper()}"
    
    animal_data = {
        "tag_id": tag_id,
        "species": "buffalo",
        "breed": "Murrah",
        "age_months": 36,
        "gender": "female",
        "status": "milking"
    }
    
    response = requests.post(f"{BASE_URL}/api/animals", json=animal_data, headers=headers)
    if response.status_code != 200:
        pytest.skip(f"Failed to create test animal: {response.text}")
    
    return response.json()["id"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
