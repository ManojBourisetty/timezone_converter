import pytz
from datetime import datetime, timezone
from typing import List, Dict
import re

class TimezoneService:
    # Handle user-friendly or legacy aliases by mapping them to valid IANA names
    TIMEZONE_ALIASES = {
        'Asia/Mumbai': 'Asia/Kolkata',
        'Asia/Calcutta': 'Asia/Kolkata',
        'Asia/Kolkatta': 'Asia/Kolkata',
        'Mumbai': 'Asia/Kolkata',
        'Calcutta': 'Asia/Kolkata',
        'Kolkata': 'Asia/Kolkata',
        'IST': 'Asia/Kolkata',
    }

    # Case-insensitive lookups for aliases and valid IANA names
    TIMEZONE_ALIASES_CI = {k.lower(): v for k, v in TIMEZONE_ALIASES.items()}
    IANA_TIMEZONES_CI = {tz.lower(): tz for tz in pytz.all_timezones}
    
    # Major cities with country info for better display
    MAJOR_CITIES = [
        {'value': 'America/New_York', 'city': 'New York', 'country': 'United States'},
        {'value': 'Europe/London', 'city': 'London', 'country': 'United Kingdom'},
        {'value': 'Asia/Tokyo', 'city': 'Tokyo', 'country': 'Japan'},
        {'value': 'America/Los_Angeles', 'city': 'Los Angeles', 'country': 'United States'},
        {'value': 'Asia/Shanghai', 'city': 'Shanghai', 'country': 'China'},
        {'value': 'Europe/Paris', 'city': 'Paris', 'country': 'France'},
        {'value': 'Australia/Sydney', 'city': 'Sydney', 'country': 'Australia'},
        {'value': 'Asia/Dubai', 'city': 'Dubai', 'country': 'UAE'},
    ]
    
    # Additional timezones with city and country mapping
    ALL_TIMEZONES = {
        # Americas
        'America/Chicago': {'city': 'Chicago', 'country': 'United States'},
        'America/Denver': {'city': 'Denver', 'country': 'United States'},
        'America/Phoenix': {'city': 'Phoenix', 'country': 'United States'},
        'America/Anchorage': {'city': 'Anchorage', 'country': 'United States'},
        'America/Toronto': {'city': 'Toronto', 'country': 'Canada'},
        'America/Vancouver': {'city': 'Vancouver', 'country': 'Canada'},
        'America/Sao_Paulo': {'city': 'São Paulo', 'country': 'Brazil'},
        'America/Buenos_Aires': {'city': 'Buenos Aires', 'country': 'Argentina'},
        'America/Mexico_City': {'city': 'Mexico City', 'country': 'Mexico'},
        
        # Europe
        'Europe/Berlin': {'city': 'Berlin', 'country': 'Germany'},
        'Europe/Rome': {'city': 'Rome', 'country': 'Italy'},
        'Europe/Madrid': {'city': 'Madrid', 'country': 'Spain'},
        'Europe/Amsterdam': {'city': 'Amsterdam', 'country': 'Netherlands'},
        'Europe/Stockholm': {'city': 'Stockholm', 'country': 'Sweden'},
        'Europe/Moscow': {'city': 'Moscow', 'country': 'Russia'},
        'Europe/Istanbul': {'city': 'Istanbul', 'country': 'Turkey'},
        
        # Asia
        'Asia/Kolkata': {'city': 'Mumbai', 'country': 'India'},
        'Asia/Singapore': {'city': 'Singapore', 'country': 'Singapore'},
        'Asia/Hong_Kong': {'city': 'Hong Kong', 'country': 'Hong Kong'},
        'Asia/Seoul': {'city': 'Seoul', 'country': 'South Korea'},
        'Asia/Bangkok': {'city': 'Bangkok', 'country': 'Thailand'},
        'Asia/Jakarta': {'city': 'Jakarta', 'country': 'Indonesia'},
        'Asia/Karachi': {'city': 'Karachi', 'country': 'Pakistan'},
        
        # Australia & Oceania
        'Australia/Melbourne': {'city': 'Melbourne', 'country': 'Australia'},
        'Australia/Perth': {'city': 'Perth', 'country': 'Australia'},
        'Pacific/Auckland': {'city': 'Auckland', 'country': 'New Zealand'},
        
        # Africa
        'Africa/Cairo': {'city': 'Cairo', 'country': 'Egypt'},
        'Africa/Johannesburg': {'city': 'Johannesburg', 'country': 'South Africa'},
        'Africa/Lagos': {'city': 'Lagos', 'country': 'Nigeria'},
    }
    
    def __init__(self):
        # Combine major cities with additional timezones
        self.all_timezone_data = {}
        
        # Add major cities first
        for city in self.MAJOR_CITIES:
            self.all_timezone_data[city['value']] = {
                'city': city['city'],
                'country': city['country']
            }
        
        # Add additional timezones
        self.all_timezone_data.update(self.ALL_TIMEZONES)

    def normalize_timezone(self, timezone_name: str) -> str:
        """Normalize aliases to canonical IANA timezone names."""
        if not timezone_name:
            return timezone_name

        cleaned = timezone_name.strip()

        # Exact alias match first
        if cleaned in self.TIMEZONE_ALIASES:
            return self.TIMEZONE_ALIASES[cleaned]

        # Case-insensitive alias match
        alias_match = self.TIMEZONE_ALIASES_CI.get(cleaned.lower())
        if alias_match:
            return alias_match

        # Handle light formatting variants (e.g. "Asia/kolkata", "asia/mumbai")
        iana_match = self.IANA_TIMEZONES_CI.get(cleaned.lower())
        if iana_match:
            return iana_match

        # Last fallback: normalize spaces/underscores and retry (e.g. "Asia/Kolkata ")
        compact = cleaned.replace(' ', '_')
        iana_compact_match = self.IANA_TIMEZONES_CI.get(compact.lower())
        if iana_compact_match:
            return iana_compact_match

        return cleaned
    
    def get_timezone_offset(self, timezone_name: str) -> str:
        """Get timezone offset in +/-HH:MM format"""
        try:
            normalized_name = self.normalize_timezone(timezone_name)
            tz = pytz.timezone(normalized_name)
            # Use current time to get accurate offset (handles DST)
            dt = datetime.now(tz)
            offset = dt.strftime('%z')
            # Format as +/-HH:MM
            if offset:
                return f"{offset[:3]}:{offset[3:]}"
            return "+00:00"
        except:
            return "+00:00"
    
    def convert_timezone(self, iso_datetime: str, source_tz: str, target_tz: str) -> Dict:
        """Convert datetime from source timezone to target timezone"""
        try:
            # Parse ISO datetime
            dt = datetime.fromisoformat(iso_datetime.replace('Z', '+00:00'))

            source_tz = self.normalize_timezone(source_tz)
            target_tz = self.normalize_timezone(target_tz)
            
            # Get timezone objects
            source_timezone = pytz.timezone(source_tz)
            target_timezone = pytz.timezone(target_tz)
            
            # If input datetime is naive, localize it to source timezone
            if dt.tzinfo is None:
                source_dt = source_timezone.localize(dt)
            else:
                # Convert to source timezone
                source_dt = dt.astimezone(source_timezone)
            
            # Convert to target timezone
            target_dt = source_dt.astimezone(target_timezone)
            
            # Get timezone info
            source_info = self.all_timezone_data.get(source_tz, {'city': source_tz.split('/')[-1], 'country': 'Unknown'})
            target_info = self.all_timezone_data.get(target_tz, {'city': target_tz.split('/')[-1], 'country': 'Unknown'})
            
            return {
                'sourceTime': {
                    'datetime': source_dt.isoformat(),
                    'timezone': source_tz,
                    'formatted': source_dt.strftime('%a, %b %d, %Y, %I:%M:%S %p'),
                    'city': source_info['city'],
                    'offset': self.get_timezone_offset(source_tz)
                },
                'targetTime': {
                    'datetime': target_dt.isoformat(),
                    'timezone': target_tz,
                    'formatted': target_dt.strftime('%a, %b %d, %Y, %I:%M:%S %p'),
                    'city': target_info['city'],
                    'offset': self.get_timezone_offset(target_tz)
                }
            }
        except Exception as e:
            raise ValueError(f"Error converting timezone: {str(e)}")
    
    def get_major_cities_time(self) -> List[Dict]:
        """Get current time for all major cities"""
        cities_time = []
        current_utc = datetime.now(timezone.utc)
        
        for city_data in self.MAJOR_CITIES:
            try:
                tz = pytz.timezone(city_data['value'])
                city_time = current_utc.astimezone(tz)
                
                cities_time.append({
                    'timezone': city_data['value'],
                    'city': city_data['city'],
                    'currentTime': city_time.isoformat(),
                    'formatted': city_time.strftime('%I:%M %p'),
                    'date': city_time.strftime('%b %d'),
                    'offset': self.get_timezone_offset(city_data['value'])
                })
            except Exception:
                # Skip invalid timezones
                continue
        
        return cities_time
    
    def get_all_timezones(self) -> List[Dict]:
        """Get all available timezones with metadata, including global IANA zones."""
        timezones = []
        seen = set()
        
        # Add major cities first
        for city_data in self.MAJOR_CITIES:
            timezone_name = city_data['value']
            city_info = self.all_timezone_data[timezone_name]
            offset = self.get_timezone_offset(timezone_name)
            
            # Create timezone abbreviation
            try:
                tz = pytz.timezone(timezone_name)
                dt = datetime.now(tz)
                abbr = dt.strftime('%Z')
            except:
                abbr = 'UTC'
            
            timezones.append({
                'value': timezone_name,
                'label': f"{city_info['city']} ({abbr}) - {city_info['country']}",
                'city': city_info['city'],
                'offset': offset,
                'country': city_info['country']
            })
            seen.add(timezone_name)
        
        # Add other timezones
        for timezone_name, city_info in self.ALL_TIMEZONES.items():
            # Skip if already added as major city
            if timezone_name in [city['value'] for city in self.MAJOR_CITIES]:
                continue
                
            offset = self.get_timezone_offset(timezone_name)
            
            try:
                tz = pytz.timezone(timezone_name)
                dt = datetime.now(tz)
                abbr = dt.strftime('%Z')
            except:
                abbr = 'UTC'
            
            timezones.append({
                'value': timezone_name,
                'label': f"{city_info['city']} ({abbr}) - {city_info['country']}",
                'city': city_info['city'],
                'offset': offset,
                'country': city_info['country']
            })
            seen.add(timezone_name)

        # Add remaining common IANA timezones for global coverage
        for timezone_name in pytz.common_timezones:
            if timezone_name in seen:
                continue

            normalized_name = self.normalize_timezone(timezone_name)
            parts = normalized_name.split('/')
            region = parts[0].replace('_', ' ') if parts else 'Global'
            city_part = parts[-1] if parts else normalized_name
            city = city_part.replace('_', ' ')

            # Skip generic or less useful names from UI list
            if city in {'UTC', 'GMT'}:
                continue

            offset = self.get_timezone_offset(normalized_name)

            try:
                tz = pytz.timezone(normalized_name)
                dt = datetime.now(tz)
                abbr = dt.strftime('%Z')
            except Exception:
                abbr = 'UTC'

            timezones.append({
                'value': normalized_name,
                'label': f"{city} ({abbr}) - {region}",
                'city': city,
                'offset': offset,
                'country': region
            })
            seen.add(normalized_name)
        
        return timezones