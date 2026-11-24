import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
      <div className="px-1.5 text-slate-500">
        <Globe size={13} />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-md font-medium transition-all ${
          language === 'en'
            ? 'bg-white text-sky-700 shadow-sm font-semibold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-2 py-1 rounded-md font-medium transition-all ${
          language === 'ta'
            ? 'bg-white text-teal-800 shadow-sm font-semibold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};
