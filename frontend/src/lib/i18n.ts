/**
 * Lightweight i18n system for WealthWise.
 * English is the primary language. Other languages are stubs for future expansion.
 * The AI responds in the user's selected language via system prompt — this file
 * handles only UI chrome strings.
 */

export type Locale = "en" | "es" | "fr";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

interface Messages {
  // Navigation
  chat: string;
  advisor: string;
  timeline: string;
  profile: string;
  settings: string;
  signOut: string;

  // Chat
  welcomeTitle: string;
  welcomeSubtitle: string;
  inputPlaceholder: string;
  newChat: string;
  noConversations: string;

  // Advisor
  advisorConsole: string;
  financialPulse: string;
  quickActions: string;
  morningBrief: string;
  weeklyRecap: string;
  generateInsights: string;
  intelligenceFeed: string;
  noInsights: string;

  // Profile
  financialProfile: string;
  saveProfile: string;
  profileSaved: string;
  aiMemory: string;
  usage: string;
  upgradeNow: string;

  // Common
  loading: string;
  backToChat: string;
  cancel: string;
  save: string;
  delete_: string;
}

const en: Messages = {
  chat: "Chat",
  advisor: "Advisor",
  timeline: "Timeline",
  profile: "Profile",
  settings: "Settings",
  signOut: "Sign Out",

  welcomeTitle: "Welcome to WealthWise",
  welcomeSubtitle: "Ask me about stock prices, market trends, company fundamentals, or get personalized financial advice.",
  inputPlaceholder: "Ask about stocks, market trends, or financial advice...",
  newChat: "+ New Chat",
  noConversations: "No conversations yet",

  advisorConsole: "Advisor Console",
  financialPulse: "Financial Pulse",
  quickActions: "Quick Actions",
  morningBrief: "Morning Brief",
  weeklyRecap: "Weekly Recap",
  generateInsights: "Generate Insights",
  intelligenceFeed: "Intelligence Feed",
  noInsights: "No insights yet",

  financialProfile: "Financial Profile",
  saveProfile: "Save Profile",
  profileSaved: "Profile saved successfully!",
  aiMemory: "AI Memory",
  usage: "Usage",
  upgradeNow: "Upgrade Now",

  loading: "Loading...",
  backToChat: "Back to Chat",
  cancel: "Cancel",
  save: "Save",
  delete_: "Delete",
};

const es: Messages = {
  chat: "Chat",
  advisor: "Asesor",
  timeline: "Cronología",
  profile: "Perfil",
  settings: "Configuración",
  signOut: "Cerrar sesión",

  welcomeTitle: "Bienvenido a WealthWise",
  welcomeSubtitle: "Pregúntame sobre precios de acciones, tendencias del mercado o consejos financieros personalizados.",
  inputPlaceholder: "Pregunta sobre acciones, mercados o finanzas...",
  newChat: "+ Nuevo chat",
  noConversations: "Sin conversaciones aún",

  advisorConsole: "Consola del asesor",
  financialPulse: "Pulso financiero",
  quickActions: "Acciones rápidas",
  morningBrief: "Resumen matutino",
  weeklyRecap: "Resumen semanal",
  generateInsights: "Generar ideas",
  intelligenceFeed: "Feed de inteligencia",
  noInsights: "Sin ideas aún",

  financialProfile: "Perfil financiero",
  saveProfile: "Guardar perfil",
  profileSaved: "¡Perfil guardado exitosamente!",
  aiMemory: "Memoria IA",
  usage: "Uso",
  upgradeNow: "Mejorar ahora",

  loading: "Cargando...",
  backToChat: "Volver al chat",
  cancel: "Cancelar",
  save: "Guardar",
  delete_: "Eliminar",
};

const fr: Messages = {
  chat: "Discussion",
  advisor: "Conseiller",
  timeline: "Chronologie",
  profile: "Profil",
  settings: "Paramètres",
  signOut: "Déconnexion",

  welcomeTitle: "Bienvenue sur WealthWise",
  welcomeSubtitle: "Posez-moi des questions sur les actions, les tendances du marché ou des conseils financiers personnalisés.",
  inputPlaceholder: "Questions sur les actions, marchés ou finances...",
  newChat: "+ Nouvelle discussion",
  noConversations: "Aucune conversation",

  advisorConsole: "Console du conseiller",
  financialPulse: "Pouls financier",
  quickActions: "Actions rapides",
  morningBrief: "Briefing matinal",
  weeklyRecap: "Récapitulatif hebdomadaire",
  generateInsights: "Générer des insights",
  intelligenceFeed: "Fil d'intelligence",
  noInsights: "Pas encore d'insights",

  financialProfile: "Profil financier",
  saveProfile: "Enregistrer le profil",
  profileSaved: "Profil enregistré avec succès !",
  aiMemory: "Mémoire IA",
  usage: "Utilisation",
  upgradeNow: "Passer à Pro",

  loading: "Chargement...",
  backToChat: "Retour au chat",
  cancel: "Annuler",
  save: "Enregistrer",
  delete_: "Supprimer",
};

const messages: Record<Locale, Messages> = { en, es, fr };

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages.en;
}

export function getLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("ww-locale") as Locale) || "en";
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("ww-locale", locale);
}
