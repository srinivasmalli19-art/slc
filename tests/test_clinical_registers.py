"""
Test Clinical Registers (Surgical, Gynaecology, Castration) and GVA Module
Smart Livestock Care - Vet Batch 2 Testing
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smartlivestock-2.preview.emergentagent.com').rstrip('/')

# Test credentials
VET_CREDENTIALS = {
    "phone": "9111222333",
    "password": "test123",
    "role": "veterinarian"
}

class TestVetAuthentication:
    """Test vet authentication for clinical registers"""
    
    def test_vet_login_success(self):
        """Test vet login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=VET_CREDENTIALS)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "veterinarian"
        print(f"✓ Vet login successful - User: {data['user']['name']}")
        return data["access_token"]


class TestSurgicalRegister:
    """Test Surgical Case Register APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=VET_CREDENTIALS)
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_surgical_cases_list(self):
        """Test GET /api/vet/surgical - list all surgical cases"""
        response = requests.get(f"{BASE_URL}/api/vet/surgical", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET surgical cases - Found {len(data)} cases")
        return data
    
    def test_create_surgical_case(self):
        """Test POST /api/vet/surgical - create new surgical case"""
        payload = {
            "tag_number": "TEST-SURG-001",
            "farmer_name": "Test Farmer Surgical",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543210",
            "species": "cattle",
            "breed": "Holstein",
            "age_months": 36,
            "surgery_type": "caesarean",
            "pre_op_condition": "Animal in labor for 12 hours, cervix fully dilated, fetus in abnormal position",
            "anesthesia_type": "epidural",
            "anesthesia_details": "Lignocaine 2% - 10ml epidural",
            "surgical_procedure": "Left flank laparotomy, uterine incision, calf extraction, uterine closure in 2 layers",
            "findings": "Live male calf, uterus healthy, no adhesions",
            "post_op_care": "Antibiotics for 5 days, anti-inflammatory, wound dressing daily",
            "outcome": "successful",
            "follow_up_date": "2026-01-18",
            "remarks": "TEST case for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/vet/surgical", json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "case_number" in data
        assert data["case_number"].startswith("SURG-")
        assert data["tag_number"] == payload["tag_number"]
        assert data["surgery_type"] == payload["surgery_type"]
        assert data["outcome"] == payload["outcome"]
        assert "vet_name" in data
        assert "surgery_date" in data
        
        print(f"✓ Created surgical case: {data['case_number']}")
        return data
    
    def test_get_surgical_case_by_id(self):
        """Test GET /api/vet/surgical/{case_id} - get specific case"""
        # First create a case
        create_payload = {
            "tag_number": "TEST-SURG-002",
            "farmer_name": "Test Farmer 2",
            "species": "buffalo",
            "surgery_type": "rumenotomy",
            "pre_op_condition": "Foreign body ingestion suspected",
            "anesthesia_type": "local",
            "surgical_procedure": "Left flank rumenotomy, foreign body removal",
            "outcome": "successful"
        }
        create_response = requests.post(f"{BASE_URL}/api/vet/surgical", json=create_payload, headers=self.headers)
        created_case = create_response.json()
        case_id = created_case["id"]
        
        # Get the case by ID
        response = requests.get(f"{BASE_URL}/api/vet/surgical/{case_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id
        assert data["tag_number"] == create_payload["tag_number"]
        print(f"✓ GET surgical case by ID: {data['case_number']}")
    
    def test_filter_surgical_by_species(self):
        """Test filtering surgical cases by species"""
        response = requests.get(f"{BASE_URL}/api/vet/surgical?species=cattle", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for case in data:
            assert case["species"] == "cattle"
        print(f"✓ Filter surgical by species=cattle - Found {len(data)} cases")
    
    def test_filter_surgical_by_outcome(self):
        """Test filtering surgical cases by outcome"""
        response = requests.get(f"{BASE_URL}/api/vet/surgical?outcome=successful", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for case in data:
            assert case["outcome"] == "successful"
        print(f"✓ Filter surgical by outcome=successful - Found {len(data)} cases")


class TestGynaecologyRegister:
    """Test Gynaecology Case Register APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=VET_CREDENTIALS)
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_gynaecology_cases_list(self):
        """Test GET /api/vet/gynaecology - list all gynaecology cases"""
        response = requests.get(f"{BASE_URL}/api/vet/gynaecology", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET gynaecology cases - Found {len(data)} cases")
        return data
    
    def test_create_gynaecology_case(self):
        """Test POST /api/vet/gynaecology - create new gynaecology case"""
        payload = {
            "tag_number": "TEST-GYN-001",
            "farmer_name": "Test Farmer Gyn",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543211",
            "species": "cattle",
            "breed": "Jersey",
            "age_months": 48,
            "parity": 2,
            "last_calving_date": "2025-06-15",
            "breeding_history": "3 AI attempts, no conception",
            "condition": "repeat_breeder",
            "symptoms": "Regular estrus cycles, no conception after multiple AI",
            "per_rectal_findings": "Uterus normal tone, both ovaries palpable, CL present on right ovary",
            "diagnosis": "Repeat breeder - possible subclinical endometritis",
            "treatment": "Intrauterine infusion with Lugol's iodine, GnRH injection",
            "prognosis": "Good",
            "follow_up_date": "2026-01-25",
            "result": "ongoing",
            "remarks": "TEST case for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/vet/gynaecology", json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "case_number" in data
        assert data["case_number"].startswith("GYN-")
        assert data["tag_number"] == payload["tag_number"]
        assert data["condition"] == payload["condition"]
        assert data["result"] == payload["result"]
        assert "vet_name" in data
        assert "case_date" in data
        
        print(f"✓ Created gynaecology case: {data['case_number']}")
        return data
    
    def test_get_gynaecology_case_by_id(self):
        """Test GET /api/vet/gynaecology/{case_id} - get specific case"""
        # First create a case
        create_payload = {
            "tag_number": "TEST-GYN-002",
            "farmer_name": "Test Farmer Gyn 2",
            "species": "buffalo",
            "condition": "anoestrus",
            "symptoms": "No heat signs for 6 months post-calving",
            "diagnosis": "True anoestrus - inactive ovaries",
            "treatment": "GnRH + PGF2α protocol",
            "result": "ongoing"
        }
        create_response = requests.post(f"{BASE_URL}/api/vet/gynaecology", json=create_payload, headers=self.headers)
        created_case = create_response.json()
        case_id = created_case["id"]
        
        # Get the case by ID
        response = requests.get(f"{BASE_URL}/api/vet/gynaecology/{case_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id
        assert data["tag_number"] == create_payload["tag_number"]
        print(f"✓ GET gynaecology case by ID: {data['case_number']}")
    
    def test_filter_gynaecology_by_condition(self):
        """Test filtering gynaecology cases by condition"""
        response = requests.get(f"{BASE_URL}/api/vet/gynaecology?condition=repeat_breeder", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for case in data:
            assert case["condition"] == "repeat_breeder"
        print(f"✓ Filter gynaecology by condition=repeat_breeder - Found {len(data)} cases")


class TestCastrationRegister:
    """Test Castration Case Register APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=VET_CREDENTIALS)
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_castration_cases_list(self):
        """Test GET /api/vet/castration - list all castration cases"""
        response = requests.get(f"{BASE_URL}/api/vet/castration", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET castration cases - Found {len(data)} cases")
        return data
    
    def test_create_castration_case(self):
        """Test POST /api/vet/castration - create new castration case"""
        payload = {
            "tag_number": "TEST-CAST-001",
            "farmer_name": "Test Farmer Cast",
            "farmer_village": "Test Village",
            "farmer_phone": "9876543212",
            "species": "cattle",
            "breed": "Ongole",
            "age_months": 18,
            "body_weight_kg": 250,
            "method": "burdizzo",
            "anesthesia_used": "local",
            "anesthesia_details": "Lignocaine 2% - 5ml per cord",
            "procedure_details": "Burdizzo applied to each spermatic cord for 30 seconds",
            "outcome": "successful",
            "post_op_care": "Anti-inflammatory for 3 days, monitor for swelling",
            "follow_up_date": "2026-01-20",
            "remarks": "TEST case for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/vet/castration", json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "case_number" in data
        assert data["case_number"].startswith("CAST-")
        assert data["tag_number"] == payload["tag_number"]
        assert data["method"] == payload["method"]
        assert data["outcome"] == payload["outcome"]
        assert "vet_name" in data
        assert "castration_date" in data
        
        print(f"✓ Created castration case: {data['case_number']}")
        return data
    
    def test_get_castration_case_by_id(self):
        """Test GET /api/vet/castration/{case_id} - get specific case"""
        # First create a case
        create_payload = {
            "tag_number": "TEST-CAST-002",
            "farmer_name": "Test Farmer Cast 2",
            "species": "goat",
            "method": "rubber_ring",
            "anesthesia_used": "none",
            "outcome": "successful"
        }
        create_response = requests.post(f"{BASE_URL}/api/vet/castration", json=create_payload, headers=self.headers)
        created_case = create_response.json()
        case_id = created_case["id"]
        
        # Get the case by ID
        response = requests.get(f"{BASE_URL}/api/vet/castration/{case_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id
        assert data["tag_number"] == create_payload["tag_number"]
        print(f"✓ GET castration case by ID: {data['case_number']}")
    
    def test_filter_castration_by_method(self):
        """Test filtering castration cases by method"""
        response = requests.get(f"{BASE_URL}/api/vet/castration?method=burdizzo", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for case in data:
            assert case["method"] == "burdizzo"
        print(f"✓ Filter castration by method=burdizzo - Found {len(data)} cases")


class TestGVAModule:
    """Test GVA & Economic Analysis Module APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=VET_CREDENTIALS)
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_gva_reports_list(self):
        """Test GET /api/gva/reports - list all GVA reports"""
        response = requests.get(f"{BASE_URL}/api/gva/reports", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET GVA reports - Found {len(data)} reports")
        return data
    
    def test_calculate_gva(self):
        """Test POST /api/gva/calculate - calculate GVA"""
        payload = {
            "cattle_count": 100,
            "buffalo_count": 50,
            "sheep_count": 200,
            "goat_count": 150,
            "poultry_count": 500,
            "avg_milk_yield_per_day": 8,
            "milk_price_per_litre": 45,
            "avg_live_weight_kg": 35,
            "meat_price_per_kg": 400,
            "eggs_per_bird_per_year": 280,
            "egg_price": 6,
            "poultry_meat_price_per_kg": 180,
            "village_name": "Test Village GVA",
            "mandal": "Test Mandal",
            "district": "Test District"
        }
        response = requests.post(f"{BASE_URL}/api/gva/calculate", json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "inputs" in data
        assert "results" in data
        assert "vet_name" in data
        assert "created_at" in data
        
        # Verify results structure
        results = data["results"]
        assert "milk_gva" in results
        assert "sheep_goat_gva" in results
        assert "buffalo_meat_gva" in results
        assert "poultry_meat_gva" in results
        assert "egg_gva" in results
        assert "total_village_gva" in results
        
        # Verify calculations are positive
        assert results["total_village_gva"] > 0
        
        print(f"✓ GVA calculated - Total Village GVA: ₹{results['total_village_gva']:,.0f}")
        return data
    
    def test_get_gva_report_by_id(self):
        """Test GET /api/gva/reports/{report_id} - get specific report"""
        # First create a report
        create_payload = {
            "cattle_count": 50,
            "buffalo_count": 25,
            "sheep_count": 100,
            "goat_count": 75,
            "poultry_count": 250,
            "avg_milk_yield_per_day": 6,
            "milk_price_per_litre": 40,
            "avg_live_weight_kg": 30,
            "meat_price_per_kg": 350,
            "eggs_per_bird_per_year": 250,
            "egg_price": 5,
            "poultry_meat_price_per_kg": 160,
            "village_name": "Test Village 2",
            "mandal": "Test Mandal 2",
            "district": "Test District 2"
        }
        create_response = requests.post(f"{BASE_URL}/api/gva/calculate", json=create_payload, headers=self.headers)
        created_report = create_response.json()
        report_id = created_report["id"]
        
        # Get the report by ID
        response = requests.get(f"{BASE_URL}/api/gva/reports/{report_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == report_id
        assert data["inputs"]["village_name"] == create_payload["village_name"]
        print(f"✓ GET GVA report by ID: {report_id[:8]}...")
    
    def test_download_gva_pdf(self):
        """Test GET /api/gva/reports/{report_id}/pdf - download PDF"""
        # First create a report
        create_payload = {
            "cattle_count": 30,
            "buffalo_count": 15,
            "sheep_count": 50,
            "goat_count": 40,
            "poultry_count": 100,
            "avg_milk_yield_per_day": 5,
            "milk_price_per_litre": 42,
            "avg_live_weight_kg": 28,
            "meat_price_per_kg": 380,
            "eggs_per_bird_per_year": 260,
            "egg_price": 5.5,
            "poultry_meat_price_per_kg": 170,
            "village_name": "PDF Test Village",
            "mandal": "PDF Mandal",
            "district": "PDF District"
        }
        create_response = requests.post(f"{BASE_URL}/api/gva/calculate", json=create_payload, headers=self.headers)
        created_report = create_response.json()
        report_id = created_report["id"]
        
        # Download PDF
        response = requests.get(f"{BASE_URL}/api/gva/reports/{report_id}/pdf", headers=self.headers)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        print(f"✓ GVA PDF downloaded - Size: {len(response.content)} bytes")


class TestCaseNumberFormats:
    """Test case number format validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=VET_CREDENTIALS)
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_surgical_case_number_format(self):
        """Verify surgical case number follows SURG-YYYY-XXXXX format"""
        payload = {
            "tag_number": "FORMAT-TEST-SURG",
            "farmer_name": "Format Test",
            "species": "cattle",
            "surgery_type": "dehorning",
            "pre_op_condition": "Routine dehorning",
            "anesthesia_type": "local",
            "surgical_procedure": "Dehorning with saw",
            "outcome": "successful"
        }
        response = requests.post(f"{BASE_URL}/api/vet/surgical", json=payload, headers=self.headers)
        data = response.json()
        
        # Verify format: SURG-YYYY-XXXXX
        case_number = data["case_number"]
        parts = case_number.split("-")
        assert parts[0] == "SURG"
        assert len(parts[1]) == 4  # Year
        assert len(parts[2]) == 5  # Serial number
        print(f"✓ Surgical case number format valid: {case_number}")
    
    def test_gynaecology_case_number_format(self):
        """Verify gynaecology case number follows GYN-YYYY-XXXXX format"""
        payload = {
            "tag_number": "FORMAT-TEST-GYN",
            "farmer_name": "Format Test",
            "species": "cattle",
            "condition": "pregnancy_diagnosis",
            "symptoms": "Routine PD check",
            "diagnosis": "Pregnant - 3 months",
            "treatment": "No treatment required",
            "result": "pregnant"
        }
        response = requests.post(f"{BASE_URL}/api/vet/gynaecology", json=payload, headers=self.headers)
        data = response.json()
        
        # Verify format: GYN-YYYY-XXXXX
        case_number = data["case_number"]
        parts = case_number.split("-")
        assert parts[0] == "GYN"
        assert len(parts[1]) == 4  # Year
        assert len(parts[2]) == 5  # Serial number
        print(f"✓ Gynaecology case number format valid: {case_number}")
    
    def test_castration_case_number_format(self):
        """Verify castration case number follows CAST-YYYY-XXXXX format"""
        payload = {
            "tag_number": "FORMAT-TEST-CAST",
            "farmer_name": "Format Test",
            "species": "sheep",
            "method": "rubber_ring",
            "anesthesia_used": "none",
            "outcome": "successful"
        }
        response = requests.post(f"{BASE_URL}/api/vet/castration", json=payload, headers=self.headers)
        data = response.json()
        
        # Verify format: CAST-YYYY-XXXXX
        case_number = data["case_number"]
        parts = case_number.split("-")
        assert parts[0] == "CAST"
        assert len(parts[1]) == 4  # Year
        assert len(parts[2]) == 5  # Serial number
        print(f"✓ Castration case number format valid: {case_number}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
