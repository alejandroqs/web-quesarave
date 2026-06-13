import { useState, useEffect } from 'preact/hooks';

export type Locale = 'es' | 'en';

export const translations: Record<Locale, Record<string, string>> = {
  es: {
    'heading.title.prefix': 'Quesa',
    'heading.title.accent': 'Rave',
    'heading.subtitle': 'Prepárate para perderte en la oscuridad de la QuesaRave. El evento del verano llega para unir a todos bajo el poder del bajo. Selecciona los días que asistirás para tener un censo para posibles fincas.',
    'form.email.label': 'Correo Electrónico',
    'form.email.placeholder': 'nombre@dominio.com…',
    'form.sessions.label': 'Selecciona Sesiones',
    'form.session.sat_aft.title': 'Sábado, 22 de agosto',
    'form.session.sat_aft.desc': 'Tardeo de asadero',
    'form.session.sat_night.title': 'Sábado, 22 de agosto',
    'form.session.sat_night.desc': 'Rave hasta que aguante el cuerpo',
    'form.session.sun_aft.title': 'Domingo, 23 de agosto',
    'form.session.sun_aft.desc': 'Piscina climatizada a golpe de bajo',
    'form.submit': 'Confirmar Asistencia',
    'form.submitting': 'Confirmando Asistencia…',
    'summary.title': 'Días que asistiré',
    'summary.attending': 'Asistiré',
    'summary.not_attending': 'No Asistiré',
    'summary.email_label': 'Correo del Usuario',
    'summary.sessions_label': 'Sesiones Seleccionadas',
    'summary.modify': 'Modificar mi Respuesta',
    'toast.invalid_email': 'Por favor ingresa un correo electrónico válido.',
    'toast.already_voted': 'Ya has votado. Aquí está tu respuesta.',
    'toast.modified': 'Tu voto ha sido modificado. Aquí está tu respuesta.',
    'toast.confirmed': '¡Tu asistencia ha sido confirmada!',
    'toast.network_error': 'Error de red. Por favor intenta de nuevo.',
    'session.sat_aft': 'Sábado, 22 de agosto — Tarde',
    'session.sat_night': 'Sábado, 22 de agosto — Noche',
    'session.sun_aft': 'Domingo, 23 de agosto — Tarde',
    
    // API errors client mappings
    'api.error.valid_email_required': 'Se requiere un correo electrónico válido.',
    'api.error.database_not_found': 'Error de base de datos.',
    'api.error.device_already_voted': 'Ya se ha registrado un voto desde este dispositivo con un correo electrónico diferente.',
    'api.error.generic': 'Ocurrió un error inesperado.',

    // Results page
    'results.title': 'Resultados',
    'results.subtitle': 'Así va la convocatoria en tiempo real.',
    'results.total_responses': 'Respuestas Totales',
    'results.attending': 'Asistirán',
    'results.not_attending': 'No Asistirán',
    'results.session_breakdown': 'Desglose por Sesión',
    'results.live_indicator': 'En Vivo',
    'results.back_link': '← Volver al formulario',
    'results.loading': 'Cargando estadísticas…',
    'results.error_loading': 'Error al cargar los resultados.',
    'nav.view_results': 'Ver Resultados'
  },
  en: {
    'heading.title.prefix': 'Quesa',
    'heading.title.accent': 'Rave',
    'heading.subtitle': 'Prepare to lose yourself in the darkness of QuesaRave. The summer event is here to unite everyone under the power of bass. Select the days you will attend to help us headcount for potential venues.',
    'form.email.label': 'Email Address',
    'form.email.placeholder': 'name@domain.com…',
    'form.sessions.label': 'Select Sessions',
    'form.session.sat_aft.title': 'Saturday, August 22nd',
    'form.session.sat_aft.desc': 'Afternoon BBQ hangout',
    'form.session.sat_night.title': 'Saturday, August 22nd',
    'form.session.sat_night.desc': 'Rave until your body gives out',
    'form.session.sun_aft.title': 'Sunday, August 23rd',
    'form.session.sun_aft.desc': 'Heated pool powered by the bass',
    'form.submit': 'Confirm Attendance',
    'form.submitting': 'Confirming Attendance…',
    'summary.title': 'Days I will attend',
    'summary.attending': 'I will attend',
    'summary.not_attending': 'Not Attending',
    'summary.email_label': 'User Email',
    'summary.sessions_label': 'Sessions Selected',
    'summary.modify': 'Modify my Response',
    'toast.invalid_email': 'Please enter a valid email address.',
    'toast.already_voted': 'You have already voted. Here is your response.',
    'toast.modified': 'Your vote has been modified. Here is your response.',
    'toast.confirmed': 'Your attendance has been confirmed!',
    'toast.network_error': 'Network error. Please try again.',
    'session.sat_aft': 'Saturday, August 22nd — Afternoon',
    'session.sat_night': 'Saturday, August 22nd — Night',
    'session.sun_aft': 'Sunday, August 23rd — Afternoon',
    
    // API errors client mappings
    'api.error.valid_email_required': 'A valid email is required.',
    'api.error.database_not_found': 'Database binding not found.',
    'api.error.device_already_voted': 'A vote has already been registered from this device with a different email.',
    'api.error.generic': 'An unexpected error occurred.',

    // Results page
    'results.title': 'Results',
    'results.subtitle': 'Real-time headcount status.',
    'results.total_responses': 'Total Responses',
    'results.attending': 'Attending',
    'results.not_attending': 'Not Attending',
    'results.session_breakdown': 'Session Breakdown',
    'results.live_indicator': 'Live',
    'results.back_link': '← Back to form',
    'results.loading': 'Loading stats…',
    'results.error_loading': 'Error loading results.',
    'nav.view_results': 'View Results'
  }
};

export function getAutodetectedLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
    if (lang.toLowerCase().startsWith('en')) {
      return 'en';
    }
  }
  return 'es'; // default
}

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('es');

  useEffect(() => {
    setLocale(getAutodetectedLocale());
  }, []);

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations['es']?.[key] || key;
  };

  return { t, locale };
}
