// Mock timezone data for the timezone converter app

export const majorCities = [
  { value: 'America/New_York', label: 'New York (EST/EDT)', city: 'New York', offset: '-05:00' },
  { value: 'Europe/London', label: 'London (GMT/BST)', city: 'London', offset: '+00:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', city: 'Tokyo', offset: '+09:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', city: 'Los Angeles', offset: '-08:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', city: 'Shanghai', offset: '+08:00' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', city: 'Paris', offset: '+01:00' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', city: 'Sydney', offset: '+10:00' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', city: 'Dubai', offset: '+04:00' },
];

export const allTimezones = [
  ...majorCities,
  // Americas
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', city: 'Chicago', offset: '-06:00' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)', city: 'Denver', offset: '-07:00' },
  { value: 'America/Phoenix', label: 'Phoenix (MST)', city: 'Phoenix', offset: '-07:00' },
  { value: 'America/Anchorage', label: 'Anchorage (AKST/AKDT)', city: 'Anchorage', offset: '-09:00' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)', city: 'Toronto', offset: '-05:00' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)', city: 'Vancouver', offset: '-08:00' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', city: 'São Paulo', offset: '-03:00' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', city: 'Buenos Aires', offset: '-03:00' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)', city: 'Mexico City', offset: '-06:00' },
  
  // Europe
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', city: 'Berlin', offset: '+01:00' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', city: 'Rome', offset: '+01:00' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', city: 'Madrid', offset: '+01:00' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', city: 'Amsterdam', offset: '+01:00' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)', city: 'Stockholm', offset: '+01:00' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', city: 'Moscow', offset: '+03:00' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', city: 'Istanbul', offset: '+03:00' },
  
  // Asia
  { value: 'Asia/Mumbai', label: 'Mumbai (IST)', city: 'Mumbai', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', city: 'Singapore', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', city: 'Hong Kong', offset: '+08:00' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', city: 'Seoul', offset: '+09:00' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', city: 'Bangkok', offset: '+07:00' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', city: 'Jakarta', offset: '+07:00' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)', city: 'Kolkata', offset: '+05:30' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)', city: 'Karachi', offset: '+05:00' },
  
  // Australia & Oceania
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', city: 'Melbourne', offset: '+10:00' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', city: 'Perth', offset: '+08:00' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', city: 'Auckland', offset: '+12:00' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', city: 'Cairo', offset: '+02:00' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', city: 'Johannesburg', offset: '+02:00' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', city: 'Lagos', offset: '+01:00' },
];

// Mock conversion function (will be replaced with actual timezone conversion later)
export const convertTimezone = (datetime, sourceTimezone, targetTimezone) => {
  // Mock implementation - just adds/subtracts hours based on offset difference
  const sourceOffset = getTimezoneOffset(sourceTimezone);
  const targetOffset = getTimezoneOffset(targetTimezone);
  const offsetDiff = targetOffset - sourceOffset;
  
  const convertedDate = new Date(datetime.getTime() + (offsetDiff * 60 * 60 * 1000));
  
  return {
    sourceTime: datetime,
    targetTime: convertedDate,
    sourceTimezone: allTimezones.find(tz => tz.value === sourceTimezone),
    targetTimezone: allTimezones.find(tz => tz.value === targetTimezone),
  };
};

// Helper function to get timezone offset in hours
const getTimezoneOffset = (timezone) => {
  const tz = allTimezones.find(t => t.value === timezone);
  if (!tz) return 0;
  
  const offsetString = tz.offset;
  const sign = offsetString.startsWith('+') ? 1 : -1;
  const [hours, minutes] = offsetString.slice(1).split(':').map(Number);
  return sign * (hours + minutes / 60);
};

// Mock function to get current time in different major cities
export const getMajorCitiesTime = () => {
  const now = new Date();
  return majorCities.map(city => {
    const offset = getTimezoneOffset(city.value);
    const cityTime = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    return {
      ...city,
      currentTime: cityTime,
    };
  });
};