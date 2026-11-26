// Plausible Analytics utilities. The global queue is initialized in app/layout.tsx.

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        revenue?: { currency: string; amount: number };
      }
    ) => void;
  }
}

export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.plausible === 'function';
};

// Direktes Plausible Custom-Goal Event mit sauberen Custom Properties (ohne PII)
export const trackPlausibleGoal = (
  goalName: string,
  props?: Record<string, string | number | boolean>,
  revenue?: { currency: string; amount: number }
): void => {
  if (!isAnalyticsEnabled() || !window.plausible) return;
  try {
    window.plausible(goalName, {
      ...(props && Object.keys(props).length > 0 ? { props } : {}),
      ...(revenue ? { revenue } : {}),
    });
  } catch (error) {
    console.error('Fehler beim Senden des Plausible Goals:', error);
  }
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

  // --- Neue SaaS-, Funnel-, High-Risk-, Affiliate- & Video-Goals (Plausible) ---
  quickBriefMode: (model: 'tkp' | 'fixed') => {
    trackPlausibleGoal('quick_brief_mode', { model });
  },

  quickBriefSubmit: (input: { model: 'tkp' | 'fixed'; affiliate: boolean; budgetEur: number }) => {
    const bucket =
      input.budgetEur >= 2500 ? '2500+' : input.budgetEur >= 1000 ? '1000-2499' : input.budgetEur >= 500 ? '500-999' : '<500';
    trackPlausibleGoal('quick_brief_submit', {
      model: input.model,
      affiliate: input.affiliate,
      budget_bucket: bucket,
    });
  },

  brandSignup: (input: { industryCategory: string; source: 'brand_page' | 'creator_popup' }) => {
    trackPlausibleGoal('brand_signup', {
      industry: input.industryCategory,
      source: input.source,
    });
  },

  brandOtpVerified: (source: 'brand_page' | 'creator_popup' | 'magic_link') => {
    trackPlausibleGoal('brand_otp_verified', { source });
  },

  campaignCreated: (input: { model: string; affiliate: boolean; highRisk: boolean; source: 'brand_workspace' | 'creator_popup' }) => {
    trackPlausibleGoal('campaign_created', {
      model: input.model,
      affiliate: input.affiliate,
      high_risk: input.highRisk,
      source: input.source,
    });
  },

  highRiskDetected: (input: { category: string; surface: 'brand_signup' | 'campaign_builder' | 'creator_popup' }) => {
    trackPlausibleGoal('high_risk_detected', {
      category: input.category,
      surface: input.surface,
    });
  },

  highRiskComplianceRequested: (input: { category: string; contact: 'call' | 'email'; psp: string }) => {
    trackPlausibleGoal('high_risk_compliance_requested', {
      category: input.category,
      contact: input.contact,
      psp: input.psp,
    });
  },

  affiliateCodeCopied: (input: { role: 'brand' | 'creator'; kind: 'code' | 'link' }) => {
    trackPlausibleGoal('affiliate_code_copied', {
      role: input.role,
      kind: input.kind,
    });
  },

  videoPlay: (video: string) => {
    trackPlausibleGoal('video_play', { video });
  },

  videoHalfway: (video: string) => {
    trackPlausibleGoal('video_50pct', { video });
  },

  notFound: (path: string) => {
    trackPlausibleGoal('404', { path: path.slice(0, 120) });
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
