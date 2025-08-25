import React, { useState, useEffect } from 'react';
import { X, Shield, Heart } from 'lucide-react';

interface AdBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdBlockerModal: React.FC<AdBlockerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
        {/* 可爱的背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-100 to-purple-100 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-cyan-100 rounded-full translate-y-12 -translate-x-12"></div>
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="relative p-8 text-center">
          {/* 图标 */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Shield className="w-16 h-16 text-red-400" />
              <Heart className="w-6 h-6 text-pink-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            求求了！🥺
          </h2>

          {/* 内容 */}
          <div className="space-y-4 text-gray-600">
            <p className="text-lg leading-relaxed">
              <span className="font-semibold text-pink-600">Pls</span> 暂时关闭一下 AdBlocker 吧～
            </p>
            
            <p className="text-sm leading-relaxed">
              我们的图片处理功能需要加载一些必要的资源，
              <br />
              广告拦截器可能会影响正常使用哦 (´･ω･`)
            </p>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">💡 小提示：</span>
                <br />
                关闭后就能愉快地压缩图片啦！
                <br />
                我们承诺不会有恶意广告 ✨
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="mt-8 space-y-3">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              好的，我去关闭 AdBlocker 💖
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-500 py-2 px-6 rounded-xl font-medium hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              我知道了，先试试看
            </button>
          </div>

          {/* 底部装饰 */}
          <div className="mt-6 flex justify-center space-x-2">
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>🎨</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '150ms' }}>📸</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '300ms' }}>✨</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBlockerModal;