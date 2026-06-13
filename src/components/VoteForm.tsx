import { useState, useEffect } from 'preact/hooks';
import { useTranslation } from '../i18n/i18n';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

interface SavedVote {
  email: string;
  saturdayAfternoon: boolean;
  saturdayNight: boolean;
  sundayAfternoon: boolean;
}

function mapApiErrorToTranslationKey(errorStr: string): string {
  if (!errorStr) return 'api.error.generic';
  
  const err = errorStr.toLowerCase();
  if (err.includes('valid email')) {
    return 'api.error.valid_email_required';
  }
  if (err.includes('database')) {
    return 'api.error.database_not_found';
  }
  if (err.includes('already been registered') || err.includes('different email')) {
    return 'api.error.device_already_voted';
  }
  return 'api.error.generic';
}

export default function VoteForm() {
  const { t, locale } = useTranslation();

  const [email, setEmail] = useState('');
  const [saturdayAfternoon, setSaturdayAfternoon] = useState(false);
  const [saturdayNight, setSaturdayNight] = useState(false);
  const [sundayAfternoon, setSundayAfternoon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'summary' | 'editing'>('form');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savedState, setSavedState] = useState<SavedVote | null>(null);

  // Set the document title based on selected locale
  useEffect(() => {
    document.title = locale === 'es' ? 'QuesaRave — Confirma tu Asistencia' : 'QuesaRave — Confirm Your Attendance';
  }, [locale]);

  // Load from localstorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('quesarave_vote');
      if (stored) {
        const parsed = JSON.parse(stored) as SavedVote;
        setEmail(parsed.email || '');
        setSaturdayAfternoon(!!parsed.saturdayAfternoon);
        setSaturdayNight(!!parsed.saturdayNight);
        setSundayAfternoon(!!parsed.sundayAfternoon);
        setSavedState(parsed);
        setViewMode('summary');
      }
    } catch (e) {
      console.error('Error loading stored vote:', e);
    }
  }, []);

  // Toast auto-dismiss after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // 1. Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setToast({ message: t('toast.invalid_email'), type: 'error' });
      return;
    }

    const payload: SavedVote = {
      email: cleanEmail,
      saturdayAfternoon,
      saturdayNight,
      sundayAfternoon,
    };

    // 2. Client-side dirty check for updates
    if (viewMode === 'editing' && savedState) {
      const isUnchanged =
        payload.email === savedState.email &&
        payload.saturdayAfternoon === savedState.saturdayAfternoon &&
        payload.saturdayNight === savedState.saturdayNight &&
        payload.sundayAfternoon === savedState.sundayAfternoon;

      if (isUnchanged) {
        setToast({ message: t('toast.already_voted'), type: 'info' });
        setViewMode('summary');
        return;
      }
    }

    // 3. API Submission
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        const errorKey = mapApiErrorToTranslationKey(result.error);
        setToast({ message: t(errorKey), type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Save to local storage
      localStorage.setItem('quesarave_vote', JSON.stringify(payload));
      setSavedState(payload);

      if (result.updated) {
        setToast({ message: t('toast.modified'), type: 'success' });
      } else {
        setToast({ message: t('toast.confirmed'), type: 'success' });
      }

      setViewMode('summary');
    } catch (err) {
      setToast({ message: t('toast.network_error'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModify = () => {
    setViewMode('editing');
  };

  const isAttending = (state: SavedVote) => {
    return state.saturdayAfternoon || state.saturdayNight || state.sundayAfternoon;
  };

  return (
    <div class="relative w-full">
      {/* Toast Notifications */}
      {toast && (
        <div
          aria-live="polite"
          class={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-xl text-sm font-medium animate-fade-in shadow-xl backdrop-blur-md border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-955/90 text-rose-200 border-rose-900/60'
              : 'bg-cyan-950/90 text-cyan-200 border-cyan-800/80'
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Headings */}
      <div class="mb-8 text-center animate-fade-in">
        <h1 class="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t('heading.title.prefix')}<span class="text-neon-cyan">{t('heading.title.accent')}</span>
        </h1>
        <p class="mt-3 text-sm text-gray-400 sm:text-base leading-relaxed max-w-md mx-auto">
          {t('heading.subtitle')}
        </p>
      </div>

      {/* SUMMARY VIEW */}
      {viewMode === 'summary' && savedState ? (
        <div class="glass-panel p-5 sm:p-8 shadow-glass animate-fade-in text-left">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-heading text-2xl font-bold text-white tracking-wide">
              {t('summary.title')}
            </h2>
            <div
              class={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${
                isAttending(savedState)
                  ? 'bg-cyan-500/10 text-neon-cyan border-neon-cyan/20'
                  : 'bg-magenta-500/10 text-neon-magenta border-neon-magenta/20'
              }`}
            >
              {isAttending(savedState) ? t('summary.attending') : t('summary.not_attending')}
            </div>
          </div>

          <div class="space-y-4 mb-8">
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t('summary.email_label')}</p>
              <p class="text-base text-gray-200 font-medium mt-0.5">{maskEmail(savedState.email)}</p>
            </div>

            {isAttending(savedState) ? (
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">{t('summary.sessions_label')}</p>
                <div class="grid gap-2">
                  {savedState.saturdayAfternoon && (
                    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-surface border border-glass-border">
                      <span class="text-sm">☀️</span>
                      <span class="text-xs text-gray-300 font-medium">{t('session.sat_aft')}</span>
                    </div>
                  )}
                  {savedState.saturdayNight && (
                    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-surface border border-glass-border">
                      <span class="text-sm">🌙</span>
                      <span class="text-xs text-gray-300 font-medium">{t('session.sat_night')}</span>
                    </div>
                  )}
                  {savedState.sundayAfternoon && (
                    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-surface border border-glass-border">
                      <span class="text-sm">🌅</span>
                      <span class="text-xs text-gray-300 font-medium">{t('session.sun_aft')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{t('summary.sessions_label')}</p>
                <p class="text-sm text-gray-400 italic">None selected (Not attending)</p>
              </div>
            )}
          </div>

          <button
            onClick={handleModify}
            class="w-full py-3 rounded-xl border border-glass-border text-gray-300 hover:text-white hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all duration-200 font-semibold text-sm cursor-pointer mb-3"
          >
            {t('summary.modify')}
          </button>
          <a
            href="/results"
            class="block text-center text-xs text-gray-400 hover:text-neon-cyan transition-colors py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-neon-cyan/40 rounded"
          >
            {t('nav.view_results')}
          </a>
        </div>
      ) : (
        /* FORM / EDITING VIEW */
        <form onSubmit={handleSubmit} class="glass-panel p-5 sm:p-8 shadow-glass text-left">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-400 mb-2" for="email">
              {t('form.email.label')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autocomplete="email"
              spellcheck={false}
              value={email}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder={t('form.email.placeholder')}
              required
              class="w-full rounded-xl border border-glass-border bg-dark-surface px-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-200 focus:border-neon-cyan focus:shadow-neon-cyan focus:ring-1 focus:ring-neon-cyan/50"
            />
          </div>

          <div class="mb-6">
            <span class="block text-sm font-medium text-gray-400 mb-3">
              {t('form.sessions.label')}
            </span>
            <div class="grid gap-3">
              {/* Session 1: Saturday Afternoon */}
              <div
                role="checkbox"
                aria-checked={saturdayAfternoon}
                tabIndex={0}
                onClick={() => setSaturdayAfternoon(!saturdayAfternoon)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSaturdayAfternoon(!saturdayAfternoon);
                  }
                }}
                class={`cursor-pointer rounded-xl p-3.5 border transition-all duration-150 select-none ${
                  saturdayAfternoon
                    ? 'border-neon-cyan bg-neon-cyan/5 shadow-neon-cyan-inset'
                    : 'border-glass-border bg-dark-surface hover:border-gray-500'
                }`}
              >
                <div class="flex items-center gap-3">
                  <div class="text-lg">☀️</div>
                  <div class="flex-1">
                    <p class="font-medium text-white text-sm">{t('form.session.sat_aft.title')}</p>
                    <p class="text-xs text-gray-400">{t('form.session.sat_aft.desc')}</p>
                  </div>
                  <div
                    class={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                      saturdayAfternoon ? 'border-neon-cyan bg-neon-cyan' : 'border-gray-600'
                    }`}
                  >
                    {saturdayAfternoon && (
                      <svg
                        class="h-3.5 w-3.5 text-dark-bg stroke-[3px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Session 2: Saturday Night */}
              <div
                role="checkbox"
                aria-checked={saturdayNight}
                tabIndex={0}
                onClick={() => setSaturdayNight(!saturdayNight)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSaturdayNight(!saturdayNight);
                  }
                }}
                class={`cursor-pointer rounded-xl p-3.5 border transition-all duration-150 select-none ${
                  saturdayNight
                    ? 'border-neon-cyan bg-neon-cyan/5 shadow-neon-cyan-inset'
                    : 'border-glass-border bg-dark-surface hover:border-gray-500'
                }`}
              >
                <div class="flex items-center gap-3">
                  <div class="text-lg">🌙</div>
                  <div class="flex-1">
                    <p class="font-medium text-white text-sm">{t('form.session.sat_night.title')}</p>
                    <p class="text-xs text-gray-400">{t('form.session.sat_night.desc')}</p>
                  </div>
                  <div
                    class={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                      saturdayNight ? 'border-neon-cyan bg-neon-cyan' : 'border-gray-600'
                    }`}
                  >
                    {saturdayNight && (
                      <svg
                        class="h-3.5 w-3.5 text-dark-bg stroke-[3px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Session 3: Sunday Afternoon */}
              <div
                role="checkbox"
                aria-checked={sundayAfternoon}
                tabIndex={0}
                onClick={() => setSundayAfternoon(!sundayAfternoon)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSundayAfternoon(!sundayAfternoon);
                  }
                }}
                class={`cursor-pointer rounded-xl p-3.5 border transition-all duration-150 select-none ${
                  sundayAfternoon
                    ? 'border-neon-cyan bg-neon-cyan/5 shadow-neon-cyan-inset'
                    : 'border-glass-border bg-dark-surface hover:border-gray-500'
                }`}
              >
                <div class="flex items-center gap-3">
                  <div class="text-lg">🌅</div>
                  <div class="flex-1">
                    <p class="font-medium text-white text-sm">{t('form.session.sun_aft.title')}</p>
                    <p class="text-xs text-gray-400">{t('form.session.sun_aft.desc')}</p>
                  </div>
                  <div
                    class={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                      sundayAfternoon ? 'border-neon-cyan bg-neon-cyan' : 'border-gray-600'
                    }`}
                  >
                    {sundayAfternoon && (
                      <svg
                        class="h-3.5 w-3.5 text-dark-bg stroke-[3px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            class={`w-full py-4 rounded-xl font-heading font-bold text-white transition-all duration-200 tracking-wide cursor-pointer mb-3 ${
              isSubmitting
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
                : 'bg-gradient-to-r from-dark-btn-from to-dark-btn-to hover:shadow-neon-btn-hover hover:scale-[1.01] active:scale-[0.99] border border-neon-cyan/30 shadow-neon-btn'
            }`}
          >
            {isSubmitting ? (
              <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('form.submitting')}
              </span>
            ) : (
              t('form.submit')
            )}
          </button>
          <a
            href="/results"
            class="block text-center text-xs text-gray-400 hover:text-neon-cyan transition-colors py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-neon-cyan/40 rounded"
          >
            {t('nav.view_results')}
          </a>
        </form>
      )}
    </div>
  );
}
