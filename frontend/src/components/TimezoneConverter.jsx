import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { Clock, CalendarIcon, ArrowRight, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { allTimezones, majorCities, convertTimezone, getMajorCitiesTime } from '../data/mock';

const TimezoneConverter = () => {
  const [sourceTimezone, setSourceTimezone] = useState('America/New_York');
  const [targetTimezone, setTargetTimezone] = useState('Europe/London');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customDate, setCustomDate] = useState(new Date());
  const [customTime, setCustomTime] = useState('12:00');
  const [convertedResult, setConvertedResult] = useState(null);
  const [majorCitiesData, setMajorCitiesData] = useState([]);

  useEffect(() => {
    // Update major cities time every second
    const updateMajorCities = () => {
      setMajorCitiesData(getMajorCitiesTime());
    };
    
    updateMajorCities();
    const interval = setInterval(updateMajorCities, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleConvert = () => {
    let dateToConvert;
    
    if (useCurrentTime) {
      dateToConvert = new Date();
    } else {
      const [hours, minutes] = customTime.split(':');
      dateToConvert = new Date(customDate);
      dateToConvert.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    const result = convertTimezone(dateToConvert, sourceTimezone, targetTimezone);
    setConvertedResult(result);
  };

  const formatDateTime = (date) => {
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
            Convert time between any two timezones with ease
          </p>
        </div>

        {/* Main Converter Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              Time Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timezone Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="source-timezone" className="text-sm font-medium text-slate-700">
                  From Timezone
                </Label>
                <Select value={sourceTimezone} onValueChange={setSourceTimezone}>
                  <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 transition-colors">
                    <SelectValue placeholder="Select source timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500 border-b border-slate-200">
                      MAJOR CITIES
                    </div>
                    {majorCities.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500 border-b border-slate-200 mt-2">
                      ALL TIMEZONES
                    </div>
                    {allTimezones.filter(tz => !majorCities.find(major => major.value === tz.value)).map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-timezone" className="text-sm font-medium text-slate-700">
                  To Timezone
                </Label>
                <Select value={targetTimezone} onValueChange={setTargetTimezone}>
                  <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 transition-colors">
                    <SelectValue placeholder="Select target timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500 border-b border-slate-200">
                      MAJOR CITIES
                    </div>
                    {majorCities.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500 border-b border-slate-200 mt-2">
                      ALL TIMEZONES
                    </div>
                    {allTimezones.filter(tz => !majorCities.find(major => major.value === tz.value)).map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Selection Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="time-mode"
                  checked={useCurrentTime}
                  onCheckedChange={setUseCurrentTime}
                />
                <Label htmlFor="time-mode" className="text-sm font-medium text-slate-700">
                  Use current time
                </Label>
              </div>

              {/* Custom Date/Time Picker */}
              {!useCurrentTime && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-11 border-slate-200"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDate ? format(customDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
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
                    <Label htmlFor="custom-time" className="text-sm font-medium text-slate-700">
                      Select Time
                    </Label>
                    <Input
                      id="custom-time"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="h-11 border-slate-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Convert Button */}
            <div className="text-center">
              <Button 
                onClick={handleConvert}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Convert Time
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Result */}
        {convertedResult && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-center text-slate-800">
                Conversion Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {convertedResult.sourceTimezone.city}
                  </h3>
                  <p className="text-2xl font-bold text-blue-700 mb-1">
                    {formatDateTime(convertedResult.sourceTime)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {convertedResult.sourceTimezone.label}
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {convertedResult.targetTimezone.city}
                  </h3>
                  <p className="text-2xl font-bold text-emerald-700 mb-1">
                    {formatDateTime(convertedResult.targetTime)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {convertedResult.targetTimezone.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Major Cities Current Time */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
                  key={city.value} 
                  className="text-center p-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-slate-700 mb-1 text-sm">
                    {city.city}
                  </h4>
                  <p className="text-lg font-bold text-slate-800">
                    {city.currentTime?.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {city.currentTime?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimezoneConverter;