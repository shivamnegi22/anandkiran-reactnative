import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import strings from '../i18n/strings';

const STORAGE_KEY = 'APP_LANGUAGE';
const LanguageContext = createContext({ lang: 'hi', t: strings.hi, setLang: () => {} });

// Hindi is the default; the patient's choice is remembered on the device.
export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState('hi');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'hi' || saved === 'en') setLangState(saved);
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((value) => {
    if (value !== 'hi' && value !== 'en') return;
    setLangState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {});
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: strings[lang] }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

/** Picks the right language from API values that may be { hi, en } objects or plain strings. */
export const pick = (value, lang) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] ?? value.en ?? value.hi ?? '';
  return value ?? '';
};
