import pytest
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

from timezone_service import TimezoneService
from models import TimezoneConversionRequest


class TestTimezoneService:
    """Unit tests for TimezoneService"""

    @pytest.fixture
    def service(self):
        return TimezoneService()

    def test_timezone_conversion_basic(self, service):
        """Test basic timezone conversion"""
        result = service.convert_timezone(
            "2024-04-18T10:00:00Z",
            "America/New_York",
            "Europe/London"
        )

        assert result is not None
        assert 'sourceTime' in result
        assert 'targetTime' in result
        assert result['sourceTime']['city'] == 'New York'
        assert result['targetTime']['city'] == 'London'

    def test_invalid_timezone_source(self, service):
        """Test error handling for invalid source timezone"""
        with pytest.raises(ValueError):
            service.convert_timezone(
                "2024-04-18T10:00:00Z",
                "Invalid/Timezone",
                "Europe/London"
            )

    def test_invalid_timezone_target(self, service):
        """Test error handling for invalid target timezone"""
        with pytest.raises(ValueError):
            service.convert_timezone(
                "2024-04-18T10:00:00Z",
                "America/New_York",
                "Invalid/Timezone"
            )

    def test_major_cities_time(self, service):
        """Test major cities time retrieval"""
        cities = service.get_major_cities_time()
        assert isinstance(cities, list)
        assert len(cities) > 0

        # Check structure of first city
        city = cities[0]
        assert 'timezone' in city
        assert 'city' in city
        assert 'currentTime' in city
        assert 'formatted' in city

    def test_all_timezones(self, service):
        """Test all timezones retrieval"""
        timezones = service.get_all_timezones()
        assert isinstance(timezones, list)
        assert len(timezones) > 0

        # Check structure
        tz = timezones[0]
        assert 'value' in tz
        assert 'label' in tz
        assert 'city' in tz
        assert 'country' in tz

    def test_timezone_offset_calculation(self, service):
        """Test timezone offset calculation"""
        offset = service.get_timezone_offset("America/New_York")
        assert isinstance(offset, str)
        assert offset.startswith('+') or offset.startswith('-')

    def test_naive_datetime_handling(self, service):
        """Test handling of naive datetime input"""
        # Should work with naive datetime (no timezone)
        result = service.convert_timezone(
            "2024-04-18T10:00:00",  # No Z suffix
            "America/New_York",
            "Europe/London"
        )
        assert result is not None


class TestModels:
    """Test Pydantic models"""

    def test_timezone_conversion_request_valid(self):
        """Test valid request model"""
        request = TimezoneConversionRequest(
            datetime="2024-04-18T10:00:00Z",
            sourceTimezone="America/New_York",
            targetTimezone="Europe/London"
        )
        assert request.datetime == "2024-04-18T10:00:00Z"
        assert request.sourceTimezone == "America/New_York"

    def test_timezone_conversion_request_invalid_datetime(self):
        """Test that datetime is stored as string (Pydantic doesn't validate format)"""
        request = TimezoneConversionRequest(
            datetime="invalid-date",
            sourceTimezone="America/New_York",
            targetTimezone="Europe/London"
        )
        # Pydantic accepts any string, validation happens in the service
        assert request.datetime == "invalid-date"