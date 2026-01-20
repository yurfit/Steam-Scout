import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Loader2, Gamepad2 } from 'lucide-react';

/**
 * Clerk Authentication Page
 *
 * This page handles both sign-in and sign-up flows using Clerk's pre-built components.
 * It provides a seamless authentication experience with automatic redirection.
 */
export default function ClerkAuthPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  const isSignUp = location.includes('sign-up');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Branding */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
          >
            <Gamepad2 className="w-8 h-8 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold tracking-tight"
          >
            Steam Scout
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            {isSignUp
              ? 'Create your account to start discovering game studios'
              : 'Welcome back! Sign in to continue your discovery'}
          </motion.p>
        </div>

        {/* Clerk Authentication Component */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          {isSignUp ? (
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-xl border-border',
                  headerTitle: 'sr-only',
                  headerSubtitle: 'sr-only',
                },
              }}
              signInUrl="/auth/sign-in"
              redirectUrl="/"
            />
          ) : (
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-xl border-border',
                  headerTitle: 'sr-only',
                  headerSubtitle: 'sr-only',
                },
              }}
              signUpUrl="/auth/sign-up"
              redirectUrl="/"
            />
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground space-y-2"
        >
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
