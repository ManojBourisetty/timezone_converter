import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TimezoneConverter from "./components/TimezoneConverter";
import LandingPage from "./components/LandingPage";

const THEME_STORAGE_KEY = "timezone_theme_preference";

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

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
  const [theme, setTheme] = React.useState(getInitialTheme);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  return (
    <div className="App">
      <AppErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
            <Route path="/app" element={<TimezoneConverter theme={theme} onToggleTheme={toggleTheme} />} />
            <Route path="*" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
          </Routes>
        </BrowserRouter>
      </AppErrorBoundary>
    </div>
  );
}

export default App;