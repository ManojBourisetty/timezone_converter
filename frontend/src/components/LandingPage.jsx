import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, Clock3, Globe2, Moon, Share2, Sparkles, Sun } from 'lucide-react';

const featureCards = [
  {
    title: 'World Clock Wall',
    description: 'See live city times side by side with DST-aware rendering.',
    icon: Globe2,
    href: '/app?view=world',
    cta: 'Open World Clock',
  },
  {
    title: 'Fast Time Converter',
    description: 'Convert between zones in seconds with date-shift awareness.',
    icon: Clock3,
    href: '/app?view=converter',
    cta: 'Open Converter',
  },
  {
    title: 'Meeting Planner',
    description: 'Plan with work-hour visibility, app links, and export-ready invites.',
    icon: CalendarClock,
    href: '/app?view=meeting',
    cta: 'Open Planner',
  },
  {
    title: 'Quick City Workflow',
    description: 'Pin city-specific cards instantly and share exact selections by URL.',
    icon: Share2,
    href: '/app?view=world',
    cta: 'Try Quick City',
  },
];

const heroCities = [
  { name: 'New York', timeZone: 'America/New_York' },
  { name: 'London', timeZone: 'Europe/London' },
  { name: 'Tokyo', timeZone: 'Asia/Tokyo' },
];

const formatCityTime = (date, timeZone) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const formatCityDate = (date, timeZone) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

function LandingPage({ theme = 'light', onToggleTheme = () => {} }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const cityTimeRows = useMemo(() => {
    return heroCities.map((city) => ({
      ...city,
      timeText: formatCityTime(now, city.timeZone),
      dateText: formatCityDate(now, city.timeZone),
    }));
  }, [now]);

  return (
    <div className="landing-shell min-h-screen text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900/10 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="landing-brand text-sm uppercase tracking-[0.25em] text-cyan-700/90 dark:text-cyan-200/90">
            Timezone Studio
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-indigo-600" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <a
              href="/app?view=world"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-300/25 dark:text-cyan-100"
            >
              Launch App
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-12 pt-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:pt-20">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/45 bg-fuchsia-300/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700 dark:border-fuchsia-300/35 dark:bg-fuchsia-300/10 dark:text-fuchsia-100">
              <Sparkles className="h-3.5 w-3.5" />
              Global Scheduling, Refined
            </p>

            <h1 className="landing-title text-4xl leading-[0.94] text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
              Every timezone decision in one elegant workspace.
            </h1>

            <p className="max-w-xl text-base text-slate-700/90 dark:text-slate-200/85 sm:text-lg">
              Track world clocks, convert times, and coordinate meetings without context switching.
              Built for distributed teams that need speed and clarity.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/app?view=world"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Start with World Clock
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/25 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                Explore Features
              </a>
            </div>

            <div className="landing-clock-strip grid gap-2 rounded-2xl border border-slate-300/70 bg-white/70 p-3 backdrop-blur-sm dark:border-white/12 dark:bg-white/[0.04] sm:grid-cols-3">
              {cityTimeRows.map((city) => (
                <div key={city.name} className="landing-clock-chip rounded-xl border border-slate-300/80 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-slate-950/45">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700/80 dark:text-cyan-200/75">{city.name}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{city.timeText}</p>
                  <p className="text-xs text-slate-600/85 dark:text-slate-300/85">{city.dateText}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[22rem] w-full max-w-md">
            <div className="landing-orb absolute inset-0 rounded-[2rem] border border-white/10 bg-slate-900/50 shadow-2xl shadow-cyan-500/20 backdrop-blur-md" />
            <div className="landing-ring landing-ring-a" />
            <div className="landing-ring landing-ring-b" />
            <div className="landing-ring landing-ring-c" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="landing-core flex h-32 w-32 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-400/20 text-cyan-100">
                <Globe2 className="h-11 w-11" />
              </div>
            </div>
            <div className="absolute left-5 top-7 rounded-lg border border-slate-300/80 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200">
              {cityTimeRows[0].name} {cityTimeRows[0].timeText}
            </div>
            <div className="absolute bottom-9 right-6 rounded-lg border border-slate-300/80 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200">
              {cityTimeRows[2].name} {cityTimeRows[2].timeText}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-700/80 dark:text-cyan-200/80">What You Can Do</p>
              <h2 className="landing-title mt-2 text-3xl text-slate-900 dark:text-white sm:text-4xl">Move from timezone chaos to confident planning</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-300/70 bg-white/70 p-5 shadow-xl shadow-slate-300/25 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:shadow-slate-950/30 dark:hover:border-cyan-300/40 dark:hover:bg-white/[0.07]"
                >
                  <div className="mb-4 inline-flex rounded-xl border border-cyan-300/40 bg-cyan-300/20 p-2 text-cyan-700 dark:border-cyan-200/30 dark:bg-cyan-300/10 dark:text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
                  <a
                    href={feature.href}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition group-hover:text-cyan-600 dark:text-cyan-200 dark:group-hover:text-cyan-100"
                  >
                    {feature.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/60 dark:border-slate-800/60 py-8 text-center text-xs text-slate-500 dark:text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} <span className="font-semibold text-slate-700 dark:text-slate-300">Manoj Bourisetty</span>. All rights reserved.</p>
        <p>Licensed under the <span className="font-medium">MIT License</span> · Powered by <span className="font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">GitHub Copilot AI</span></p>
      </footer>
    </div>
  );
}

export default LandingPage;
