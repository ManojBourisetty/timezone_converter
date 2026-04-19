import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ArrowRight, Briefcase, CalendarPlus, Clock, Copy, Download, Heart, Link2, Plus, Search, Sparkles, Star, Trash2, Users, X } from 'lucide-react';
import { TIMEZONE_DATA, MAJOR_CITIES } from '../data/timezoneData';

// ============================================================================
// Utility Functions (Proven Working From Reference)
// ============================================================================

const pad = (n) => String(n).padStart(2, '0');

const formatTime12 = (date) => {
  const h = date.getUTCHours();
  const m = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${pad(h % 12 || 12)}:${m}:${s} ${h >= 12 ? 'PM' : 'AM'}`;
};

const formatTimeOnly = (date) => {
  const h = date.getUTCHours();
  const m = pad(date.getUTCMinutes());
  return `${pad(h % 12 || 12)}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
};

const formatDate = (date) => {
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
};

const parseHHMM = (hhmm) => {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return 0;
  }
  return h * 60 + m;
};

const defaultTimezones = [
  { v: -5, l: 'UTC-5 (New York)' },
  { v: 0, l: 'UTC (London)' },
  { v: 5.5, l: 'UTC+5:30 (New Delhi)' },
];

const getTodayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const toUtcRange = (meetingDate, meetingStart, meetingHostOffset, meetingDuration) => {
  const [year, month, day] = (meetingDate || getTodayISO()).split('-').map(Number);
  const utcMidnight = Date.UTC(year, (month || 1) - 1, day || 1, 0, 0, 0);
  const startMinutes = parseHHMM(meetingStart || '09:00');
  const duration = Math.max(15, Math.min(480, Number(meetingDuration) || 60));
  const utcStart = utcMidnight + (startMinutes - meetingHostOffset * 60) * 60000;
  const utcEnd = utcStart + duration * 60000;
  return { utcStart, utcEnd, duration };
};

const formatICSDate = (msUtc) => {
  const d = new Date(msUtc);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
};

