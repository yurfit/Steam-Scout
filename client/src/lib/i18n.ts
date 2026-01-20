import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        discover: 'Discover',
        leads: 'My Leads',
        settings: 'Settings',
        logout: 'Logout',
      },
      // Authentication
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password?',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        continue: 'Continue',
        or: 'Or',
        welcome: 'Welcome back',
        getStarted: 'Get started today',
        unauthorized: 'Unauthorized',
        sessionExpired: 'Your session has expired. Please sign in again.',
      },
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        subtitle: 'Real-time insights into popular games and studios',
        topGames: 'Top Games by Player Count',
        topStudios: 'Top Studios by Total Players',
        loading: 'Loading dashboard data...',
        error: 'Failed to load dashboard',
        retry: 'Retry',
        players: 'Players',
        games: 'Games',
        topGame: 'Top Game',
        reviewScore: 'Review Score',
        genres: 'Genres',
      },
      // Discover
      discover: {
        title: 'Discover Games',
        subtitle: 'Search Steam to find potential leads',
        searchPlaceholder: 'Search for games, studios, or publishers...',
        searching: 'Searching...',
        noResults: 'No results found',
        tryDifferent: 'Try a different search term',
        viewDetails: 'View Details',
        addLead: 'Add Lead',
        developer: 'Developer',
        publisher: 'Publisher',
        releaseDate: 'Release Date',
        currentPlayers: 'Current Players',
      },
      // Leads
      leads: {
        title: 'My Leads',
        subtitle: 'Manage and track your sales leads',
        addNew: 'Add New Lead',
        noLeads: 'No leads yet',
        startAdding: 'Start adding leads from the Discover page',
        name: 'Name',
        status: 'Status',
        engine: 'Engine',
        website: 'Website',
        notes: 'Notes',
        createdAt: 'Created',
        updatedAt: 'Updated',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        deleteConfirm: 'Are you sure you want to delete this lead?',
        deleteSuccess: 'Lead deleted successfully',
        createSuccess: 'Lead created successfully',
        updateSuccess: 'Lead updated successfully',
        statuses: {
          new: 'New',
          contacted: 'Contacted',
          interested: 'Interested',
          closed: 'Closed',
        },
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        actions: 'Actions',
        notFound: 'Not Found',
        backHome: 'Back to Home',
        pageNotFound: 'The page you are looking for does not exist.',
      },
      // GDPR & Privacy
      gdpr: {
        consentTitle: 'Cookie Consent',
        consentMessage: 'We use cookies to enhance your experience, analyze traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.',
        acceptAll: 'Accept All',
        rejectAll: 'Reject All',
        customize: 'Customize',
        necessary: 'Necessary',
        analytics: 'Analytics',
        marketing: 'Marketing',
        privacyPolicy: 'Privacy Policy',
        cookiePolicy: 'Cookie Policy',
        dataExport: 'Export My Data',
        dataDelete: 'Delete My Account',
        gdprCompliance: 'GDPR Compliance',
        dataProcessing: 'Data Processing Information',
        yourRights: 'Your Rights',
        rightToAccess: 'Right to access your data',
        rightToRectify: 'Right to rectify inaccurate data',
        rightToErase: 'Right to erasure ("right to be forgotten")',
        rightToRestrict: 'Right to restrict processing',
        rightToPort: 'Right to data portability',
        rightToObject: 'Right to object to processing',
      },
      // Accessibility
      a11y: {
        skipToContent: 'Skip to main content',
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        toggleTheme: 'Toggle theme',
        darkMode: 'Dark mode',
        lightMode: 'Light mode',
        loading: 'Loading',
        sortAscending: 'Sort ascending',
        sortDescending: 'Sort descending',
        page: 'Page {{current}} of {{total}}',
        previousPage: 'Previous page',
        nextPage: 'Next page',
      },
    },
  },
  es: {
    translation: {
      nav: {
        dashboard: 'Panel',
        discover: 'Descubrir',
        leads: 'Mis Prospectos',
        settings: 'Configuración',
        logout: 'Cerrar Sesión',
      },
      auth: {
        signIn: 'Iniciar Sesión',
        signUp: 'Registrarse',
        signOut: 'Cerrar Sesión',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        forgotPassword: '¿Olvidaste tu Contraseña?',
        noAccount: '¿No tienes cuenta?',
        hasAccount: '¿Ya tienes cuenta?',
        continue: 'Continuar',
        or: 'O',
        welcome: 'Bienvenido de nuevo',
        getStarted: 'Comienza hoy',
        unauthorized: 'No autorizado',
        sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      },
      dashboard: {
        title: 'Panel',
        subtitle: 'Información en tiempo real sobre juegos y estudios populares',
        topGames: 'Juegos Principales por Número de Jugadores',
        topStudios: 'Estudios Principales por Total de Jugadores',
        loading: 'Cargando datos del panel...',
        error: 'Error al cargar el panel',
        retry: 'Reintentar',
        players: 'Jugadores',
        games: 'Juegos',
        topGame: 'Juego Principal',
      },
      common: {
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        close: 'Cerrar',
        search: 'Buscar',
      },
      gdpr: {
        consentMessage: 'Usamos cookies para mejorar tu experiencia. Al hacer clic en "Aceptar Todo", consientes nuestro uso de cookies.',
        acceptAll: 'Aceptar Todo',
        rejectAll: 'Rechazar Todo',
        privacyPolicy: 'Política de Privacidad',
      },
    },
  },
  fr: {
    translation: {
      nav: {
        dashboard: 'Tableau de Bord',
        discover: 'Découvrir',
        leads: 'Mes Prospects',
        settings: 'Paramètres',
        logout: 'Déconnexion',
      },
      auth: {
        signIn: 'Se Connecter',
        signUp: "S'inscrire",
        email: 'Email',
        password: 'Mot de Passe',
        welcome: 'Bienvenue',
      },
      common: {
        loading: 'Chargement...',
        error: 'Erreur',
        save: 'Enregistrer',
        cancel: 'Annuler',
      },
    },
  },
  de: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        discover: 'Entdecken',
        leads: 'Meine Leads',
        settings: 'Einstellungen',
        logout: 'Abmelden',
      },
      auth: {
        signIn: 'Anmelden',
        signUp: 'Registrieren',
        email: 'E-Mail',
        password: 'Passwort',
      },
      common: {
        loading: 'Wird geladen...',
        error: 'Fehler',
        save: 'Speichern',
        cancel: 'Abbrechen',
      },
    },
  },
  ja: {
    translation: {
      nav: {
        dashboard: 'ダッシュボード',
        discover: '発見',
        leads: 'マイリード',
        settings: '設定',
        logout: 'ログアウト',
      },
      auth: {
        signIn: 'ログイン',
        signUp: '登録',
        email: 'メール',
        password: 'パスワード',
      },
      common: {
        loading: '読み込み中...',
        error: 'エラー',
        save: '保存',
        cancel: 'キャンセル',
      },
    },
  },
  zh: {
    translation: {
      nav: {
        dashboard: '仪表板',
        discover: '发现',
        leads: '我的线索',
        settings: '设置',
        logout: '登出',
      },
      auth: {
        signIn: '登录',
        signUp: '注册',
        email: '邮箱',
        password: '密码',
      },
      common: {
        loading: '加载中...',
        error: '错误',
        save: '保存',
        cancel: '取消',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
