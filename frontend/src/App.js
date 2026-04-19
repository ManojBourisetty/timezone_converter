import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TimezoneConverter from "./components/TimezoneConverter";

function BrowserLocalTimeBar() {
  const [now, setNow] = useState(new Date());
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Timezone";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const prettyTime = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  return (
    <div className="sticky top-0 z-50 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
        <p className="font-semibold text-slate-700" data-testid="app-local-time-text">
          Your local browser time: <span className="text-blue-700">{prettyTime}</span>
        </p>
        <p className="text-slate-600" data-testid="app-local-timezone-text">
          Timezone: {browserTimezone}
        </p>
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Keep a console trace so production runtime issues are visible in DevTools.
    console.error("UI runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-slate-200 p-6 text-center">
            <h1 className="text-xl font-semibold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-4">The app hit an unexpected error while loading.</p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <div className="App">
      <AppErrorBoundary>
        <BrowserRouter>
          <BrowserLocalTimeBar />
          <Routes>
            <Route path="/" element={<TimezoneConverter />} />
            <Route path="*" element={<TimezoneConverter />} />
          </Routes>
        </BrowserRouter>
      </AppErrorBoundary>
    </div>
  );
}

export default App;