# Timezone Converter - Backend Integration Contracts

## API Contracts

### 1. Convert Timezone Endpoint
- **URL**: `/api/convert-timezone`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "datetime": "2024-08-24T12:30:00Z", // ISO string
    "sourceTimezone": "America/New_York",
    "targetTimezone": "Europe/London"
  }
  ```
- **Response**:
  ```json
  {
    "sourceTime": {
      "datetime": "2024-08-24T08:30:00-04:00",
      "timezone": "America/New_York",
      "formatted": "Sat, Aug 24, 2024, 08:30:00 AM",
      "city": "New York"
    },
    "targetTime": {
      "datetime": "2024-08-24T13:30:00+01:00", 
      "timezone": "Europe/London",
      "formatted": "Sat, Aug 24, 2024, 01:30:00 PM",
      "city": "London"
    }
  }
  ```

### 2. Get Major Cities Current Time Endpoint
- **URL**: `/api/major-cities-time`
- **Method**: GET
- **Response**:
  ```json
  {
    "cities": [
      {
        "timezone": "America/New_York",
        "city": "New York",
        "currentTime": "2024-08-24T08:30:00-04:00",
        "formatted": "08:30 AM",
        "date": "Aug 24"
      }
    ],
    "timestamp": "2024-08-24T12:30:00Z"
  }
  ```

### 3. Get All Timezones Endpoint
- **URL**: `/api/timezones`
- **Method**: GET  
- **Response**: List of all available timezones with metadata

## Mock Data to Replace

### Frontend Mock Functions (in `/app/frontend/src/data/mock.js`):
1. `convertTimezone()` - Replace with API call to `/api/convert-timezone`
2. `getMajorCitiesTime()` - Replace with API call to `/api/major-cities-time`
3. `allTimezones` array - Replace with API call to `/api/timezones`

## Backend Implementation Plan

### Dependencies to Add:
- `pytz` or `zoneinfo` for timezone operations
- `datetime` for time manipulation

### Backend Components:
1. **TimezoneService**: Core timezone conversion logic
2. **TimezoneController**: API endpoints
3. **Models**: Request/Response models for timezone operations

## Frontend Integration Changes

### Real-time Updates:
1. Replace static mock data with API calls
2. Add real-time clock updates (every second)
3. Implement dynamic timezone conversion
4. Add loading states for API calls

### UI Improvements:
1. Enhanced dropdown with search functionality
2. Better timezone grouping and display
3. Flag icons for countries
4. Improved visual hierarchy

### Files to Modify:
1. `/app/frontend/src/components/TimezoneConverter.jsx`
   - Replace mock calls with axios API calls
   - Add real-time clock updates
   - Improve dropdown design
   - Add loading states and error handling

2. `/app/frontend/src/data/mock.js`
   - Remove or keep as fallback data

### API Integration:
- Use existing axios setup with REACT_APP_BACKEND_URL
- Add proper error handling for API failures
- Implement loading states for better UX
- Add retry logic for failed requests

## Testing Requirements:
1. Test timezone conversion accuracy
2. Test real-time clock updates
3. Test API error handling
4. Test dropdown search functionality
5. Test responsive design on mobile devices