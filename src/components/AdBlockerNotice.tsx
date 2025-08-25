import React, { useState, useEffect } from 'react';
import { X, Shield, Heart } from 'lucide-react';

interface AdBlockerNoticeProps {
  onClose: () => void;
}

const AdBlockerNotice: React.FC<AdBlockerNoticeProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

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
        
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-3 rounded-full">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            求求了！Pls~ 🥺
          </h3>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            为了让 ImageFlow 正常运行，请暂时关闭广告拦截器哦！
            <br />
            我们的小广告很乖的，不会打扰您的使用体验~ ✨
          </p>
          
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 text-pink-500" />
              感谢您的理解与支持！
            </p>
          </div>
          
          <div className="space-y-2 text-xs text-gray-500">
            <p>💡 如何关闭广告拦截器：</p>
            <p>点击浏览器地址栏旁的拦截器图标，选择"在此网站上禁用"</p>
          </div>
          
          <button
            onClick={handleClose}
            className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            我知道了 💖
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBlockerNotice;