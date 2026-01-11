#!/usr/bin/env python3
"""
Smart Livestock Care (SLC) Backend API Testing Suite
Tests all core functionality including authentication, animals, vaccinations, diagnostics, etc.
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class SLCAPITester:
    def __init__(self, base_url="https://smartlivestock-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different roles
        self.test_users = {}  # Store created test users
        self.test_animals = {}  # Store created test animals
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials from review request
        self.test_credentials = [
            {"phone": "9876543210", "password": "test123", "role": "farmer"},
            {"phone": "9876543211", "password": "vet123", "role": "veterinarian"},
            {"phone": "9876543212", "password": "admin123", "role": "admin"}
        ]

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            if not success:
                print(f"    Expected {expected_status}, got {response.status_code}")
                if response_data:
                    print(f"    Response: {response_data}")
            
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            print(f"    Request failed: {str(e)}")
            return False, {"error": str(e)}

    def test_user_registration(self):
        """Test user registration for all roles"""
        print("\n🔍 Testing User Registration...")
        
        for cred in self.test_credentials:
            # Create unique test user
            timestamp = datetime.now().strftime("%H%M%S")
            test_user = {
                "name": f"Test {cred['role'].title()} {timestamp}",
                "phone": f"{cred['phone']}{timestamp[-2:]}",  # Make phone unique
                "password": cred['password'],
                "role": cred['role'],
                "village": "Test Village",
                "district": "Test District",
                "state": "Test State"
            }
            
            success, response = self.make_request('POST', 'auth/register', test_user, expected_status=200)
            
            if success:
                self.test_users[cred['role']] = test_user
                self.log_test(f"Register {cred['role']}", True, f"User ID: {response.get('id', 'N/A')}")
            else:
                self.log_test(f"Register {cred['role']}", False, f"Registration failed: {response}")

    def test_user_login(self):
        """Test user login for all roles"""
        print("\n🔍 Testing User Login...")
        
        for role, user_data in self.test_users.items():
            login_data = {
                "phone": user_data['phone'],
                "password": user_data['password'],
                "role": user_data['role']
            }
            
            success, response = self.make_request('POST', 'auth/login', login_data, expected_status=200)
            
            if success and 'access_token' in response:
                self.tokens[role] = response['access_token']
                self.log_test(f"Login {role}", True, f"Token received")
            else:
                self.log_test(f"Login {role}", False, f"Login failed: {response}")

    def test_guest_session(self):
        """Test guest session creation"""
        print("\n🔍 Testing Guest Session...")
        
        success, response = self.make_request('POST', 'auth/guest-session', expected_status=200)
        
        if success and 'access_token' in response:
            self.tokens['guest'] = response['access_token']
            self.log_test("Guest session", True, "Guest token received")
        else:
            self.log_test("Guest session", False, f"Guest session failed: {response}")

    def test_auth_me(self):
        """Test /auth/me endpoint for authenticated users"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        for role, token in self.tokens.items():
            if role == 'guest':
                continue  # Skip guest for /auth/me
                
            success, response = self.make_request('GET', 'auth/me', token=token, expected_status=200)
            
            if success and 'id' in response:
                self.log_test(f"Auth me - {role}", True, f"User: {response.get('name', 'N/A')}")
            else:
                self.log_test(f"Auth me - {role}", False, f"Auth me failed: {response}")

    def test_animals_crud(self):
        """Test animals CRUD operations"""
        print("\n🔍 Testing Animals CRUD...")
        
        # Test with farmer token
        farmer_token = self.tokens.get('farmer')
        if not farmer_token:
            self.log_test("Animals CRUD", False, "No farmer token available")
            return
        
        # Create animal
        animal_data = {
            "tag_id": f"TEST{datetime.now().strftime('%H%M%S')}",
            "species": "cattle",
            "breed": "Holstein",
            "age_months": 24,
            "gender": "female",
            "status": "healthy",
            "color": "black_white",
            "weight_kg": 450.5,
            "notes": "Test animal for API testing"
        }
        
        success, response = self.make_request('POST', 'animals', animal_data, farmer_token, expected_status=200)
        
        if success and 'id' in response:
            animal_id = response['id']
            self.test_animals['farmer'] = animal_id
            self.log_test("Create animal", True, f"Animal ID: {animal_id}")
            
            # Get animals list
            success, response = self.make_request('GET', 'animals', token=farmer_token, expected_status=200)
            if success and isinstance(response, list):
                self.log_test("Get animals list", True, f"Found {len(response)} animals")
            else:
                self.log_test("Get animals list", False, f"Failed to get animals: {response}")
            
            # Get specific animal
            success, response = self.make_request('GET', f'animals/{animal_id}', token=farmer_token, expected_status=200)
            if success and response.get('id') == animal_id:
                self.log_test("Get specific animal", True, f"Retrieved animal: {response.get('tag_id')}")
            else:
                self.log_test("Get specific animal", False, f"Failed to get animal: {response}")
                
        else:
            self.log_test("Create animal", False, f"Animal creation failed: {response}")

    def test_vaccinations_crud(self):
        """Test vaccinations CRUD operations"""
        print("\n🔍 Testing Vaccinations CRUD...")
        
        farmer_token = self.tokens.get('farmer')
        animal_id = self.test_animals.get('farmer')
        
        if not farmer_token or not animal_id:
            self.log_test("Vaccinations CRUD", False, "Missing farmer token or animal ID")
            return
        
        # Create vaccination
        vaccination_data = {
            "animal_id": animal_id,
            "vaccine_name": "FMD Vaccine",
            "batch_number": "BATCH123",
            "dose": "2ml",
            "administered_by": "Dr. Test Vet",
            "next_due_date": "2025-02-01",
            "remarks": "Routine vaccination"
        }
        
        success, response = self.make_request('POST', 'vaccinations', vaccination_data, farmer_token, expected_status=200)
        
        if success and 'id' in response:
            self.log_test("Create vaccination", True, f"Vaccination ID: {response['id']}")
            
            # Get vaccinations list
            success, response = self.make_request('GET', 'vaccinations', token=farmer_token, expected_status=200)
            if success and isinstance(response, list):
                self.log_test("Get vaccinations list", True, f"Found {len(response)} vaccinations")
            else:
                self.log_test("Get vaccinations list", False, f"Failed to get vaccinations: {response}")
        else:
            self.log_test("Create vaccination", False, f"Vaccination creation failed: {response}")

    def test_diagnostics_crud(self):
        """Test diagnostics CRUD operations (vet only)"""
        print("\n🔍 Testing Diagnostics CRUD...")
        
        vet_token = self.tokens.get('veterinarian')
        animal_id = self.test_animals.get('farmer')
        
        if not vet_token:
            self.log_test("Diagnostics CRUD", False, "No veterinarian token available")
            return
        
        if not animal_id:
            # Create a test animal for diagnostics if none exists
            animal_data = {
                "tag_id": f"DIAG{datetime.now().strftime('%H%M%S')}",
                "species": "cattle",
                "breed": "Test Breed",
                "age_months": 12,
                "gender": "male",
                "status": "healthy"
            }
            success, response = self.make_request('POST', 'animals', animal_data, vet_token, expected_status=200)
            if success:
                animal_id = response['id']
            else:
                self.log_test("Diagnostics CRUD", False, "Could not create test animal for diagnostics")
                return
        
        # Create diagnostic test
        diagnostic_data = {
            "animal_id": animal_id,
            "test_category": "blood",
            "test_type": "Hemoglobin",
            "species": "cattle",
            "value": 12.5,
            "unit": "g/dL",
            "symptoms": ["weakness", "pale_mucous_membranes"],
            "notes": "Routine blood test"
        }
        
        success, response = self.make_request('POST', 'diagnostics', diagnostic_data, vet_token, expected_status=200)
        
        if success and 'id' in response:
            self.log_test("Create diagnostic", True, f"Diagnostic ID: {response['id']}")
            
            # Get diagnostics list
            success, response = self.make_request('GET', 'diagnostics', token=vet_token, expected_status=200)
            if success and isinstance(response, list):
                self.log_test("Get diagnostics list", True, f"Found {len(response)} diagnostics")
            else:
                self.log_test("Get diagnostics list", False, f"Failed to get diagnostics: {response}")
        else:
            self.log_test("Create diagnostic", False, f"Diagnostic creation failed: {response}")

    def test_knowledge_center(self):
        """Test knowledge center endpoints"""
        print("\n🔍 Testing Knowledge Center...")
        
        vet_token = self.tokens.get('veterinarian')
        if not vet_token:
            self.log_test("Knowledge Center", False, "No veterinarian token available")
            return
        
        # Get knowledge center entries
        success, response = self.make_request('GET', 'knowledge-center', token=vet_token, expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("Get knowledge center", True, f"Found {len(response)} entries")
        else:
            self.log_test("Get knowledge center", False, f"Failed to get knowledge center: {response}")

    def test_guest_utilities(self):
        """Test guest utility endpoints"""
        print("\n🔍 Testing Guest Utilities...")
        
        # Test area calculator
        area_data = {
            "length": 10.5,
            "width": 8.2,
            "unit": "meters"
        }
        
        success, response = self.make_request('POST', 'utilities/area-calculator', area_data, expected_status=200)
        
        if success and 'area_sq_meters' in response:
            self.log_test("Area calculator", True, f"Area: {response['area_sq_meters']} sq meters")
        else:
            self.log_test("Area calculator", False, f"Area calculator failed: {response}")
        
        # Test interest calculator
        interest_data = {
            "principal": 100000,
            "rate": 8.5,
            "time_years": 2
        }
        
        success, response = self.make_request('POST', 'utilities/interest-calculator', interest_data, expected_status=200)
        
        if success and 'simple_interest' in response:
            self.log_test("Interest calculator", True, f"Simple Interest: {response['simple_interest']}")
        else:
            self.log_test("Interest calculator", False, f"Interest calculator failed: {response}")

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoints"""
        print("\n🔍 Testing Dashboard Stats...")
        
        # Test farmer stats
        farmer_token = self.tokens.get('farmer')
        if farmer_token:
            success, response = self.make_request('GET', 'dashboard/farmer-stats', token=farmer_token, expected_status=200)
            if success and 'total_animals' in response:
                self.log_test("Farmer dashboard stats", True, f"Animals: {response['total_animals']}")
            else:
                self.log_test("Farmer dashboard stats", False, f"Farmer stats failed: {response}")
        
        # Test vet stats
        vet_token = self.tokens.get('veterinarian')
        if vet_token:
            success, response = self.make_request('GET', 'dashboard/vet-stats', token=vet_token, expected_status=200)
            if success and 'total_diagnostics' in response:
                self.log_test("Vet dashboard stats", True, f"Diagnostics: {response['total_diagnostics']}")
            else:
                self.log_test("Vet dashboard stats", False, f"Vet stats failed: {response}")

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n🔍 Testing Admin Endpoints...")
        
        admin_token = self.tokens.get('admin')
        if not admin_token:
            self.log_test("Admin endpoints", False, "No admin token available")
            return
        
        # Test get all users
        success, response = self.make_request('GET', 'admin/users', token=admin_token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Admin get users", True, f"Found {len(response)} users")
        else:
            self.log_test("Admin get users", False, f"Admin get users failed: {response}")
        
        # Test admin stats
        success, response = self.make_request('GET', 'admin/stats', token=admin_token, expected_status=200)
        if success and 'total_users' in response:
            self.log_test("Admin stats", True, f"Total users: {response['total_users']}")
        else:
            self.log_test("Admin stats", False, f"Admin stats failed: {response}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SLC Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test sequence
        self.test_user_registration()
        self.test_user_login()
        self.test_guest_session()
        self.test_auth_me()
        self.test_animals_crud()
        self.test_vaccinations_crud()
        self.test_diagnostics_crud()
        self.test_knowledge_center()
        self.test_guest_utilities()
        self.test_dashboard_stats()
        self.test_admin_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = SLCAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())