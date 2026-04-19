import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TimezoneConverter from "./components/TimezoneConverter";

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