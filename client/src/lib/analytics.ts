/**
 * Analytics Integration Module
 *
 * Provides a unified interface for tracking events, page views, and user interactions.
 * Supports multiple analytics providers with GDPR compliance built-in.
 *
 * Supported Providers:
 * - Google Analytics 4 (GA4)
 * - Vercel Analytics
 * - Custom analytics endpoint
 *
 * Features:
 * - GDPR-compliant (respects user consent)
 * - Type-safe event tracking
 * - Automatic page view tracking
 * - Error tracking integration
 * - Performance monitoring
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface PageViewEvent {
  path: string;
  title: string;
  referrer?: string;
}

type ConsentStatus = 'granted' | 'denied';

/**
 * Analytics Manager Class
 */
class AnalyticsManager {
  private initialized = false;
  private consentGiven = false;
  private queue: AnalyticsEvent[] = [];

  /**
   * Initialize analytics with user consent
   */
  init(consentGiven = false) {
    if (this.initialized) return;

    this.consentGiven = consentGiven;
    this.initialized = true;

    // Initialize GA4 if consent given
    if (consentGiven && this.isGA4Enabled()) {
      this.initializeGA4();
    }

    // Initialize Vercel Analytics (always enabled, privacy-focused)
    this.initializeVercelAnalytics();

    // Process queued events
    this.processQueue();

    console.log('[Analytics] Initialized', { consentGiven });
  }

  /**
   * Update user consent status
   */
  updateConsent(analytics: boolean, marketing: boolean) {
    this.consentGiven = analytics || marketing;

    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied',
      });
    }

    console.log('[Analytics] Consent updated', { analytics, marketing });
  }

  /**
   * Track a custom event
   */
  trackEvent(event: AnalyticsEvent) {
    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    if (!this.consentGiven) {
      console.log('[Analytics] Event blocked (no consent):', event.name);
      return;
    }

    // Send to GA4
    if (window.gtag) {
      window.gtag('event', event.name, {
        ...event.properties,
        timestamp: event.timestamp || Date.now(),
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomEndpoint(event);

    console.log('[Analytics] Event tracked:', event.name, event.properties);
  }

  /**
   * Track page view
   */
  trackPageView(pageView: PageViewEvent) {
    if (!this.initialized) {
      this.queue.push({
        name: 'page_view',
        properties: pageView,
      });
      return;
    }

    // GA4 page view
    if (window.gtag && this.consentGiven) {
      window.gtag('event', 'page_view', {
        page_path: pageView.path,
        page_title: pageView.title,
        page_referrer: pageView.referrer || document.referrer,
      });
    }

    console.log('[Analytics] Page view tracked:', pageView.path);
  }

  /**
   * Track user timing/performance
   */
  trackTiming(category: string, variable: string, value: number, label?: string) {
    if (!this.consentGiven) return;

    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value,
        event_category: category,
        event_label: label,
      });
    }

    console.log('[Analytics] Timing tracked:', { category, variable, value, label });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: Record<string, any>) {
    // Always track errors regardless of consent (privacy-preserving)
    const errorEvent: AnalyticsEvent = {
      name: 'error',
      properties: {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500), // Limit stack trace length
        error_name: error.name,
        ...context,
      },
    };

    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }

    this.sendToCustomEndpoint(errorEvent);

    console.error('[Analytics] Error tracked:', error);
  }

  /**
   * Track user identification (for authenticated users)
   */
  identifyUser(userId: string, properties?: Record<string, any>) {
    if (!this.consentGiven) return;

    if (window.gtag) {
      window.gtag('set', 'user_id', userId);
      if (properties) {
        window.gtag('set', 'user_properties', properties);
      }
    }

    console.log('[Analytics] User identified:', userId);
  }

  /**
   * Clear user identification (on logout)
   */
  clearUser() {
    if (window.gtag) {
      window.gtag('set', 'user_id', null);
    }

    console.log('[Analytics] User cleared');
  }

  // Private helper methods

  private isGA4Enabled(): boolean {
    return !!import.meta.env.VITE_GA_MEASUREMENT_ID;
  }

  private initializeGA4() {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId) return;

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll handle page views manually
      anonymize_ip: true, // GDPR compliance
    });

    console.log('[Analytics] GA4 initialized');
  }

  private initializeVercelAnalytics() {
    // Vercel Analytics is privacy-focused and doesn't require consent
    // It's automatically injected by Vercel in production
    if (window.location.hostname.includes('vercel.app')) {
      console.log('[Analytics] Vercel Analytics enabled');
    }
  }

  private async sendToCustomEndpoint(event: AnalyticsEvent) {
    try {
      // Send to your custom analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event.name,
          properties: event.properties,
          timestamp: event.timestamp || Date.now(),
          session: this.getSessionId(),
          page: window.location.pathname,
        }),
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.warn('[Analytics] Failed to send to custom endpoint:', error);
    }
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        if (event.name === 'page_view') {
          this.trackPageView(event.properties as PageViewEvent);
        } else {
          this.trackEvent(event);
        }
      }
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager();

// Convenience functions for common events
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  analytics.trackEvent({ name, properties });
};

export const trackPageView = (path: string, title: string) => {
  analytics.trackPageView({ path, title });
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  analytics.trackError(error, context);
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  analytics.identifyUser(userId, properties);
};

export const clearUser = () => {
  analytics.clearUser();
};

// Predefined event types for type safety
export const AnalyticsEvents = {
  // User Actions
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  FORM_SUBMIT: 'form_submit',
  SEARCH: 'search',
  FILTER_APPLIED: 'filter_applied',

  // Lead Management
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_DELETED: 'lead_deleted',
  LEAD_VIEWED: 'lead_viewed',

  // Game Discovery
  GAME_SEARCHED: 'game_searched',
  GAME_VIEWED: 'game_viewed',
  GAME_ADDED_TO_LEAD: 'game_added_to_lead',

  // Navigation
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',
  TAB_CHANGE: 'tab_change',

  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',

  // Errors
  ERROR: 'error',
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
} as const;

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
