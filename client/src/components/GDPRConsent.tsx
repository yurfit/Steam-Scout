import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Cookie, Shield, Info } from 'lucide-react';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = 'gdpr_consent';
const CONSENT_TIMESTAMP_KEY = 'gdpr_consent_timestamp';
const CONSENT_VERSION = '1.0';

export function GDPRConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);

    // Show banner if no consent or if consent is older than 6 months
    if (!consent || !timestamp) {
      setShowBanner(true);
    } else {
      const consentDate = new Date(timestamp);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (consentDate < sixMonthsAgo) {
        setShowBanner(true);
      } else {
        // Load saved preferences
        try {
          const saved = JSON.parse(consent);
          if (saved.version === CONSENT_VERSION) {
            setPreferences(saved.preferences);
            applyConsentPreferences(saved.preferences);
          } else {
            setShowBanner(true);
          }
        } catch (e) {
          setShowBanner(true);
        }
      }
    }
  }, []);

  const applyConsentPreferences = (prefs: ConsentPreferences) => {
    // Apply analytics consent
    if (prefs.analytics) {
      // Initialize analytics tracking
      window.gtag?.('consent', 'update', {
        'analytics_storage': 'granted'
      });
    } else {
      window.gtag?.('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }

    // Apply marketing consent
    if (prefs.marketing) {
      window.gtag?.('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    } else {
      window.gtag?.('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    const consentData = {
      version: CONSENT_VERSION,
      preferences: prefs,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    applyConsentPreferences(prefs);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
    setShowBanner(false);
    setShowCustomize(false);
  };

  const handleRejectAll = () => {
    const minimal = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(minimal);
    saveConsent(minimal);
    setShowBanner(false);
    setShowCustomize(false);
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
    setShowBanner(false);
    setShowCustomize(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        role="dialog"
        aria-labelledby="gdpr-consent-title"
        aria-describedby="gdpr-consent-description"
      >
        <Card className="mx-auto max-w-5xl border-2 border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
          <div className="p-6">
            {!showCustomize ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Cookie className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h2
                        id="gdpr-consent-title"
                        className="text-xl font-semibold text-foreground mb-2"
                      >
                        {t('gdpr.consentTitle')}
                      </h2>
                      <p
                        id="gdpr-consent-description"
                        className="text-sm text-muted-foreground leading-relaxed"
                      >
                        {t('gdpr.consentMessage')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="font-medium"
                        aria-label={t('gdpr.acceptAll')}
                      >
                        {t('gdpr.acceptAll')}
                      </Button>
                      <Button
                        onClick={handleRejectAll}
                        variant="outline"
                        aria-label={t('gdpr.rejectAll')}
                      >
                        {t('gdpr.rejectAll')}
                      </Button>
                      <Button
                        onClick={() => setShowCustomize(true)}
                        variant="ghost"
                        aria-label={t('gdpr.customize')}
                      >
                        <Info className="mr-2 h-4 w-4" aria-hidden="true" />
                        {t('gdpr.customize')}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <a
                        href="/privacy"
                        className="hover:text-primary underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                        aria-label={t('gdpr.privacyPolicy')}
                      >
                        {t('gdpr.privacyPolicy')}
                      </a>
                      <a
                        href="/cookies"
                        className="hover:text-primary underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                        aria-label={t('gdpr.cookiePolicy')}
                      >
                        {t('gdpr.cookiePolicy')}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <h2 className="text-lg font-semibold">
                        {t('gdpr.customize')}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomize(false)}
                      aria-label="Close customization"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                      <div className="space-y-1">
                        <Label
                          htmlFor="necessary"
                          className="text-base font-medium cursor-pointer"
                        >
                          {t('gdpr.necessary')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Essential for the site to function. Always enabled.
                        </p>
                      </div>
                      <Switch
                        id="necessary"
                        checked={true}
                        disabled
                        aria-label={t('gdpr.necessary')}
                        aria-readonly="true"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/30 transition-colors border">
                      <div className="space-y-1">
                        <Label
                          htmlFor="analytics"
                          className="text-base font-medium cursor-pointer"
                        >
                          {t('gdpr.analytics')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Help us improve by collecting anonymous usage data.
                        </p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={preferences.analytics}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, analytics: checked })
                        }
                        aria-label={t('gdpr.analytics')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/30 transition-colors border">
                      <div className="space-y-1">
                        <Label
                          htmlFor="marketing"
                          className="text-base font-medium cursor-pointer"
                        >
                          {t('gdpr.marketing')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Personalized ads and content based on your interests.
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={preferences.marketing}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, marketing: checked })
                        }
                        aria-label={t('gdpr.marketing')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      onClick={() => setShowCustomize(false)}
                      variant="ghost"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSaveCustom}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
