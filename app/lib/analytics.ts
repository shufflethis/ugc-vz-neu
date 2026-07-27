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
  searchStart: (query: string) => {
    trackEvent('search_start', 'UGC_Search', query);
  },

  search: (query: string, resultsCount: number) => {
    trackEvent('search', 'UGC_Search', query, resultsCount);
  },

  searchNoResults: (query: string) => {
    trackEvent('search_no_results', 'UGC_Search', query);
  },
  
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
