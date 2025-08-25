import React, { useState, useEffect } from 'react';
import { X, Shield, Heart, Globe } from 'lucide-react';

interface AdBlockerNoticeProps {
  onClose: () => void;
}

type Language = 'zh' | 'en';

interface TextContent {
  title: string;
  content: string;
  thanks: string;
  howTo: string;
  instruction: string;
  button: string;
}

const texts: Record<Language, TextContent> = {
  zh: {
    title: '求求了！Pls~ 🥺',
    content: '为了让 ImageFlow 正常运行，请暂时关闭广告拦截器哦！\n我们的小广告很乖的，不会打扰您的使用体验~ ✨',
    thanks: '感谢您的理解与支持！',
    howTo: '💡 如何关闭广告拦截器：',
    instruction: '点击浏览器地址栏旁的拦截器图标，选择"在此网站上禁用"',
    button: '我知道了 💖'
  },
  en: {
    title: 'Please! Pretty please~ 🥺',
    content: 'To keep ImageFlow running smoothly, please disable your ad blocker!\nOur little ads are well-behaved and won\'t disturb your experience~ ✨',
    thanks: 'Thank you for your understanding and support!',
    howTo: '💡 How to disable ad blocker:',
    instruction: 'Click the blocker icon next to your browser\'s address bar and select "Disable on this site"',
    button: 'Got it! 💖'
  }
};

const AdBlockerNotice: React.FC<AdBlockerNoticeProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [language, setLanguage] = useState<Language>('zh');

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const currentText = texts[language];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <button
          onClick={toggleLanguage}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-xs"
          title={language === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          <Globe size={16} />
          {language === 'zh' ? 'EN' : '中'}
        </button>
        
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-3 rounded-full">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {currentText.title}
          </h3>
          
          <p className="text-gray-600 mb-4 leading-relaxed whitespace-pre-line">
            {currentText.content}
          </p>
          
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 text-pink-500" />
              {currentText.thanks}
            </p>
          </div>
          
          <div className="space-y-2 text-xs text-gray-500">
            <p>{currentText.howTo}</p>
            <p>{currentText.instruction}</p>
          </div>
          
          <button
            onClick={handleClose}
            className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            {currentText.button}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBlockerNotice;