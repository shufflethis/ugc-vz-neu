// Google Analytics Utility Functions für UGC-VZ
// GDPR-konform mit Klaro Cookie Consent Integration

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

// Google Analytics Tracking ID
export const GA_TRACKING_ID = 'G-CE33NMGRD2';

const sanitizeProp = (value: string): string => value.substring(0, 120);

export const trackPlausibleEvent = (
  eventName: string,
  props?: Record<string, string | number | boolean>
): void => {
  if (typeof window === 'undefined' || !window.plausible) {
    return;
  }

  try {
    window.plausible(eventName, {
      props: props
        ? Object.fromEntries(
            Object.entries(props).map(([key, value]) => [
              key,
              typeof value === 'string' ? sanitizeProp(value) : value,
            ])
          )
        : undefined,
    });
  } catch (error) {
    console.error('Fehler beim Senden des Plausible Events:', error);
  }
};

// Prüft ob Analytics Cookies akzeptiert wurden
export const isAnalyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Prüfe Klaro Cookie Consent
  const klaroConsent = localStorage.getItem('ugc-vz-klaro');
  if (klaroConsent) {
    try {
      const consent = JSON.parse(klaroConsent);
      return consent.analytics === true;
    } catch (e) {
      console.error('Fehler beim Parsen der Klaro Consent:', e);
    }
  }
  
  // Fallback: Prüfe Simple Cookie Banner
  const simpleCookieConsent = localStorage.getItem('ugc-vz-cookie-consent');
  if (simpleCookieConsent) {
    try {
      const consent = JSON.parse(simpleCookieConsent);
      return consent.analytics === true;
    } catch (e) {
      console.error('Fehler beim Parsen der Simple Cookie Consent:', e);
    }
  }
  
  return false;
};

// Sende Event an Google Analytics (nur wenn Consent gegeben)
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined' || !window.gtag) {
    // Analytics nicht verfügbar oder nicht erlaubt - silent return
    return;
  }

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
    console.log('Analytics Event gesendet:', { action, category, label, value });
  } catch (error) {
    console.error('Fehler beim Senden des Analytics Events:', error);
  }
};

// Sende Seitenaufruf an Google Analytics
export const trackPageView = (url: string, title?: string): void => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined' || !window.gtag) {
    // Analytics nicht verfügbar oder nicht erlaubt - silent return
    return;
  }

  try {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
      page_title: title,
    });
    console.log('Analytics Seitenaufruf gesendet:', { url, title });
  } catch (error) {
    console.error('Fehler beim Senden des Seitenaufrufs:', error);
  }
};

// Spezifische UGC-VZ Events
export const trackUGCEvents = {
  pageCTA: (location: string, target: string) => {
    trackPlausibleEvent('CTA Click', { location, target });
    trackEvent('cta_click', 'Navigation', `${location}_${target}`);
  },

  // Suche Events
  searchStart: (query: string) => {
    trackPlausibleEvent('Brand Search Started', { query });
    trackEvent('search_start', 'UGC_Search', query);
  },

  search: (query: string, resultsCount: number) => {
    trackPlausibleEvent('Brand Search Results', { query, resultsCount });
    trackEvent('search', 'UGC_Search', query, resultsCount);
  },

  searchNoResults: (query: string) => {
    trackPlausibleEvent('Brand Search No Results', { query });
    trackEvent('search_no_results', 'UGC_Search', query);
  },
  
  // Creator Events
  creatorView: (creatorId: string, platform: string) => {
    trackPlausibleEvent('Creator Selected', { creatorId, platform });
    trackEvent('creator_view', 'UGC_Creator', `${platform}_${creatorId}`);
  },

  creatorDeselected: (creatorId: string, platform: string) => {
    trackPlausibleEvent('Creator Deselected', { creatorId, platform });
    trackEvent('creator_deselected', 'UGC_Creator', `${platform}_${creatorId}`);
  },
  
  creatorContact: (creatorId: string, platform: string) => {
    trackPlausibleEvent('Creator Request Includes Creator', { creatorId, platform });
    trackEvent('creator_contact', 'UGC_Creator', `${platform}_${creatorId}`);
  },
  
  // Navigation Events
  ctaClick: (location: string) => {
    trackPlausibleEvent('CTA Click', { location });
    trackEvent('cta_click', 'Navigation', location);
  },
  
  footerClick: (linkName: string) => {
    trackEvent('footer_click', 'Navigation', linkName);
  },
  
  // Cookie Events
  cookieAccept: (type: string) => {
    trackEvent('cookie_accept', 'Privacy', type);
  },
  
  cookieDecline: (type: string) => {
    trackEvent('cookie_decline', 'Privacy', type);
  },
  
  // Form Events
  contactForm: (formType: string) => {
    trackPlausibleEvent('Lead Form Submitted', { formType });
    trackEvent('contact_form', 'Engagement', formType);
  },

  leadFormOpened: (formType: string, selectedCount?: number) => {
    trackPlausibleEvent('Lead Form Opened', {
      formType,
      selectedCount: selectedCount || 0,
    });
    trackEvent('lead_form_opened', 'Engagement', formType, selectedCount);
  },

  leadFormError: (formType: string, error: string) => {
    trackPlausibleEvent('Lead Form Error', { formType, error });
    trackEvent('lead_form_error', 'Engagement', `${formType}_${error}`);
  },
  
  // Voice Search Events
  voiceSearchStart: () => {
    trackPlausibleEvent('Voice Search Started');
    trackEvent('voice_search_start', 'UGC_Search', 'microphone');
  },
  
  voiceSearchEnd: (success: boolean) => {
    trackPlausibleEvent('Voice Search Ended', { success });
    trackEvent('voice_search_end', 'UGC_Search', success ? 'success' : 'failed');
  },
};

// Initialisiere Analytics (wird automatisch aufgerufen wenn Consent gegeben wird)
export const initializeAnalytics = (): void => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') {
    console.log('Analytics Initialisierung übersprungen - kein Consent');
    return;
  }

  try {
    // Consent für Analytics gewähren
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
      console.log('Google Analytics Consent gewährt');
    }
  } catch (error) {
    console.error('Fehler bei Analytics Initialisierung:', error);
  }
};

// Deaktiviere Analytics (wird aufgerufen wenn Consent verweigert wird)
export const disableAnalytics = (): void => {
  if (typeof window === 'undefined') return;

  try {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
      console.log('Google Analytics Consent verweigert');
    }
  } catch (error) {
    console.error('Fehler bei Analytics Deaktivierung:', error);
  }
};

// Hook für React Components
export const useAnalytics = () => {
  return {
    trackEvent,
    trackPageView,
    trackUGCEvents,
    isEnabled: isAnalyticsEnabled(),
  };
};
