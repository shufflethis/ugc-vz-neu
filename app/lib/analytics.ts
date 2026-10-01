// Plausible Analytics utilities. The global queue is initialized in app/layout.tsx.

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.plausible === 'function';
};

// Sende ein benutzerdefiniertes Event an Plausible.
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!isAnalyticsEnabled() || !window.plausible) return;

  try {
    window.plausible(action, {
      props: {
        category,
        ...(label ? { label } : {}),
        ...(value !== undefined ? { value } : {}),
      },
    });
  } catch (error) {
    console.error('Fehler beim Senden des Plausible Events:', error);
  }
};

// Spezifische UGC-VZ Events
export const trackUGCEvents = {
  pageCTA: (location: string, target: string) => {
    trackEvent('cta_click', 'Navigation', `${location}_${target}`);
  },

  // Suche Events
  searchStart: (_query: string) => {
    trackEvent('search_start', 'UGC_Search');
  },

  search: (_query: string, resultsCount: number) => {
    trackEvent('search', 'UGC_Search', undefined, resultsCount);
  },

  searchNoResults: (_query: string) => {
    trackEvent('search_no_results', 'UGC_Search');
  },
  searchError: () => trackEvent('search_error', 'UGC_Search'),
  articleCTA: (slug: string, target: 'creator' | 'brand', placement: string) => {
    trackEvent('article_cta', 'Navigation', `${slug}:${target}:${placement}`);
  },
  registrationStart: () => trackEvent('creator_registration_start', 'Registration'),
  registrationStep: (step: number) => trackEvent('creator_registration_step', 'Registration', undefined, step),
  registrationSubmitted: () => trackEvent('creator_registration_submitted', 'Registration'),
  registrationConfirmed: () => trackEvent('creator_registration_confirmed', 'Registration'),
  registrationError: () => trackEvent('creator_registration_error', 'Registration'),
  requestSuccess: (formType: string, count: number) => trackEvent('request_success', 'Engagement', formType, count),
  creatorSelected: (creatorId: string, platform: string) => trackEvent('creator_selected', 'UGC_Creator', `${platform}_${creatorId}`),
  
  // Creator Events
  creatorView: (creatorId: string, platform: string) => {
    trackEvent('creator_view', 'UGC_Creator', `${platform}_${creatorId}`);
  },

  creatorDeselected: (creatorId: string, platform: string) => {
    trackEvent('creator_deselected', 'UGC_Creator', `${platform}_${creatorId}`);
  },
  
  creatorContact: (creatorId: string, platform: string) => {
    trackEvent('creator_contact', 'UGC_Creator', `${platform}_${creatorId}`);
  },
  
  // Navigation Events
  ctaClick: (location: string) => {
    trackEvent('cta_click', 'Navigation', location);
  },
  
  footerClick: (linkName: string) => {
    trackEvent('footer_click', 'Navigation', linkName);
  },
  
  // Form Events
  contactForm: (formType: string) => {
    trackEvent('contact_form', 'Engagement', formType);
  },

  leadFormOpened: (formType: string, selectedCount?: number) => {
    trackEvent('lead_form_opened', 'Engagement', formType, selectedCount);
  },

  leadFormError: (formType: string, error: string) => {
    trackEvent('lead_form_error', 'Engagement', `${formType}_${error}`);
  },
  
  // Voice Search Events
  voiceSearchStart: () => {
    trackEvent('voice_search_start', 'UGC_Search', 'microphone');
  },
  
  voiceSearchEnd: (success: boolean) => {
    trackEvent('voice_search_end', 'UGC_Search', success ? 'success' : 'failed');
  },
};

// Hook für React Components
export const useAnalytics = () => {
  return {
    trackEvent,
    trackUGCEvents,
    isEnabled: isAnalyticsEnabled(),
  };
};
