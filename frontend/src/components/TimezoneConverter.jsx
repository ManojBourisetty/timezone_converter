import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Clock, Copy, Heart, Star, Plus, Search, X } from 'lucide-react';
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

// ============================================================================
// Main Component
// ============================================================================

export default function TimezoneConverter() {
  const [selectedTimezones, setSelectedTimezones] = useState([
    { v: -5, l: 'UTC-5 (New York)' },
    { v: 0, l: 'UTC (London)' },
    { v: 5.5, l: 'UTC+5:30 (New Delhi)' },
  ]);

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

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteTimezones', JSON.stringify(favorites));
  }, [favorites]);

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

  // Filter timezones by search
  const filteredTimezones = TIMEZONE_DATA.filter((tz) => {
    const query = searchQuery.toLowerCase();
    return tz.l.toLowerCase().includes(query);
  });

  const isFavorite = (offset) => favorites.some((f) => f.v === offset);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ⏰ Timezone Converter
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare multiple timezones in real-time with favorites and advanced features
        </p>
      </div>

      {/* BROWSER LOCAL TIME BAR (Sticky) */}
      <Card className="sticky top-0 z-10 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">Your Browser Local Time</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatDate(time)} · {formatTime12(time)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setSearchOpen(true)}
          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Timezone
        </Button>

        {favorites.length > 0 && (
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {favorites.slice(0, 3).map((tz) => (
              <Button
                key={tz.v}
                onClick={() => addTimezone(tz)}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Star className="w-4 h-4 fill-yellow-400" />
                {tz.l.split(' ')[0]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* TIMEZONE CARDS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {selectedTimezones.map((tz) => {
          const tzTime = calculateTime(tz.v);
          const formattedTime = formatTime12(tzTime);
          const formattedDate = formatDate(tzTime);
          const timeOnly = formatTimeOnly(tzTime);

          return (
            <Card key={tz.v} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              {/* Gradient background indicator */}
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
                    {/* Favorite button */}
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

                    {/* Delete button */}
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
                {/* Time display */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{timeOnly}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{formattedDate}</p>
                </div>

                {/* Full datetime display */}
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm font-mono">
                  <div className="text-gray-700 dark:text-gray-300">{formattedTime}</div>
                </div>

                {/* Action buttons */}
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

                {/* Time offset badge */}
                <Badge variant="secondary" className="w-full justify-center">
                  Offset: {tz.v > 0 ? '+' : ''}{tz.v} hours from UTC
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
        <p>✨ Enhanced timezone converter with favorites, real-time updates, and copy-to-clipboard • 100% Client-Side</p>
      </div>
    </div>
  );
}
