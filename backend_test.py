#!/usr/bin/env python3
"""
Backend API Testing Suite for Timezone Converter
Tests all API endpoints with comprehensive scenarios
"""

import requests
import json
from datetime import datetime, timezone
import sys
import os

# Get backend URL from environment
BACKEND_URL = "https://timezone-bridge.preview.emergentagent.com/api"

class TimezoneAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data
        })
        
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_health_endpoint(self):
        """Test GET /api/health endpoint"""
        print("\n=== Testing Health Endpoint ===")
        
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['status', 'timestamp', 'version']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Health Check", False, f"Missing fields: {missing_fields}", data)
                elif data.get('status') != 'healthy':
                    self.log_test("Health Check", False, f"Status is not healthy: {data.get('status')}", data)
                else:
                    self.log_test("Health Check", True, "Server is healthy and responding correctly", data)
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
    
    def test_timezones_endpoint(self):
        """Test GET /api/timezones endpoint"""
        print("\n=== Testing Timezones Endpoint ===")
        
        try:
            response = self.session.get(f"{self.base_url}/timezones", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Timezones List", False, "Response is not a list", data)
                elif len(data) == 0:
                    self.log_test("Timezones List", False, "No timezones returned", data)
                else:
                    # Check first timezone structure
                    first_tz = data[0]
                    required_fields = ['value', 'label', 'city', 'offset', 'country']
                    missing_fields = [field for field in required_fields if field not in first_tz]
                    
                    if missing_fields:
                        self.log_test("Timezones Structure", False, f"Missing fields in timezone data: {missing_fields}", first_tz)
                    else:
                        # Check for major cities
                        major_cities = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles']
                        found_cities = [tz['value'] for tz in data if tz['value'] in major_cities]
                        
                        if len(found_cities) >= 4:
                            self.log_test("Timezones List", True, f"Found {len(data)} timezones with proper structure", {
                                'total_timezones': len(data),
                                'sample_timezone': first_tz,
                                'major_cities_found': found_cities
                            })
                        else:
                            self.log_test("Timezones List", False, f"Missing major cities. Found: {found_cities}", data[:3])
            else:
                self.log_test("Timezones List", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Timezones List", False, f"Request failed: {str(e)}")
    
    def test_major_cities_endpoint(self):
        """Test GET /api/major-cities-time endpoint"""
        print("\n=== Testing Major Cities Time Endpoint ===")
        
        try:
            response = self.session.get(f"{self.base_url}/major-cities-time", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if 'cities' not in data or 'timestamp' not in data:
                    self.log_test("Major Cities Structure", False, "Missing 'cities' or 'timestamp' field", data)
                elif not isinstance(data['cities'], list):
                    self.log_test("Major Cities Structure", False, "'cities' field is not a list", data)
                elif len(data['cities']) == 0:
                    self.log_test("Major Cities Structure", False, "No cities returned", data)
                else:
                    # Check first city structure
                    first_city = data['cities'][0]
                    required_fields = ['timezone', 'city', 'currentTime', 'formatted', 'date', 'offset']
                    missing_fields = [field for field in required_fields if field not in first_city]
                    
                    if missing_fields:
                        self.log_test("Major Cities Data", False, f"Missing fields in city data: {missing_fields}", first_city)
                    else:
                        # Verify timestamp is recent (within last minute)
                        try:
                            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
                            now = datetime.now(timezone.utc)
                            time_diff = abs((now - timestamp).total_seconds())
                            
                            if time_diff > 60:  # More than 1 minute old
                                self.log_test("Major Cities Timestamp", False, f"Timestamp is too old: {time_diff} seconds", data)
                            else:
                                self.log_test("Major Cities Time", True, f"Found {len(data['cities'])} cities with real-time data", {
                                    'cities_count': len(data['cities']),
                                    'sample_city': first_city,
                                    'timestamp_age_seconds': time_diff
                                })
                        except ValueError as e:
                            self.log_test("Major Cities Timestamp", False, f"Invalid timestamp format: {str(e)}", data)
            else:
                self.log_test("Major Cities Time", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Major Cities Time", False, f"Request failed: {str(e)}")
    
    def test_timezone_conversion(self):
        """Test POST /api/convert-timezone endpoint"""
        print("\n=== Testing Timezone Conversion Endpoint ===")
        
        # Test Case 1: Convert from America/New_York to Europe/London using current time
        current_time = datetime.now().isoformat()
        test_data_1 = {
            "datetime": current_time,
            "sourceTimezone": "America/New_York",
            "targetTimezone": "Europe/London"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/convert-timezone",
                json=test_data_1,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ['sourceTime', 'targetTime']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Conversion NYC->London", False, f"Missing fields: {missing_fields}", data)
                else:
                    # Check sourceTime and targetTime structure
                    time_fields = ['datetime', 'timezone', 'formatted', 'city', 'offset']
                    source_missing = [field for field in time_fields if field not in data['sourceTime']]
                    target_missing = [field for field in time_fields if field not in data['targetTime']]
                    
                    if source_missing or target_missing:
                        self.log_test("Conversion NYC->London", False, f"Missing time fields - source: {source_missing}, target: {target_missing}", data)
                    else:
                        # Verify timezone conversion accuracy
                        source_tz = data['sourceTime']['timezone']
                        target_tz = data['targetTime']['timezone']
                        
                        if source_tz != "America/New_York" or target_tz != "Europe/London":
                            self.log_test("Conversion NYC->London", False, f"Incorrect timezones returned: {source_tz} -> {target_tz}", data)
                        else:
                            self.log_test("Conversion NYC->London", True, "Timezone conversion successful with proper structure", data)
            else:
                self.log_test("Conversion NYC->London", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Conversion NYC->London", False, f"Request failed: {str(e)}")
        
        # Test Case 2: Convert from Asia/Tokyo to America/Los_Angeles using custom time
        custom_time = "2024-01-15T14:30:00"
        test_data_2 = {
            "datetime": custom_time,
            "sourceTimezone": "Asia/Tokyo",
            "targetTimezone": "America/Los_Angeles"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/convert-timezone",
                json=test_data_2,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Conversion Tokyo->LA", True, "Custom time conversion successful", data)
            else:
                self.log_test("Conversion Tokyo->LA", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Conversion Tokyo->LA", False, f"Request failed: {str(e)}")
        
        # Test Case 3: Test with invalid timezone to verify error handling
        test_data_3 = {
            "datetime": current_time,
            "sourceTimezone": "Invalid/Timezone",
            "targetTimezone": "Europe/London"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/convert-timezone",
                json=test_data_3,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Invalid Timezone Error", True, "Properly handled invalid timezone with 400 error", response.json())
            elif response.status_code == 422:
                self.log_test("Invalid Timezone Error", True, "Properly handled invalid timezone with 422 error", response.json())
            else:
                self.log_test("Invalid Timezone Error", False, f"Expected 400/422 error but got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Invalid Timezone Error", False, f"Request failed: {str(e)}")
    
    def test_cors_headers(self):
        """Test CORS headers for frontend integration"""
        print("\n=== Testing CORS Headers ===")
        
        try:
            # Test preflight request
            response = self.session.options(
                f"{self.base_url}/health",
                headers={
                    'Origin': 'https://timezone-bridge.preview.emergentagent.com',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=10
            )
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Headers", True, "CORS headers present for frontend integration", cors_headers)
            else:
                self.log_test("CORS Headers", False, "Missing CORS headers", cors_headers)
                
        except requests.exceptions.RequestException as e:
            self.log_test("CORS Headers", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🚀 Starting Backend API Tests for: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_health_endpoint()
        self.test_timezones_endpoint()
        self.test_major_cities_endpoint()
        self.test_timezone_conversion()
        self.test_cors_headers()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check the details above.")
            return False

def main():
    """Main test execution"""
    tester = TimezoneAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()