const buildICSContent = ({ title, description, location, utcStart, utcEnd }) => {
  const uid = `tz-${utcStart}-${Math.random().toString(36).slice(2, 10)}@timezone-converter`;
  const dtstamp = formatICSDate(Date.now());
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Timezone Converter//Meeting Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatICSDate(utcStart)}`,
    `DTEND:${formatICSDate(utcEnd)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
};

const parseOffsetsFromQuery = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));
};

const toHHMM = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

const getDateShift = (fromDate, toDate) => {
  const baseFrom = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
  const baseTo = Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate());
  const diffDays = Math.round((baseTo - baseFrom) / 86400000);

  if (diffDays > 0) return ' (next day)';
  if (diffDays < 0) return ' (previous day)';
  return '';
};

const findOverlapSlots = (timezones, durationMinutes) => {
  const slots = [];
  if (!timezones.length || durationMinutes <= 0) {
    return slots;
  }

  for (let utcMinute = 0; utcMinute < 24 * 60; utcMinute += 30) {
    const fits = timezones.every((tz) => {
      const localStart = ((utcMinute + tz.v * 60) % 1440 + 1440) % 1440;
      const localEnd = localStart + durationMinutes;
      return localStart >= 9 * 60 && localEnd <= 17 * 60;
    });

    if (fits) {
      slots.push(utcMinute);
    }
  }

  return slots.slice(0, 8);
};

// ============================================================================
// Main Component
// ============================================================================

export default function TimezoneConverter() {
  const [activeView, setActiveView] = useState('world');
  const [selectedTimezones, setSelectedTimezones] = useState(defaultTimezones);

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favoriteTimezones')) || [];
    } catch {
      return [];
    }
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(new Date());
  const [copied, setCopied] = useState(null);
  const [converterFrom, setConverterFrom] = useState(-5);
  const [converterTo, setConverterTo] = useState(0);
  const [converterTime, setConverterTime] = useState('09:00');
  const [meetingDate, setMeetingDate] = useState(() => {
    return getTodayISO();
  });
  const [meetingHostOffset, setMeetingHostOffset] = useState(-5);
  const [meetingStart, setMeetingStart] = useState('09:00');
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingTitle, setMeetingTitle] = useState('Global Team Meeting');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showAdvancedPlanner, setShowAdvancedPlanner] = useState(false);
  const [teamProfiles, setTeamProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('teamProfiles')) || [];
    } catch {
      return [];
    }
  });
  const [profileName, setProfileName] = useState('');
  const [profileTimezone, setProfileTimezone] = useState(-5);
  const [profileWorkStart, setProfileWorkStart] = useState('09:00');
  const [profileWorkEnd, setProfileWorkEnd] = useState('17:00');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tzParam = params.get('tz');
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const hostParam = params.get('host');
    const dateParam = params.get('date');
    const startParam = params.get('start');
    const durationParam = params.get('duration');

    if (viewParam && ['world', 'converter', 'meeting', 'overlap'].includes(viewParam)) {
      setActiveView(viewParam);
    }

    const offsets = parseOffsetsFromQuery(tzParam)
      .map((offset) => TIMEZONE_DATA.find((tz) => tz.v === offset))
      .filter(Boolean);
    if (offsets.length) {
      setSelectedTimezones(offsets);
    }

    if (fromParam && !Number.isNaN(Number(fromParam))) setConverterFrom(Number(fromParam));
    if (toParam && !Number.isNaN(Number(toParam))) setConverterTo(Number(toParam));
    if (hostParam && !Number.isNaN(Number(hostParam))) setMeetingHostOffset(Number(hostParam));
    if (dateParam) setMeetingDate(dateParam);
    if (startParam) setMeetingStart(startParam);
    if (durationParam && !Number.isNaN(Number(durationParam))) setMeetingDuration(Number(durationParam));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('view', activeView);
    params.set('tz', selectedTimezones.map((tz) => tz.v).join(','));
    params.set('from', String(converterFrom));
    params.set('to', String(converterTo));
    params.set('host', String(meetingHostOffset));
    params.set('date', meetingDate);
    params.set('start', meetingStart);
    params.set('duration', String(meetingDuration));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeView, converterFrom, converterTo, meetingDate, meetingDuration, meetingHostOffset, meetingStart, selectedTimezones]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteTimezones', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('teamProfiles', JSON.stringify(teamProfiles));
  }, [teamProfiles]);

  // Calculate time for a timezone
  const calculateTime = (offset) => {
    const now = Date.now();
    return new Date(now + offset * 3600000);
  };

  // Handle adding timezone
  const addTimezone = (tz) => {
    if (!selectedTimezones.find((t) => t.v === tz.v)) {
      setSelectedTimezones([...selectedTimezones, tz]);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Handle removing timezone
  const removeTimezone = (offset) => {
    setSelectedTimezones(selectedTimezones.filter((t) => t.v !== offset));
  };

  // Handle favorite toggle
  const toggleFavorite = (offset) => {
    setFavorites((prev) => {
      const isFavorite = prev.find((f) => f.v === offset);
      return isFavorite ? prev.filter((f) => f.v !== offset) : [...prev, TIMEZONE_DATA.find((t) => t.v === offset)];
    });
  };

  // Handle copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const addTeamProfile = () => {
    const name = profileName.trim();
    if (!name) return;
    const newProfile = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      timezone: profileTimezone,
      workStart: profileWorkStart,
      workEnd: profileWorkEnd,
    };
    setTeamProfiles((prev) => [...prev, newProfile]);
    setProfileName('');
  };

  const removeTeamProfile = (id) => {
    setTeamProfiles((prev) => prev.filter((profile) => profile.id !== id));
  };

  const applyTeamTimezones = () => {
    const tzMap = new Map(selectedTimezones.map((tz) => [tz.v, tz]));
    teamProfiles.forEach((profile) => {
      const matched = TIMEZONE_DATA.find((tz) => tz.v === profile.timezone);
      if (matched) tzMap.set(matched.v, matched);
    });
    setSelectedTimezones(Array.from(tzMap.values()));
  };

  const copyShareableLink = () => {
    if (typeof window === 'undefined') return;
    copyToClipboard(window.location.href, 'share-link');
  };

  const exportMeetingAsICS = () => {
    if (!meetingDate || !meetingStart) return;
    const { utcStart, utcEnd } = toUtcRange(meetingDate, meetingStart, meetingHostOffset, meetingDuration);
    const ics = buildICSContent({
      title: meetingTitle || 'Global Team Meeting',
      description: `${meetingSummary || 'Meeting scheduled from Timezone Converter planner.'}${meetingNotes ? `\n\nNotes: ${meetingNotes}` : ''}`,
      location: 'Online',
      utcStart,
      utcEnd,
    });

    if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting-${meetingDate}-${meetingStart.replace(':', '')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setCopied('ics-export');
      setTimeout(() => setCopied(null), 2000);
    } else {
      copyToClipboard(ics, 'ics-export');
    }
  };

  const meetingWindow = useMemo(
    () => toUtcRange(meetingDate, meetingStart, meetingHostOffset, meetingDuration),
    [meetingDate, meetingDuration, meetingHostOffset, meetingStart]
  );

  const meetingIntegrationLinks = useMemo(() => {
    const startIso = new Date(meetingWindow.utcStart).toISOString();
    const endIso = new Date(meetingWindow.utcEnd).toISOString();
    const details = `${meetingTitle || 'Global meeting'}${meetingNotes ? `\n\n${meetingNotes}` : ''}`;
    const dates = `${formatICSDate(meetingWindow.utcStart)}/${formatICSDate(meetingWindow.utcEnd)}`;
    const title = meetingTitle || 'Global Team Meeting';

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${encodeURIComponent(dates)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent('Google Meet')}`,
      teams: `https://teams.microsoft.com/l/meeting/new?subject=${encodeURIComponent(title)}&startTime=${encodeURIComponent(startIso)}&endTime=${encodeURIComponent(endIso)}&content=${encodeURIComponent(details)}`,
      zoom: `https://zoom.us/meeting/schedule?topic=${encodeURIComponent(title)}&start_time=${encodeURIComponent(startIso)}&duration=${meetingWindow.duration}`,
    };
  }, [meetingNotes, meetingTitle, meetingWindow.duration, meetingWindow.utcEnd, meetingWindow.utcStart]);

  const openMeetingIntegration = (url, id) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank', 'noopener,noreferrer');
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Filter timezones by search
  const filteredTimezones = TIMEZONE_DATA.filter((tz) => {
    const query = searchQuery.toLowerCase();
    return tz.l.toLowerCase().includes(query);
  });

  const isFavorite = (offset) => favorites.some((f) => f.v === offset);

  const converterResult = useMemo(() => {
    const inputMinutes = parseHHMM(converterTime);
    const now = new Date();
    const utcMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const utcMoment = utcMidnight + (inputMinutes - converterFrom * 60) * 60000;

    const fromDate = new Date(utcMoment + converterFrom * 3600000);
    const toDate = new Date(utcMoment + converterTo * 3600000);

    return {
      fromDate,
      toDate,
      fromText: `${formatDate(fromDate)} · ${formatTimeOnly(fromDate)}`,
      toText: `${formatDate(toDate)} · ${formatTimeOnly(toDate)}${getDateShift(fromDate, toDate)}`,
    };
  }, [converterFrom, converterTo, converterTime]);

  const meetingRows = useMemo(() => {
    if (!meetingDate || !meetingStart) {
      return [];
    }

    const { utcStart, utcEnd, duration } = toUtcRange(meetingDate, meetingStart, meetingHostOffset, meetingDuration);
    const profileByTimezone = new Map(teamProfiles.map((profile) => [profile.timezone, profile]));

    return selectedTimezones.map((tz) => {
      const localStart = new Date(utcStart + tz.v * 3600000);
      const localEnd = new Date(utcEnd + tz.v * 3600000);
      const localMinutes = localStart.getUTCHours() * 60 + localStart.getUTCMinutes();
      const profile = profileByTimezone.get(tz.v);
      const workStart = parseHHMM(profile?.workStart || '09:00');
      const workEnd = parseHHMM(profile?.workEnd || '17:00');
      const inWorkHours = localMinutes >= workStart && (localMinutes + duration) <= workEnd;

      return {
        key: tz.v,
        timezoneLabel: tz.l,
        rangeText: `${formatDate(localStart)} ${formatTimeOnly(localStart)} - ${formatTimeOnly(localEnd)}`,
        inWorkHours,
      };
    });
  }, [meetingDate, meetingDuration, meetingHostOffset, meetingStart, selectedTimezones, teamProfiles]);

  const overlapSlots = useMemo(
    () => findOverlapSlots(selectedTimezones, Math.max(15, Math.min(180, Number(meetingDuration) || 60))),
    [meetingDuration, selectedTimezones]
  );

  const meetingSummary = useMemo(() => {
    if (!meetingRows.length) {
      return '';
    }
    return meetingRows
      .map((row) => `${row.timezoneLabel}: ${row.rangeText}${row.inWorkHours ? ' [work-hours]' : ' [off-hours]'}`)
      .join('\n');
  }, [meetingRows]);

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-5 space-y-5 md:space-y-6 overflow-x-hidden">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ⏰ Timezone Converter
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare multiple timezones in real-time, convert times, and plan global meetings
        </p>
      </div>

      {/* BROWSER LOCAL TIME BAR (Sticky) */}
      <Card className="sticky top-0 z-10 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">Your Browser Local Time</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100 break-words">
                {formatDate(time)} · {formatTime12(time)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-3">
        <Button
          onClick={() => setSearchOpen(true)}
          className="w-full lg:flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Timezone
        </Button>

        {favorites.length > 0 && (
          <div className="flex gap-2 flex-wrap lg:flex-nowrap lg:flex-1 min-w-0">
            {favorites.slice(0, 3).map((tz) => (
              <Button
                key={tz.v}
                onClick={() => addTimezone(tz)}
                variant="outline"
                size="sm"
                className="gap-1 min-w-0"
              >
                <Star className="w-4 h-4 fill-yellow-400" />
                <span className="truncate max-w-[9rem]">{tz.l.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        )}

        <Button onClick={copyShareableLink} variant="outline" className="w-full lg:w-auto gap-2" size="lg">
          <Link2 className="w-4 h-4" />
          {copied === 'share-link' ? 'Link Copied!' : 'Share Setup'}
        </Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        <Button
          variant={activeView === 'world' ? 'default' : 'outline'}
          onClick={() => setActiveView('world')}
          className="w-full"
        >
          World Clock
        </Button>
        <Button
          variant={activeView === 'converter' ? 'default' : 'outline'}
          onClick={() => setActiveView('converter')}
          className="w-full"
        >
          Time Converter
        </Button>
        <Button
          variant={activeView === 'meeting' ? 'default' : 'outline'}
          onClick={() => setActiveView('meeting')}
          className="w-full gap-2"
        >
          <Briefcase className="w-4 h-4" />
          Meeting Planner
        </Button>
        <Button
          variant={activeView === 'overlap' ? 'default' : 'outline'}
          onClick={() => setActiveView('overlap')}
          className="w-full gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Best Slots
        </Button>
      </div>

      {activeView === 'world' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {selectedTimezones.map((tz) => {
            const tzTime = calculateTime(tz.v);
            const formattedTime = formatTime12(tzTime);
            const formattedDate = formatDate(tzTime);
            const timeOnly = formatTimeOnly(tzTime);

            return (
              <Card key={tz.v} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tz.l}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {MAJOR_CITIES.find((c) => c.timezone === tz.v)?.city || 'Region'}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        onClick={() => toggleFavorite(tz.v)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isFavorite(tz.v) ? (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        ) : (
                          <Heart className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>

                      {selectedTimezones.length > 1 && (
                        <Button
                          onClick={() => removeTimezone(tz.v)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{timeOnly}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{formattedDate}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm font-mono">
                    <div className="text-gray-700 dark:text-gray-300">{formattedTime}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(formattedTime, `time-${tz.v}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === `time-${tz.v}` ? 'Copied!' : 'Time'}
                    </Button>

                    <Button
                      onClick={() => copyToClipboard(formattedDate, `date-${tz.v}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === `date-${tz.v}` ? 'Copied!' : 'Date'}
                    </Button>
                  </div>

                  <Badge variant="secondary" className="w-full justify-center">
                    Offset: {tz.v > 0 ? '+' : ''}{tz.v} hours from UTC
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeView === 'converter' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Timezone Conversion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">From Timezone</p>
                <select
                  value={converterFrom}
                  onChange={(e) => setConverterFrom(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
                >
                  {TIMEZONE_DATA.map((tz) => (
                    <option key={`from-${tz.v}`} value={tz.v}>{tz.l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Input Time</p>
                <Input type="time" value={converterTime} onChange={(e) => setConverterTime(e.target.value)} />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">To Timezone</p>
                <select
                  value={converterTo}
                  onChange={(e) => setConverterTo(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
                >
                  {TIMEZONE_DATA.map((tz) => (
                    <option key={`to-${tz.v}`} value={tz.v}>{tz.l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Copy Result</p>
                <Button
                  onClick={() => copyToClipboard(converterResult.toText, 'converter-result')}
                  className="w-full gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied === 'converter-result' ? 'Copied!' : 'Copy Converted'}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500 mb-1">Source</p>
                <p className="font-semibold text-lg">{converterResult.fromText}</p>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50/60 dark:bg-blue-950/30">
                <p className="text-sm text-gray-500 mb-1">Converted</p>
                <p className="font-semibold text-lg flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  {converterResult.toText}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'meeting' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meeting Planner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Meeting title</p>
                <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Global Team Meeting" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Notes (optional)</p>
                <Input value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Agenda / context" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Host Timezone</p>
                <select
                  value={meetingHostOffset}
                  onChange={(e) => setMeetingHostOffset(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
                >
                  {selectedTimezones.map((tz) => (
                    <option key={`host-${tz.v}`} value={tz.v}>{tz.l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
                <Input type="time" value={meetingStart} onChange={(e) => setMeetingStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration (minutes)</p>
                <Input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setMeetingDuration(30)}>30 min</Button>
              <Button variant="outline" size="sm" onClick={() => setMeetingDuration(45)}>45 min</Button>
              <Button variant="outline" size="sm" onClick={() => setMeetingDuration(60)}>60 min</Button>
              <Button variant="outline" size="sm" onClick={() => setMeetingDuration(90)}>90 min</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date(Date.now() + 30 * 60000);
                  setMeetingDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
                  setMeetingStart(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
                }}
              >
                Start in 30 min
              </Button>
            </div>

            <div className="rounded-md border p-3 bg-blue-50/50 dark:bg-blue-950/20">
              <p className="font-medium mb-2">Join with meeting apps</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openMeetingIntegration(meetingIntegrationLinks.google, 'google-link')} className="gap-2" variant="outline">
                  Google Meet
                </Button>
                <Button onClick={() => openMeetingIntegration(meetingIntegrationLinks.teams, 'teams-link')} className="gap-2" variant="outline">
                  Microsoft Teams
                </Button>
                <Button onClick={() => openMeetingIntegration(meetingIntegrationLinks.zoom, 'zoom-link')} className="gap-2" variant="outline">
                  Zoom
                </Button>
                <Button onClick={copyShareableLink} className="gap-2" variant="outline">
                  {copied === 'share-link' ? 'Link Copied!' : 'Copy Share Link'}
                </Button>
              </div>
            </div>

            <div className="rounded-md border p-3 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <p className="font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Team Profiles</p>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setShowAdvancedPlanner((prev) => !prev)} variant="outline" size="sm">
                    {showAdvancedPlanner ? 'Hide Advanced' : 'Show Advanced'}
                  </Button>
                  <Button onClick={applyTeamTimezones} variant="outline" size="sm">
                    Apply Team Timezones
                  </Button>
                </div>
              </div>

              {showAdvancedPlanner && (
                <>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <Input
                      placeholder="Name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                    <select
                      value={profileTimezone}
                      onChange={(e) => setProfileTimezone(Number(e.target.value))}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
                    >
                      {TIMEZONE_DATA.map((tz) => (
                        <option key={`profile-${tz.v}`} value={tz.v}>{tz.l}</option>
                      ))}
                    </select>
                    <Input type="time" value={profileWorkStart} onChange={(e) => setProfileWorkStart(e.target.value)} />
                    <Input type="time" value={profileWorkEnd} onChange={(e) => setProfileWorkEnd(e.target.value)} />
                    <Button onClick={addTeamProfile} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Member
                    </Button>
                  </div>

                  {teamProfiles.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {teamProfiles.map((profile) => {
                        const tz = TIMEZONE_DATA.find((item) => item.v === profile.timezone);
                        return (
                          <div key={profile.id} className="rounded border p-2 flex items-center justify-between gap-2">
                            <div className="text-sm min-w-0">
                              <span className="font-medium">{profile.name}</span>
                              <span className="text-gray-600 dark:text-gray-400 break-words"> · {tz?.l || `UTC${profile.timezone >= 0 ? '+' : ''}${profile.timezone}`} · {profile.workStart}-{profile.workEnd}</span>
                            </div>
                            <Button onClick={() => removeTeamProfile(profile.id)} variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              {meetingRows.map((row) => (
                <div key={row.key} className="rounded-md border p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{row.timezoneLabel}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{row.rangeText}</p>
                  </div>
                  <Badge variant={row.inWorkHours ? 'secondary' : 'outline'}>
                    {row.inWorkHours ? 'Inside Work Hours' : 'Outside Work Hours'}
                  </Badge>
                </div>
              ))}
            </div>

            <Button
              onClick={() => copyToClipboard(meetingSummary, 'meeting-summary')}
              variant="outline"
              className="w-full md:w-auto gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied === 'meeting-summary' ? 'Summary Copied!' : 'Copy Meeting Summary'}
            </Button>

            <Button
              onClick={exportMeetingAsICS}
              variant="outline"
              className="w-full md:w-auto gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <Download className="w-4 h-4" />
              {copied === 'ics-export' ? 'ICS Ready!' : 'Export .ics Calendar Invite'}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeView === 'overlap' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Meeting Slots (9AM-5PM Overlap)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Suggested slots are based on overlap where everyone is inside 9:00 AM to 5:00 PM local working hours.
            </p>

            {overlapSlots.length === 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
                No overlap found for the current group and duration. Try reducing duration or removing one timezone.
              </div>
            )}

            <div className="grid gap-3">
              {overlapSlots.map((utcMinute) => (
                <div key={utcMinute} className="rounded-md border p-3">
                  <p className="font-semibold mb-2">UTC Slot: {toHHMM(utcMinute)} - {toHHMM(utcMinute + Math.max(15, Math.min(180, Number(meetingDuration) || 60)))}</p>
                  <div className="grid xl:grid-cols-2 gap-2 text-sm">
                    {selectedTimezones.map((tz) => (
                      <div key={`${utcMinute}-${tz.v}`} className="rounded border border-dashed px-2 py-1">
                        <span className="font-medium">{tz.l}</span>
                        <span className="text-gray-600 dark:text-gray-400">: {toHHMM(utcMinute + tz.v * 60)} - {toHHMM(utcMinute + tz.v * 60 + Math.max(15, Math.min(180, Number(meetingDuration) || 60)))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick city shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📍 Quick City Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {Array.from(new Set(MAJOR_CITIES.map((c) => c.timezone))).map((offset) => {
              const city = MAJOR_CITIES.find((c) => c.timezone === offset);
              const tz = TIMEZONE_DATA.find((t) => t.v === offset);
              if (!city || !tz) return null;

              return (
                <Button
                  key={offset}
                  onClick={() => addTimezone(tz)}
                  variant={selectedTimezones.find((t) => t.v === offset) ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                >
                  {city.city}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* TIMEZONE SEARCH DIALOG */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Timezone</DialogTitle>
            <DialogDescription>
              Search and add one or more timezones to compare live times.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search timezone (e.g., New York, Tokyo, UTC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
              {filteredTimezones.map((tz) => (
                <Button
                  key={tz.v}
                  onClick={() => addTimezone(tz)}
                  variant={selectedTimezones.find((t) => t.v === tz.v) ? 'default' : 'outline'}
                  className="justify-start h-auto py-2"
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="font-semibold">{tz.l}</span>
                    <span className="text-xs text-gray-500">
                      {selectedTimezones.find((t) => t.v === tz.v) && '✓ Added'}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-6 border-t">
        <p>✨ Enhanced timezone converter with world clock, conversion, meeting planner, and best-slot intelligence • 100% Client-Side</p>
      </div>
    </div>
  );
}
