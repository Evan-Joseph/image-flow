'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'comfort';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // 从localStorage读取主题设置
    try {
      const savedTheme = localStorage.getItem('imageflow-theme') as Theme;
      if (savedTheme && ['light', 'dark', 'comfort'].includes(savedTheme)) {
        setTheme(savedTheme);
      } else {
        // 根据系统设置自动选择
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        setTheme(defaultTheme);
        localStorage.setItem('imageflow-theme', defaultTheme);
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('imageflow-theme', theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // 清除所有主题类
    document.documentElement.classList.remove('dark', 'comfort');
    
    // 根据主题设置对应的CSS类
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'comfort') {
      document.documentElement.classList.add('comfort');
    }
    
    // 为护眼模式设置特殊的CSS变量，增强视觉效果
    if (theme === 'comfort') {
      document.documentElement.style.setProperty('--comfort-bg', '#f7f5f3');
      document.documentElement.style.setProperty('--comfort-text', '#5d4e37');
      document.documentElement.style.setProperty('--comfort-border', '#e6ddd4');
      document.documentElement.style.setProperty('--comfort-card', '#faf8f5');
      document.documentElement.style.setProperty('--comfort-accent', '#8b7355');
      document.documentElement.style.setProperty('--comfort-hover', '#f0ede8');
      // 设置body背景色确保全页面护眼效果
      document.body.style.backgroundColor = '#f7f5f3';
      document.body.style.color = '#5d4e37';
    } else {
      document.documentElement.style.removeProperty('--comfort-bg');
      document.documentElement.style.removeProperty('--comfort-text');
      document.documentElement.style.removeProperty('--comfort-border');
      document.documentElement.style.removeProperty('--comfort-card');
      document.documentElement.style.removeProperty('--comfort-accent');
      document.documentElement.style.removeProperty('--comfort-hover');
      // 重置body样式
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('color');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}