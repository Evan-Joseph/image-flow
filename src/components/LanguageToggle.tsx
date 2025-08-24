import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const languages = [
    { key: 'zh-CN', label: t('language.zh-CN') },
    { key: 'en-US', label: t('language.en-US') }
  ];

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
        <Globe className="w-5 h-5" />
        <span className="text-sm">{t('language.title')}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.key}
            onClick={() => handleLanguageChange(lang.key)}
            className={`
              w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg
              ${
                i18n.language === lang.key
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}