import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Clock, CalendarIcon, ArrowRight, Globe, Search, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TimezoneConverter = () => {
  const [sourceTimezone, setSourceTimezone] = useState('America/New_York');
  const [targetTimezone, setTargetTimezone] = useState('Europe/London');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customDate, setCustomDate] = useState(new Date());
  const [customTime, setCustomTime] = useState('12:00');
  const [convertedResult, setConvertedResult] = useState(null);
  const [majorCitiesData, setMajorCitiesData] = useState([]);
  const [allTimezones, setAllTimezones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [targetSearchTerm, setTargetSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Load timezones on component mount
  useEffect(() => {
    fetchTimezones();
  }, []);

  // Update major cities time every 10 seconds
  useEffect(() => {
    const fetchMajorCities = async () => {
      try {
        const response = await axios.get(`${API}/major-cities-time`);
        setMajorCitiesData(response.data.cities);
      } catch (error) {
        console.error('Error fetching major cities time:', error);
      }
    };
    
    fetchMajorCities();
    const interval = setInterval(fetchMajorCities, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchTimezones = async () => {
    try {
      const response = await axios.get(`${API}/timezones`);
      setAllTimezones(response.data);
    } catch (error) {
      console.error('Error fetching timezones:', error);
      // Fallback to basic list if API fails
      setAllTimezones([
        { value: 'America/New_York', label: 'New York (EST) - United States', city: 'New York', country: 'United States' },
        { value: 'Europe/London', label: 'London (GMT) - United Kingdom', city: 'London', country: 'United Kingdom' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST) - Japan', city: 'Tokyo', country: 'Japan' },
      ]);
    }
  };

  // Filter timezones based on search term for each dropdown
  const getFilteredTimezones = (searchTerm) => {
    if (!searchTerm) return allTimezones;
    
    const searchLower = searchTerm.toLowerCase();
    return allTimezones.filter(tz => 
      tz.city.toLowerCase().includes(searchLower) ||
      tz.country.toLowerCase().includes(searchLower) ||
      tz.label.toLowerCase().includes(searchLower)
    );
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      let dateToConvert;
      
      if (useCurrentTime) {
        dateToConvert = new Date();
      } else {
        const [hours, minutes] = customTime.split(':');
        dateToConvert = new Date(customDate);
        dateToConvert.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const response = await axios.post(`${API}/convert-timezone`, {
        datetime: dateToConvert.toISOString(),
        sourceTimezone,
        targetTimezone
      });
      
      setConvertedResult(response.data);
    } catch (error) {
      console.error('Error converting timezone:', error);
      // Show error to user
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getSelectedTimezoneInfo = (timezoneValue) => {
    const timezone = allTimezones.find(tz => tz.value === timezoneValue);
    return timezone || { city: 'Select timezone', country: '', offset: '' };
  };

  const TimezoneSelectContent = ({ value, onValueChange, label, searchTerm, setSearchTerm }) => {
    const selectedInfo = getSelectedTimezoneInfo(value);
    const filteredTimezones = getFilteredTimezones(searchTerm);
    
    // Separate major cities and others for better UX
    const majorCities = filteredTimezones.filter(tz => 
      ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles', 
       'Asia/Shanghai', 'Europe/Paris', 'Australia/Sydney', 'Asia/Dubai'].includes(tz.value)
    );
    
    const otherTimezones = filteredTimezones.filter(tz => 
      !majorCities.some(major => major.value === tz.value)
    );
    
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          {label}
        </Label>
        <Select 
          value={value} 
          onValueChange={(newValue) => {
            onValueChange(newValue);
            setSearchTerm('');
          }}
        >
          <SelectTrigger className="h-16 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-white to-slate-50 shadow-md hover:shadow-lg rounded-xl">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <span className="font-semibold text-slate-800 text-lg">
                  {selectedInfo.city}
                </span>
                {selectedInfo.country && (
                  <span className="text-sm text-slate-500">{selectedInfo.country}</span>
                )}
              </div>
              <div className="flex flex-col items-end">
                {selectedInfo.offset && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {selectedInfo.offset}
                  </Badge>
                )}
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[450px] w-full z-50">
            <div className="sticky top-0 p-3 bg-white border-b border-slate-200 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search cities or countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-slate-200 focus:border-blue-500 rounded-lg"
                />
              </div>
            </div>
            
            {majorCities.length > 0 && (
              <>
                <div className="px-4 py-3 text-xs font-bold text-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  POPULAR CITIES
                </div>
                {majorCities.map((timezone) => (
                  <SelectItem 
                    key={timezone.value} 
                    value={timezone.value}
                    className="py-4 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-slate-800">{timezone.city}</span>
                          <span className="text-xs text-slate-500">{timezone.country}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-medium">
                        {timezone.offset}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
            
            {otherTimezones.length > 0 && (
              <>
                <div className="px-4 py-3 text-xs font-bold text-slate-600 bg-gradient-to-r from-slate-50 to-gray-100 border-b border-slate-200 flex items-center gap-2 mt-1">
                  <Globe className="h-4 w-4 text-slate-600" />
                  ALL TIMEZONES
                </div>
                {otherTimezones.map((timezone) => (
                  <SelectItem 
                    key={timezone.value} 
                    value={timezone.value}
                    className="py-4 px-4 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-slate-800">{timezone.city}</span>
                          <span className="text-xs text-slate-500">{timezone.country}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {timezone.offset}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
            
            {filteredTimezones.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <div className="font-medium">No timezones found</div>
                <div className="text-sm">Try searching for "{searchTerm}"</div>
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Timezone Converter
          </h1>
          <p className="text-slate-600 text-lg">
            Convert time between any two timezones with real-time accuracy
          </p>
          <div className="mt-4 text-sm text-slate-500">
            Current UTC: {currentTime.toISOString().replace('T', ' ').slice(0, 19)}
          </div>
        </div>

        {/* Main Converter Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              Time Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Timezone Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TimezoneSelectContent 
                value={sourceTimezone}
                onValueChange={setSourceTimezone}
                label="From Timezone"
                searchTerm={sourceSearchTerm}
                setSearchTerm={setSourceSearchTerm}
              />

              <TimezoneSelectContent 
                value={targetTimezone}
                onValueChange={setTargetTimezone}
                label="To Timezone"
                searchTerm={targetSearchTerm}
                setSearchTerm={setTargetSearchTerm}
              />
            </div>

            {/* Swap Timezones Button - Positioned below timezone selections */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  const temp = sourceTimezone;
                  setSourceTimezone(targetTimezone);
                  setTargetTimezone(temp);
                  setSourceSearchTerm('');
                  setTargetSearchTerm('');
                }}
                variant="outline"
                className="px-6 py-2 rounded-lg bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 text-blue-600 transform rotate-90" />
                <span className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Swap Timezones</span>
              </Button>
            </div>

            {/* Time Selection Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <Switch
                  id="time-mode"
                  checked={useCurrentTime}
                  onCheckedChange={setUseCurrentTime}
                />
                <Label htmlFor="time-mode" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Use current time ({currentTime.toLocaleTimeString()})
                </Label>
              </div>

              {/* Custom Date/Time Picker */}
              {!useCurrentTime && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-slate-200 shadow-inner">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Select Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12 border-slate-300 hover:border-blue-400 bg-white shadow-sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDate ? format(customDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDate}
                          onSelect={setCustomDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-time" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Select Time
                    </Label>
                    <Input
                      id="custom-time"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="h-12 border-slate-300 focus:border-blue-500 bg-white shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Convert Button */}
            <div className="text-center">
              <Button 
                onClick={handleConvert}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    Convert Time
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Result */}
        {convertedResult && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="text-xl text-center text-slate-800">
                Conversion Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-sm">
                  <Badge className="mb-3 bg-blue-600 text-white">Source</Badge>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {convertedResult.sourceTime.city}
                  </h3>
                  <p className="text-2xl font-bold text-blue-700 mb-2">
                    {convertedResult.sourceTime.formatted}
                  </p>
                  <p className="text-sm text-slate-600">
                    {convertedResult.sourceTime.timezone}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {convertedResult.sourceTime.offset}
                  </Badge>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-emerald-200 shadow-sm">
                  <Badge className="mb-3 bg-emerald-600 text-white">Target</Badge>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {convertedResult.targetTime.city}
                  </h3>
                  <p className="text-2xl font-bold text-emerald-700 mb-2">
                    {convertedResult.targetTime.formatted}
                  </p>
                  <p className="text-sm text-slate-600">
                    {convertedResult.targetTime.timezone}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {convertedResult.targetTime.offset}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Major Cities Current Time */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center text-slate-800 flex items-center justify-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Major Cities Current Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {majorCitiesData.map((city) => (
                <div 
                  key={city.timezone} 
                  className="text-center p-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 hover:scale-105"
                >
                  <h4 className="font-semibold text-slate-700 mb-1 text-sm">
                    {city.city}
                  </h4>
                  <p className="text-xl font-bold text-slate-800 mb-1">
                    {city.formatted}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    {city.date}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {city.offset}
                  </Badge>
                </div>
              ))}
            </div>
            {majorCitiesData.length === 0 && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-slate-500">Loading real-time data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimezoneConverter;