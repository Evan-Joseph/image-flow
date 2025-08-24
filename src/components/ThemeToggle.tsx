import React from 'react';
import { Sun, Moon, Eye } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const themes = [
    { key: 'light', icon: Sun, label: t('theme.light') },
    { key: 'dark', icon: Moon, label: t('theme.dark') },
    { key: 'comfort', icon: Eye, label: t('theme.comfort') }
  ] as const;

  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200
            ${theme === key 
              ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }
          `}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}