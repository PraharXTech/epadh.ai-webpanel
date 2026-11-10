import { useSelector } from 'react-redux';
import en from './locales/en';
import hi from './locales/hi';

export const LANGUAGES = [
  { id: 'en', labelKey: 'settings.english' },
  { id: 'hi', labelKey: 'settings.hindi' },
];

const CATALOGS = { en, hi };

// Looks `key` up in the chosen language, falls back to English, and finally to the key
// itself so a typo shows up on screen instead of crashing. `{name}` is replaced from `params`.
export const translate = (language, key, params) => {
  const text = CATALOGS[language]?.[key] ?? en[key] ?? key;
  return params
    ? text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
    : text;
};

// `const t = useT(); t('settings.title')`, follows the language chosen in Settings.
export const useT = () => {
  const language = useSelector(state => state.settings.language);
  return (key, params) => translate(language, key, params);
};
