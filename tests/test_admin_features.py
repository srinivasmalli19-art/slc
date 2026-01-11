"""
Admin Module Batch 1 - Backend API Tests
Tests for: Admin Dashboard, User Management, Audit Logs, Safety Rules, Institution Management
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_PHONE = "9876543212"
ADMIN_PASSWORD = "admin123"
ADMIN_ROLE = "admin"

# Test user IDs from context
TEST_FARMER_ID = "23e1e053-b6a5-4d49-b42c-fa291a4d1bbf"
TEST_VET_ID = "73713767-231f-4eac-9a02-364ef26f5d58"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful - User: {data['user']['name']}")
        return data["access_token"]
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": "wrongpassword",
            "role": ADMIN_ROLE
        })
        assert response.status_code == 401
        print("✓ Admin login with wrong password returns 401")
    
    def test_admin_login_wrong_role(self):
        """Test admin login with wrong role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": "farmer"
        })
        assert response.status_code == 401
        print("✓ Admin login with wrong role returns 401")


class TestAdminDashboard:
    """Admin Dashboard API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_dashboard_stats(self):
        """Test admin dashboard statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200, f"Dashboard stats failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "users" in data
        assert "animals" in data
        assert "institutions" in data
        assert "knowledge_center" in data
        assert "safety" in data
        assert "activity" in data
        
        # Verify user counts structure
        assert "total_farmers" in data["users"]
        assert "total_paravets" in data["users"]
        assert "total_vets" in data["users"]
        
        print(f"✓ Dashboard stats - Farmers: {data['users']['total_farmers']}, Vets: {data['users']['total_vets']}, Animals: {data['animals']['total']}")
    
    def test_get_admin_alerts(self):
        """Test admin alerts endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/alerts", headers=self.headers)
        assert response.status_code == 200, f"Admin alerts failed: {response.text}"
        data = response.json()
        
        assert "alerts" in data
        assert "total" in data
        assert isinstance(data["alerts"], list)
        
        print(f"✓ Admin alerts - Total: {data['total']}")
        for alert in data["alerts"][:3]:
            print(f"  - {alert.get('type')}: {alert.get('title')}")


class TestUserManagement:
    """User Management API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_all_users(self):
        """Test get all users endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200, f"Get users failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0, "No users found"
        
        # Verify user structure
        user = data[0]
        assert "id" in user
        assert "name" in user
        assert "phone" in user
        assert "role" in user
        
        print(f"✓ Get all users - Total: {len(data)}")
    
    def test_get_users_by_role_farmer(self):
        """Test filter users by farmer role"""
        response = requests.get(f"{BASE_URL}/api/admin/users?role=farmer", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        for user in data:
            assert user["role"] == "farmer"
        
        print(f"✓ Filter by farmer role - Count: {len(data)}")
    
    def test_get_users_by_role_veterinarian(self):
        """Test filter users by veterinarian role"""
        response = requests.get(f"{BASE_URL}/api/admin/users?role=veterinarian", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        for user in data:
            assert user["role"] == "veterinarian"
        
        print(f"✓ Filter by veterinarian role - Count: {len(data)}")
    
    def test_search_users(self):
        """Test search users functionality"""
        response = requests.get(f"{BASE_URL}/api/admin/users?search=test", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        print(f"✓ Search users - Results: {len(data)}")
    
    def test_get_user_detail(self):
        """Test get user detail endpoint"""
        # First get a user ID
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = response.json()
        
        if len(users) > 0:
            # Find a non-admin user
            test_user = None
            for u in users:
                if u["role"] != "admin":
                    test_user = u
                    break
            
            if test_user:
                user_id = test_user["id"]
                response = requests.get(f"{BASE_URL}/api/admin/users/{user_id}", headers=self.headers)
                assert response.status_code == 200, f"Get user detail failed: {response.text}"
                data = response.json()
                
                assert data["id"] == user_id
                assert "name" in data
                assert "role" in data
                
                print(f"✓ Get user detail - User: {data['name']} ({data['role']})")
    
    def test_activate_deactivate_user(self):
        """Test activate/deactivate user with reason"""
        # Get a non-admin user
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = response.json()
        
        test_user = None
        for u in users:
            if u["role"] == "farmer":
                test_user = u
                break
        
        if test_user:
            user_id = test_user["id"]
            
            # Deactivate user
            response = requests.put(
                f"{BASE_URL}/api/admin/users/{user_id}/status",
                params={"is_active": False, "reason": "TEST: Temporary deactivation for testing"},
                headers=self.headers
            )
            assert response.status_code == 200, f"Deactivate failed: {response.text}"
            print(f"✓ User deactivated with reason")
            
            # Reactivate user
            response = requests.put(
                f"{BASE_URL}/api/admin/users/{user_id}/status",
                params={"is_active": True, "reason": "TEST: Reactivation after testing"},
                headers=self.headers
            )
            assert response.status_code == 200, f"Activate failed: {response.text}"
            print(f"✓ User reactivated with reason")
    
    def test_lock_unlock_user(self):
        """Test lock/unlock user account"""
        # Get a non-admin user
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = response.json()
        
        test_user = None
        for u in users:
            if u["role"] == "farmer":
                test_user = u
                break
        
        if test_user:
            user_id = test_user["id"]
            
            # Lock user
            response = requests.put(
                f"{BASE_URL}/api/admin/users/{user_id}/lock",
                params={"locked": True, "reason": "TEST: Temporary lock for testing"},
                headers=self.headers
            )
            assert response.status_code == 200, f"Lock failed: {response.text}"
            print(f"✓ User locked with reason")
            
            # Unlock user
            response = requests.put(
                f"{BASE_URL}/api/admin/users/{user_id}/lock",
                params={"locked": False},
                headers=self.headers
            )
            assert response.status_code == 200, f"Unlock failed: {response.text}"
            print(f"✓ User unlocked")


class TestAuditLogs:
    """Audit Logs API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_audit_logs(self):
        """Test get all audit logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=self.headers)
        assert response.status_code == 200, f"Get audit logs failed: {response.text}"
        data = response.json()
        
        assert "logs" in data
        assert "total" in data
        
        print(f"✓ Get audit logs - Total: {data['total']}")
        
        if len(data["logs"]) > 0:
            log = data["logs"][0]
            assert "id" in log
            assert "action_type" in log
            assert "target_type" in log
            assert "timestamp" in log
            print(f"  - Latest: {log['action_type']} on {log['target_type']}")
    
    def test_filter_audit_logs_by_action_type(self):
        """Test filter audit logs by action type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/audit-logs?action_type=user_activate",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        for log in data["logs"]:
            assert log["action_type"] == "user_activate"
        
        print(f"✓ Filter by action_type - Results: {data['total']}")
    
    def test_filter_audit_logs_by_target_type(self):
        """Test filter audit logs by target type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/audit-logs?target_type=user",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        for log in data["logs"]:
            assert log["target_type"] == "user"
        
        print(f"✓ Filter by target_type - Results: {data['total']}")


class TestSafetyRules:
    """Safety Rules API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_safety_rules(self):
        """Test get all safety rules"""
        response = requests.get(f"{BASE_URL}/api/admin/safety-rules", headers=self.headers)
        assert response.status_code == 200, f"Get safety rules failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Get safety rules - Total: {len(data)}")
    
    def test_create_safety_rule(self):
        """Test create new safety rule"""
        rule_data = {
            "disease_name": "TEST_Brucellosis",
            "species_affected": ["cattle", "buffalo", "goat"],
            "ppe_instructions": "Wear gloves, N95 mask, protective eyewear, disposable gown",
            "isolation_protocols": "Isolate affected animals immediately, restrict movement",
            "milk_meat_restriction": "Do not consume milk or meat from affected animals for 21 days",
            "disposal_procedures": "Deep burial or incineration of carcasses, disinfect premises",
            "government_reporting": "Report to District Animal Husbandry Officer within 24 hours",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/safety-rules",
            json=rule_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Create safety rule failed: {response.text}"
        data = response.json()
        
        assert data["disease_name"] == "TEST_Brucellosis"
        assert "id" in data
        assert data["version"] == 1
        
        print(f"✓ Created safety rule - ID: {data['id']}")
        return data["id"]
    
    def test_update_safety_rule(self):
        """Test update existing safety rule"""
        # First create a rule
        rule_data = {
            "disease_name": "TEST_Anthrax_Update",
            "species_affected": ["cattle"],
            "ppe_instructions": "Initial PPE instructions",
            "isolation_protocols": "Initial isolation",
            "milk_meat_restriction": "Initial restriction",
            "disposal_procedures": "Initial disposal",
            "government_reporting": "Initial reporting",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/safety-rules",
            json=rule_data,
            headers=self.headers
        )
        assert response.status_code == 200
        rule_id = response.json()["id"]
        
        # Update the rule
        updated_data = {
            "disease_name": "TEST_Anthrax_Update",
            "species_affected": ["cattle", "sheep"],
            "ppe_instructions": "Updated PPE instructions - Full hazmat suit required",
            "isolation_protocols": "Updated isolation - 500m radius",
            "milk_meat_restriction": "Updated restriction - 30 days",
            "disposal_procedures": "Updated disposal - Incineration only",
            "government_reporting": "Updated reporting - Immediate notification",
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/safety-rules/{rule_id}",
            json=updated_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Update safety rule failed: {response.text}"
        data = response.json()
        
        assert data["version"] == 2
        assert "sheep" in data["species_affected"]
        
        print(f"✓ Updated safety rule - Version: {data['version']}")


class TestInstitutionManagement:
    """Institution Management API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_institutions(self):
        """Test get all institutions"""
        response = requests.get(f"{BASE_URL}/api/vet/institutions", headers=self.headers)
        assert response.status_code == 200, f"Get institutions failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Get institutions - Total: {len(data)}")
        
        if len(data) > 0:
            inst = data[0]
            assert "id" in inst
            assert "institution_name" in inst
            assert "is_verified" in inst
    
    def test_verify_institution(self):
        """Test verify/revoke institution verification"""
        # Get institutions
        response = requests.get(f"{BASE_URL}/api/vet/institutions", headers=self.headers)
        institutions = response.json()
        
        if len(institutions) > 0:
            inst_id = institutions[0]["id"]
            
            # Verify institution
            response = requests.put(
                f"{BASE_URL}/api/admin/institutions/{inst_id}/verify",
                params={"verified": True, "remarks": "TEST: Verified for testing"},
                headers=self.headers
            )
            assert response.status_code == 200, f"Verify institution failed: {response.text}"
            print(f"✓ Institution verified")
            
            # Revoke verification
            response = requests.put(
                f"{BASE_URL}/api/admin/institutions/{inst_id}/verify",
                params={"verified": False, "remarks": "TEST: Revoked for testing"},
                headers=self.headers
            )
            assert response.status_code == 200, f"Revoke verification failed: {response.text}"
            print(f"✓ Institution verification revoked")


class TestAdminStats:
    """Test admin stats endpoint (legacy)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD,
            "role": ADMIN_ROLE
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_admin_stats(self):
        """Test legacy admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200, f"Admin stats failed: {response.text}"
        data = response.json()
        
        assert "total_users" in data
        assert "total_animals" in data
        
        print(f"✓ Admin stats - Users: {data['total_users']}, Animals: {data['total_animals']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
