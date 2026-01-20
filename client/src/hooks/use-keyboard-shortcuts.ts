import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey;
        const matchesMeta = shortcut.metaKey ? event.metaKey : !event.metaKey;

        if (
          matchesKey &&
          matchesCtrl &&
          matchesShift &&
          matchesAlt &&
          matchesMeta
        ) {
          event.preventDefault();
          shortcut.action();

          // Announce to screen readers
          announceToScreenReader(`Keyboard shortcut activated: ${shortcut.description}`);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}

// Global navigation shortcuts
export function useGlobalKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'h',
      altKey: true,
      action: () => setLocation('/'),
      description: 'Navigate to home',
    },
    {
      key: 'd',
      altKey: true,
      action: () => setLocation('/discover'),
      description: 'Navigate to discover page',
    },
    {
      key: 'l',
      altKey: true,
      action: () => setLocation('/leads'),
      description: 'Navigate to leads page',
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      },
      description: 'Focus search input',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const commandMenu = document.querySelector<HTMLButtonElement>('[data-command-menu]');
        commandMenu?.click();
      },
      description: 'Open command menu',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
