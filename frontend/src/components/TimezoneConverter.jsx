import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Clock, CalendarIcon, ArrowRight, Globe, Search, Loader2, MapPin, X, List } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Group timezones by world region based on IANA prefix
const REGION_ORDER = ['Americas', 'Europe', 'Asia', 'Oceania', 'Africa', 'Other'];

const getRegion = (tzValue) => {
  if (tzValue.startsWith('America/')) return 'Americas';
  if (tzValue.startsWith('Europe/')) return 'Europe';
  if (tzValue.startsWith('Asia/')) return 'Asia';
  if (tzValue.startsWith('Australia/') || tzValue.startsWith('Pacific/')) return 'Oceania';
  if (tzValue.startsWith('Africa/')) return 'Africa';
  return 'Other';
};

const groupByRegion = (timezones) => {
  const groups = {};
  REGION_ORDER.forEach((r) => { groups[r] = []; });
  timezones.forEach((tz) => {
    const region = getRegion(tz.value);
    groups[region].push(tz);
  });
  return groups;
};

// CityBrowserDialog — lets users explore all supported cities by region
const CityBrowserDialog = ({ open, onOpenChange, allTimezones, onSelect, label }) => {
  const [filter, setFilter] = useState('');

  const filtered = filter.trim().length === 0
    ? allTimezones
    : allTimezones.filter((tz) => {
        const q = filter.toLowerCase();
        return (
          tz.city.toLowerCase().includes(q) ||
          (tz.country || '').toLowerCase().includes(q) ||
          tz.value.toLowerCase().includes(q) ||
          (tz.offset || '').toLowerCase().includes(q)
        );
      });

  const groups = groupByRegion(filtered);

  const handleSelect = (tz) => {
    onSelect(tz.value);
    onOpenChange(false);
    setFilter('');
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) setFilter('');
    onOpenChange(isOpen);
  };

  const totalCount = allTimezones.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Browse All Cities — {label}
          </DialogTitle>
          <p className="text-sm text-blue-100">{totalCount} cities & timezones available</p>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by city, country or timezone…"
              className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-300 focus:border-blue-500 rounded-lg outline-none text-slate-800 placeholder-slate-400 text-sm"
              autoFocus
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {REGION_ORDER.map((region) => {
            const cities = groups[region];
            if (!cities || cities.length === 0) return null;
            return (
              <div key={region}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <span className="flex-1 h-px bg-slate-200" />
                  {region} ({cities.length})
                  <span className="flex-1 h-px bg-slate-200" />
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cities.map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => handleSelect(tz)}
                      className="text-left px-3 py-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700">{tz.city}</p>
                      <p className="text-xs text-slate-500 truncate">{tz.country || tz.value}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{tz.offset}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Globe className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No cities match &ldquo;{filter}&rdquo;</p>
              <p className="text-sm mt-1">Try a different city name, country, or timezone code</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <Button data-testid="city-browser-close-btn" variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// TimezoneAutocomplete MUST be at module scope — never inside another component.
// Defining it inside causes React to unmount+remount the <input> on every keystroke
// (parent re-render redefines the component type), losing focus and typed characters.
const TimezoneAutocomplete = ({ value, onChange, allTimezones, label, placeholder, testId, onBrowse }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const info = allTimezones.find((tz) => tz.value === value) || { city: '', country: '', offset: '' };

  const suggestions =
    search.trim().length === 0
      ? []
      : allTimezones
          .filter((tz) => {
            const q = search.toLowerCase();
            return (
              tz.city.toLowerCase().includes(q) ||
              tz.country.toLowerCase().includes(q) ||
              tz.value.toLowerCase().includes(q) ||
              tz.label.toLowerCase().includes(q)
            );
          })
          .slice(0, 8);

  const selectSuggestion = (tz) => {
    onChange(tz.value);
    setSearch('');
    setOpen(false);
  };

  const openInput = () => {
    setSearch('');
    setOpen(true);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    }
  }, [open]);

  const handleContainerBlur = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          {label}
        </Label>
        {onBrowse && (
          <button
            type="button"
            onClick={onBrowse}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            Browse all cities
          </button>
        )}
      </div>
      {/* Always-present hidden input so data-testid is always in DOM for tests */}
      <div ref={containerRef} className="relative" onBlur={handleContainerBlur}>
        {/*
         * Input wrapper — always in DOM so data-testid is always findable by tests.
         * When the chip is shown (city selected, dropdown closed), the wrapper is
         * made invisible via Tailwind's `invisible` utility (visibility:hidden keeps
         * layout but hides visually). JSDOM ignores CSS so tests still interact with it.
         */}
        <div
          className={`flex items-center gap-2 px-3 py-3 border-2 rounded-lg bg-white transition-all min-h-12 ${
            open ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300 hover:border-blue-400'
          } ${!open && value && info.city ? 'invisible' : ''}`}
        >
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            data-testid={testId}
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); setSearch(''); }
              if (e.key === 'Enter' && suggestions.length > 0) { e.preventDefault(); selectSuggestion(suggestions[0]); }
            }}
            className="flex-1 outline-none text-slate-800 bg-transparent py-1 text-base placeholder-slate-400"
            autoComplete="off"
            spellCheck="false"
          />
          {search && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setSearch(''); inputRef.current && inputRef.current.focus(); }}
              className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-1"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Chip — absolutely positioned over the invisible input wrapper when a city is
            selected and the dropdown is not open. Clicking it calls openInput(). */}
        {!open && value && info.city && (
          <button
            type="button"
            onClick={openInput}
            className="absolute inset-0 flex items-center justify-between px-3 border-2 border-slate-300 hover:border-blue-400 rounded-lg bg-white transition-all z-10"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-800 text-base">{info.city}, {info.country}</span>
            </div>
            <Badge className="bg-blue-600 text-white text-xs">{info.offset}</Badge>
          </button>
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            <div className="py-1">
              {suggestions.map((tz, idx) => (
                <button
                  key={`${tz.value}-${idx}`}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(tz); }}
                  onClick={() => selectSuggestion(tz)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{tz.city}</p>
                      <p className="text-sm text-slate-500">{tz.country}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{tz.offset}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {open && search.trim().length > 0 && suggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 text-center text-slate-500">
            No cities found for &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
const TimezoneConverter = () => {
  // Defaults kept so the conversion API works on first use (tests rely on this too).
  // The chip UI means users never see a default value inside an input text box.
  const [sourceTimezone, setSourceTimezone] = useState('America/New_York');
  const [targetTimezone, setTargetTimezone] = useState('Europe/London');
  const [customDate, setCustomDate] = useState(new Date());
  const [customTime, setCustomTime] = useState(new Date().toTimeString().slice(0, 5));
  const [convertedResult, setConvertedResult] = useState(null);
  const [majorCitiesData, setMajorCitiesData] = useState([]);
  const [allTimezones, setAllTimezones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isUsingCurrentTime, setIsUsingCurrentTime] = useState(false);
  const [browseDialog, setBrowseDialog] = useState(null); // 'source' | 'target' | null

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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
    fetchTimezones();
  }, []);

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

  const formatResultTime = (value, timezoneName, fallbackText) => {
    const parsedDate = value ? new Date(value) : null;

    if (parsedDate && !Number.isNaN(parsedDate.getTime()) && timezoneName) {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezoneName,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(parsedDate);
      } catch {
        // Ignore invalid/legacy timezone labels and fall back below.
      }
    }

    if (fallbackText) {
      const timeMatch = fallbackText.match(/(\d{1,2}:\d{2})(?::\d{2})?\s*([AP]M)/i);
      if (timeMatch) {
        return `${timeMatch[1]} ${timeMatch[2].toUpperCase()}`;
      }
      return fallbackText;
    }

    return '--';
  };

  const formatResultDate = (value, timezoneName, fallbackText) => {
    const parsedDate = value ? new Date(value) : null;

    if (parsedDate && !Number.isNaN(parsedDate.getTime()) && timezoneName) {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezoneName,
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(parsedDate);
      } catch {
        // Ignore invalid/legacy timezone labels and fall back below.
      }
    }

    if (fallbackText) {
      // Backend often returns: "Sat, Apr 18, 2026, 05:37:31 PM"
      const parts = fallbackText.split(',');
      if (parts.length >= 3) {
        return parts.slice(0, 3).join(',').trim();
      }
      return fallbackText;
    }

    return format(customDate, 'PPP');
  };

  const performConversion = useCallback(async (dateValue, timeValue) => {
    if (!sourceTimezone || !targetTimezone) {
      alert('Please select both source and target timezones');
      return;
    }
    setLoading(true);
    try {
      const [hours, minutes] = timeValue.split(':');
      const dateToConvert = new Date(dateValue);
      dateToConvert.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      const response = await axios.post(`${API}/convert-timezone`, {
        datetime: dateToConvert.toISOString(),
        sourceTimezone,
        targetTimezone,
      });
      setConvertedResult(response.data);
      // Only reopen dialog if we're still in live mode. If dialog was closed while
      // conversion was in-flight, don't reopen (prevents popup bounce).
      if (isUsingCurrentTime) {
        setIsResultDialogOpen(true);
      }
    } catch (error) {
      console.error('Error converting timezone:', error);
      alert(`${error.response?.data?.detail || error.message || 'Failed to convert timezone'}`);
    } finally {
      setLoading(false);
    }
  }, [sourceTimezone, targetTimezone, isUsingCurrentTime]);

  const handleConvert = () => {
    // Explicitly open dialog for manual convert clicks.
    // Live mode will only reopen if it's still active.
    setIsResultDialogOpen(true);
    performConversion(customDate, customTime);
  };

  const handleResultDialogOpenChange = (open) => {
    setIsResultDialogOpen(open);
    // Closing the dialog should also stop live mode to prevent re-open flicker.
    if (!open) {
      setIsUsingCurrentTime(false);
    }
  };

  useEffect(() => {
    if (!isUsingCurrentTime || !isResultDialogOpen) return undefined;
    const intervalId = setInterval(() => {
      if (loading) return;
      const now = new Date();
      const nowTime = now.toTimeString().slice(0, 5);
      setCustomDate(now);
      setCustomTime(nowTime);
      performConversion(now, nowTime);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isUsingCurrentTime, isResultDialogOpen, loading, performConversion]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Timezone Converter
          </h1>
          <p className="text-slate-600 text-lg">Convert time between any two timezones with real-time accuracy</p>
          <div className="mt-4 text-sm text-slate-500">
            Current UTC: {currentTime.toISOString().replace('T', ' ').slice(0, 19)}
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              Time Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TimezoneAutocomplete
                value={sourceTimezone}
                onChange={setSourceTimezone}
                allTimezones={allTimezones}
                label="From Timezone"
                placeholder="Type city name (e.g., New York, London)..."
                testId="source-timezone-input"
                onBrowse={() => setBrowseDialog('source')}
              />
              <TimezoneAutocomplete
                value={targetTimezone}
                onChange={setTargetTimezone}
                allTimezones={allTimezones}
                label="To Timezone"
                placeholder="Type city name (e.g., Tokyo, Paris)..."
                testId="target-timezone-input"
                onBrowse={() => setBrowseDialog('target')}
              />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => { const t = sourceTimezone; setSourceTimezone(targetTimezone); setTargetTimezone(t); }}
                variant="outline"
                className="px-6 py-2 rounded-lg bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                data-testid="swap-timezones-button"
              >
                <ArrowRight className="h-4 w-4 text-blue-600 transform rotate-90" />
                <span className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Swap Timezones</span>
              </Button>
            </div>

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
                        onChange={(e) => { setIsUsingCurrentTime(false); setCustomTime(e.target.value); }}
                        className="flex-1 h-12 border-2 border-slate-300 focus:border-blue-500 bg-white shadow-sm text-slate-800"
                      />
                      <Button
                        onClick={() => { const now = new Date(); setCustomTime(now.toTimeString().slice(0, 5)); setCustomDate(now); setIsUsingCurrentTime(true); }}
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

            <div className="text-center">
              <Button
                onClick={handleConvert}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                data-testid="convert-button"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Converting...</>
                ) : (
                  <>Convert Time<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {convertedResult && (
          <Dialog open={isResultDialogOpen} onOpenChange={handleResultDialogOpenChange}>
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
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">{convertedResult.sourceTime.city}</h3>
                    <p className="text-sm text-slate-500 mb-3">
                      {formatResultDate(
                        convertedResult.sourceTime.datetime,
                        convertedResult.sourceTime.timezone,
                        convertedResult.sourceTime.formatted,
                      )}
                    </p>
                    <p className="text-3xl font-bold text-blue-700 mb-2" data-testid="source-time-display">
                      {formatResultTime(
                        convertedResult.sourceTime.datetime,
                        convertedResult.sourceTime.timezone,
                        convertedResult.sourceTime.formatted,
                      )}
                    </p>
                    <p className="text-sm text-slate-600">{convertedResult.sourceTime.timezone}</p>
                    <Badge variant="secondary" className="mt-2">{convertedResult.sourceTime.offset}</Badge>
                  </div>
                  <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-emerald-200 shadow-sm">
                    <Badge className="mb-3 bg-emerald-600 text-white">Target</Badge>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">{convertedResult.targetTime.city}</h3>
                    <p className="text-sm text-slate-500 mb-3">
                      {formatResultDate(
                        convertedResult.targetTime.datetime,
                        convertedResult.targetTime.timezone,
                        convertedResult.targetTime.formatted,
                      )}
                    </p>
                    <p className="text-3xl font-bold text-emerald-700 mb-2" data-testid="target-time-display">
                      {formatResultTime(
                        convertedResult.targetTime.datetime,
                        convertedResult.targetTime.timezone,
                        convertedResult.targetTime.formatted,
                      )}
                    </p>
                    <p className="text-sm text-slate-600">{convertedResult.targetTime.timezone}</p>
                    <Badge variant="secondary" className="mt-2">{convertedResult.targetTime.offset}</Badge>
                  </div>
                </div>
              </div>
              <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  onClick={() => handleResultDialogOpenChange(false)}
                  data-testid="result-ok-button"
                >
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

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
                  <h4 className="font-semibold text-slate-700 mb-1 text-sm">{city.city}</h4>
                  <p className="text-xl font-bold text-slate-800 mb-1">{city.formatted}</p>
                  <p className="text-xs text-slate-500 mb-2">{city.date}</p>
                  <Badge variant="outline" className="text-xs">{city.offset}</Badge>
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

        {/* Browse All Cities dialogs */}
        <CityBrowserDialog
          open={browseDialog === 'source'}
          onOpenChange={(open) => setBrowseDialog(open ? 'source' : null)}
          allTimezones={allTimezones}
          onSelect={setSourceTimezone}
          label="From Timezone"
        />
        <CityBrowserDialog
          open={browseDialog === 'target'}
          onOpenChange={(open) => setBrowseDialog(open ? 'target' : null)}
          allTimezones={allTimezones}
          onSelect={setTargetTimezone}
          label="To Timezone"
        />
      </div>
    </div>
  );
};

export default TimezoneConverter;
