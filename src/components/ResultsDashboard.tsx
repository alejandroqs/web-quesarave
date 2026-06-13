import { useState, useEffect } from 'preact/hooks';
import { useTranslation } from '../i18n/i18n';

interface ResultsData {
  totalResponses: number;
  totalAttending: number;
  totalNotAttending: number;
  sessions: {
    saturdayAfternoon: number;
    saturdayNight: number;
    sundayAfternoon: number;
  };
}

export default function ResultsDashboard() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set the document title based on selected locale
  useEffect(() => {
    document.title = locale === 'es' ? 'QuesaRave — Resultados' : 'QuesaRave — Results';
  }, [locale]);

  const fetchResults = async (isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
    } else {
      setIsPolling(true);
    }

    try {
      const res = await fetch('/api/results');
      if (!res.ok) {
        throw new Error('Failed to fetch results');
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        throw new Error(json.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      if (!isBackground) {
        setError(err.message || 'Error loading results');
      }
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchResults();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchResults(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getPct = (val: number) => {
    const totalResponses = data?.totalResponses || 0;
    if (totalResponses === 0) return 0;
    return Math.round((val / totalResponses) * 100);
  };

  if (isLoading) {
    return (
      <div class="glass-panel p-8 shadow-glass text-center animate-fade-in max-w-lg mx-auto w-full">
        <div class="flex flex-col items-center justify-center py-12 gap-4">
          <svg class="animate-spin h-8 w-8 text-neon-cyan" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="text-sm text-gray-400 font-medium tracking-wide">{t('results.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div class="glass-panel p-8 shadow-glass text-center animate-fade-in max-w-lg mx-auto w-full border-rose-900/60 bg-rose-955/20">
        <div class="flex flex-col items-center justify-center py-6 gap-4">
          <span class="text-3xl">⚠️</span>
          <p class="text-sm text-rose-200 font-medium">{t('results.error_loading')}</p>
          <button
            onClick={() => fetchResults(false)}
            class="px-4 py-2 rounded-xl border border-rose-800 text-rose-200 hover:bg-rose-900/40 transition-all text-xs font-semibold uppercase cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="glass-panel p-5 sm:p-8 shadow-glass animate-fade-in text-left max-w-lg mx-auto w-full relative">
      {/* Live Polling Indicator */}
      <div class="absolute top-5 right-6 flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-900/30">
        <span class="relative flex h-1.5 w-1.5">
          <span class="animate-pulse-live absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span class="tracking-wider uppercase text-[10px] font-semibold">{t('results.live_indicator')}</span>
      </div>

      <h2 class="font-heading text-2xl font-bold text-white tracking-wide mb-1 pr-16">
        {t('results.title')}
      </h2>
      <p class="text-xs text-gray-400 mb-8 leading-relaxed">
        {t('results.subtitle')}
      </p>

      {/* Main Aggregates - Single Badge */}
      <div class="flex justify-center mb-8">
        <div class="bg-dark-surface/50 border border-glass-border rounded-xl p-4 px-8 text-center min-w-[160px] shadow-sm">
          <p class="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
            {t('results.total_responses')}
          </p>
          <p class="text-3xl font-heading font-bold text-neon-cyan animate-fade-in">
            {data.totalResponses}
          </p>
        </div>
      </div>

      {/* Session Breakdown Section */}
      <div class="mb-8">
        <h3 class="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">
          {t('results.session_breakdown')}
        </h3>
        
        {data.totalResponses > 0 ? (
          <div class="space-y-4">
            {/* Session 1: Saturday Afternoon */}
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-medium">
                <span class="text-gray-200">☀️ {t('session.sat_aft')}</span>
                <span class="text-gray-300 font-semibold">
                  {data.sessions.saturdayAfternoon} <span class="text-[10px] text-gray-500">({getPct(data.sessions.saturdayAfternoon)}%)</span>
                </span>
              </div>
              <div 
                role="progressbar" 
                aria-valuenow={getPct(data.sessions.saturdayAfternoon)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('session.sat_aft')}
                class="w-full bg-dark-bg/60 rounded-full h-2.5 overflow-hidden border border-glass-border"
              >
                <div 
                  class="h-full bg-gradient-to-r from-neon-cyan/70 to-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.25)] transition-all duration-500 ease-out" 
                  style={{ width: `${getPct(data.sessions.saturdayAfternoon)}%` }}
                />
              </div>
            </div>

            {/* Session 2: Saturday Night */}
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-medium">
                <span class="text-gray-200">🌙 {t('session.sat_night')}</span>
                <span class="text-gray-300 font-semibold">
                  {data.sessions.saturdayNight} <span class="text-[10px] text-gray-500">({getPct(data.sessions.saturdayNight)}%)</span>
                </span>
              </div>
              <div 
                role="progressbar" 
                aria-valuenow={getPct(data.sessions.saturdayNight)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('session.sat_night')}
                class="w-full bg-dark-bg/60 rounded-full h-2.5 overflow-hidden border border-glass-border"
              >
                <div 
                  class="h-full bg-gradient-to-r from-neon-cyan/70 to-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.25)] transition-all duration-500 ease-out" 
                  style={{ width: `${getPct(data.sessions.saturdayNight)}%` }}
                />
              </div>
            </div>

            {/* Session 3: Sunday Afternoon */}
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-medium">
                <span class="text-gray-200">🌅 {t('session.sun_aft')}</span>
                <span class="text-gray-300 font-semibold">
                  {data.sessions.sundayAfternoon} <span class="text-[10px] text-gray-500">({getPct(data.sessions.sundayAfternoon)}%)</span>
                </span>
              </div>
              <div 
                role="progressbar" 
                aria-valuenow={getPct(data.sessions.sundayAfternoon)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('session.sun_aft')}
                class="w-full bg-dark-bg/60 rounded-full h-2.5 overflow-hidden border border-glass-border"
              >
                <div 
                  class="h-full bg-gradient-to-r from-neon-cyan/70 to-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.25)] transition-all duration-500 ease-out" 
                  style={{ width: `${getPct(data.sessions.sundayAfternoon)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div class="text-center py-6 bg-dark-surface/30 border border-glass-border border-dashed rounded-xl">
            <p class="text-xs text-gray-500 italic">No registrations for sessions yet</p>
          </div>
        )}
      </div>

      {/* Back Link */}
      <a
        href="/"
        class="block text-center text-xs text-gray-400 hover:text-neon-cyan transition-colors mt-6 font-semibold py-1 focus:outline-none focus:ring-1 focus:ring-neon-cyan/40 rounded"
      >
        {t('results.back_link')}
      </a>
    </div>
  );
}
