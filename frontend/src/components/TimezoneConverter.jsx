import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Clock, CalendarIcon, ArrowRight, Globe, Search, Loader2, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TimezoneConverter = () => {
  const [sourceTimezone, setSourceTimezone] = useState('America/New_York');
  const [targetTimezone, setTargetTimezone] = useState('Europe/London');
  const [customDate, setCustomDate] = useState(new Date());
  const [customTime, setCustomTime] = useState(new Date().toTimeString().slice(0, 5));
  const [convertedResult, setConvertedResult] = useState(null);
  const [majorCitiesData, setMajorCitiesData] = useState([]);
  const [allTimezones, setAllTimezones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sourceShowSuggestions, setSourceShowSuggestions] = useState(false);
  const [targetShowSuggestions, setTargetShowSuggestions] = useState(false);
  const [sourceFocused, setSourceFocused] = useState(false);
  const [targetFocused, setTargetFocused] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isUsingCurrentTime, setIsUsingCurrentTime] = useState(false);

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
      setAllTimezones([
        { value: 'America/New_York', label: 'New York (EST) - United States', city: 'New York', country: 'United States', offset: 'EST' },
        { value: 'Europe/London', label: 'London (GMT) - United Kingdom', city: 'London', country: 'United Kingdom', offset: 'GMT' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST) - Japan', city: 'Tokyo', country: 'Japan', offset: 'JST' },
      ]);
    }
  };

  const getFilteredTimezones = (searchTerm) => {
    if (!searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return allTimezones.filter(tz => 
      tz.city.toLowerCase().includes(searchLower) ||
      tz.country.toLowerCase().includes(searchLower) ||
      tz.value.toLowerCase().includes(searchLower) ||
      tz.label.toLowerCase().includes(searchLower)
    ).slice(0, 8);
  };

  const getSelectedTimezoneInfo = (timezoneValue) => {
    return allTimezones.find(tz => tz.value === timezoneValue) || { city: '', country: '', offset: '' };
  };

  const formatResultTime = (value, fallbackText) => {
    if (!value) return fallbackText || '--';

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(parsedDate);
    }

    return fallbackText || value;
  };

  const formatResultDate = (value, fallbackText) => {
    if (!value) return fallbackText || format(customDate, 'PPP');

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(parsedDate);
    }

    return fallbackText || format(customDate, 'PPP');
  };

  const performConversion = async (dateValue, timeValue) => {
    if (!sourceTimezone || !targetTimezone) {
      alert('Please select both source and target timezones');
      return;
    }
    
    setLoading(true);
    try {
      const [hours, minutes] = timeValue.split(':');
      const dateToConvert = new Date(dateValue);
      dateToConvert.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      console.log('Converting:', {
        datetime: dateToConvert.toISOString(),
        sourceTimezone,
        targetTimezone
      });
      
      const response = await axios.post(`${API}/convert-timezone`, {
        datetime: dateToConvert.toISOString(),
        sourceTimezone,
        targetTimezone
      });
      
      console.log('Conversion result:', response.data);
      setConvertedResult(response.data);
      setIsResultDialogOpen(true);
    } catch (error) {
      console.error('Error converting timezone:', error);
      alert(`Error: ${error.response?.data?.detail || error.message || 'Failed to convert timezone'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    await performConversion(customDate, customTime);
  };

  useEffect(() => {
    if (!isUsingCurrentTime || !isResultDialogOpen) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      if (loading) return;

      const now = new Date();
      const nowTime = now.toTimeString().slice(0, 5);
      setCustomDate(now);
      setCustomTime(nowTime);
      performConversion(now, nowTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isUsingCurrentTime, isResultDialogOpen, sourceTimezone, targetTimezone, loading]);

  const TimezoneAutocomplete = ({ value, onChange, search, setSearch, showSuggestions, setShowSuggestions, focused, setFocused, label, placeholder, testId }) => {
    const info = getSelectedTimezoneInfo(value);
    const suggestions = getFilteredTimezones(search);
    const displayValue = focused ? search : (search || (info.city ? `${info.city}, ${info.country}` : ''));

    const handleSelectSuggestion = (tz) => {
      onChange(tz.value);
      setSearch('');
      setShowSuggestions(false);
      setFocused(false);
    };

    const handleInputChange = (e) => {
      setSearch(e.target.value);
      setShowSuggestions(true);
    };

    const handleInputFocus = () => {
      setFocused(true);
      if (!search && info.city) {
        setSearch(info.city);
      }
      setShowSuggestions(true);
    };

    const handleInputBlur = () => {
      setFocused(false);
      setShowSuggestions(false);
    };

    const handleClear = () => {
      setSearch('');
      setShowSuggestions(false);
    };

    // Show suggestions only when focused and typing
    const showSuggestionsList = focused && showSuggestions && search;
    const showNoResults = focused && showSuggestions && search && suggestions.length === 0;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          {label}
        </Label>
        <div className="relative">
          {/* Input field - always visible */}
          <div className={`flex items-center gap-2 px-3 py-3 border-2 rounded-lg bg-white transition-all min-h-12 ${
            focused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300 hover:border-blue-400'
          }`}>
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              data-testid={testId}
              type="text"
              placeholder={placeholder}
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suggestions.length > 0) {
                  e.preventDefault();
                  handleSelectSuggestion(suggestions[0]);
                }
              }}
              className="flex-1 outline-none text-slate-800 bg-transparent py-1 text-base placeholder-slate-400"
              autoComplete="off"
              spellCheck="false"
            />
            {search && (
              <button
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-1"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete suggestions - only when focused and typing */}
          {showSuggestionsList && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              <div className="py-1">
                {suggestions.map((tz, idx) => (
                  <button
                    key={`${tz.value}-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(tz);
                    }}
                    onClick={() => handleSelectSuggestion(tz)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-100 active:bg-blue-200 transition-colors border-b border-slate-100 last:border-0"
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{tz.city}</p>
                        <p className="text-sm text-slate-600">{tz.country}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{tz.offset}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {showNoResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 text-center text-slate-500">
              No cities found for "{search}"
            </div>
          )}
        </div>
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
            {/* Timezone Selection with Autocomplete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TimezoneAutocomplete
                value={sourceTimezone}
                onChange={setSourceTimezone}
                search={sourceSearch}
                setSearch={setSourceSearch}
                showSuggestions={sourceShowSuggestions}
                setShowSuggestions={setSourceShowSuggestions}
                focused={sourceFocused}
                setFocused={setSourceFocused}
                label="From Timezone"
                placeholder="Type city name (e.g., New York, London)..."
                testId="source-timezone-input"
              />

              <TimezoneAutocomplete
                value={targetTimezone}
                onChange={setTargetTimezone}
                search={targetSearch}
                setSearch={setTargetSearch}
                showSuggestions={targetShowSuggestions}
                setShowSuggestions={setTargetShowSuggestions}
                focused={targetFocused}
                setFocused={setTargetFocused}
                label="To Timezone"
                placeholder="Type city name (e.g., Tokyo, Paris)..."
                testId="target-timezone-input"
              />
            </div>

            {/* Swap Timezones Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  const temp = sourceTimezone;
                  setSourceTimezone(targetTimezone);
                  setTargetTimezone(temp);
                  setSourceSearch('');
                  setTargetSearch('');
                  setSourceFocused(false);
                  setTargetFocused(false);
                  setSourceShowSuggestions(false);
                  setTargetShowSuggestions(false);
                }}
                variant="outline"
                className="px-6 py-2 rounded-lg bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                data-testid="swap-timezones-button"
              >
                <ArrowRight className="h-4 w-4 text-blue-600 transform rotate-90" />
                <span className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Swap Timezones</span>
              </Button>
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex flex-col gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12 border-slate-300 hover:border-blue-400 bg-white shadow-sm"
                          data-testid="date-picker-button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(customDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDate}
                          onSelect={(selectedDate) => {
                            if (!selectedDate) return;
                            setIsUsingCurrentTime(false);
                            setCustomDate(selectedDate);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Select Time</Label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="time-input"
                        type="time"
                        value={customTime}
                        onChange={(e) => {
                          setIsUsingCurrentTime(false);
                          setCustomTime(e.target.value);
                        }}
                        className="flex-1 h-12 border-2 border-slate-300 focus:border-blue-500 bg-white shadow-sm text-slate-800"
                      />
                      <Button
                        onClick={() => {
                          const now = new Date();
                          setCustomTime(now.toTimeString().slice(0, 5));
                          setCustomDate(now);
                          setIsUsingCurrentTime(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-12 flex-shrink-0"
                        data-testid="use-current-time-button"
                        title="Set to current date and time"
                      >
                        <Clock className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Current UTC: {currentTime.toISOString().replace('T', ' ').slice(0, 19)}
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="text-center">
              <Button 
                onClick={handleConvert}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                data-testid="convert-button"
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

        {/* Conversion Result Popup */}
        {convertedResult && (
          <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden" data-testid="conversion-result">
              <DialogHeader className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <DialogTitle className="text-xl font-semibold">Conversion Result</DialogTitle>
                <p className="text-sm text-blue-100">
                  {format(customDate, 'PPP')} at {customTime}{isUsingCurrentTime ? ' (Live)' : ''}
                </p>
              </DialogHeader>

              <div className="px-6 py-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-sm">
                    <Badge className="mb-3 bg-blue-600 text-white">Source</Badge>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">
                      {convertedResult.sourceTime.city}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">
                      {formatResultDate(convertedResult.sourceTime.datetime, format(customDate, 'PPP'))}
                    </p>
                    <p className="text-3xl font-bold text-blue-700 mb-2" data-testid="source-time-display">
                      {formatResultTime(convertedResult.sourceTime.datetime, convertedResult.sourceTime.formatted)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {convertedResult.sourceTime.timezone}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {convertedResult.sourceTime.offset}
                    </Badge>
                  </div>

                  <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-emerald-200 shadow-sm">
                    <Badge className="mb-3 bg-emerald-600 text-white">Target</Badge>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">
                      {convertedResult.targetTime.city}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">
                      {formatResultDate(convertedResult.targetTime.datetime, format(customDate, 'PPP'))}
                    </p>
                    <p className="text-3xl font-bold text-emerald-700 mb-2" data-testid="target-time-display">
                      {formatResultTime(convertedResult.targetTime.datetime, convertedResult.targetTime.formatted)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {convertedResult.targetTime.timezone}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {convertedResult.targetTime.offset}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  onClick={() => setIsResultDialogOpen(false)}
                  data-testid="result-ok-button"
                >
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  data-testid={`city-${city.city.toLowerCase()}`}
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
