import { create } from 'zustand'
import i18n from '../i18n/i18n'

export type LangCode = 'en' | 'hi' | 'mr' | 'bn'

export interface LangOption {
  code: LangCode
  label: string
  nativeName: string
  flag: string
}

export const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
]

interface LangStore {
  lang: LangCode
  setLang: (code: LangCode) => void
}

export const useLangStore = create<LangStore>((set) => ({
  lang: (localStorage.getItem('orca_lang') as LangCode) || 'en',
  setLang: (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('orca_lang', code)
    set({ lang: code })
  },
}))
