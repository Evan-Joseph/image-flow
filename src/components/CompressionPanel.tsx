import React from 'react';
import { Settings, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CompressionPanelProps {
  quality: number;
  format: string;
  isMemeMode: boolean;
  memeIntensity: number;
  onQualityChange: (quality: number) => void;
  onFormatChange: (format: string) => void;
  onMemeToggle: (enabled: boolean) => void;
  onMemeIntensityChange: (intensity: number) => void;
  onProcess: () => void;
  isProcessing: boolean;
  imageCount: number;
}

export default function CompressionPanel({
  quality,
  format,
  isMemeMode,
  memeIntensity,
  onQualityChange,
  onFormatChange,
  onMemeToggle,
  onMemeIntensityChange,
  onProcess,
  isProcessing,
  imageCount
}: CompressionPanelProps) {
  const { t } = useTranslation();
  
  const formats = [
    { value: 'jpeg', label: 'JPEG', description: t('compression.formats.jpeg') },
    { value: 'png', label: 'PNG', description: t('compression.formats.png') },
    { value: 'webp', label: 'WebP', description: t('compression.formats.webp') },
    { value: 'avif', label: 'AVIF', description: t('compression.formats.avif') }
  ];

  const getQualityLabel = (quality: number) => {
    if (isMemeMode) return t('compression.quality.meme');
    if (quality >= 90) return t('compression.quality.veryHigh');
    if (quality >= 75) return t('compression.quality.high');
    if (quality >= 50) return t('compression.quality.medium');
    if (quality >= 25) return t('compression.quality.low');
    return t('compression.quality.veryLow');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-4 md:mb-6">
        <Settings className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('compression.title')}</h2>
      </div>

      {/* Meme模式开关 */}
      <div className="mb-4 md:mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎭</span>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('compression.memeMode.title')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('compression.memeMode.description')}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMemeMode}
                onChange={(e) => onMemeToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
          
          {/* Meme强度调节 - 无极调节 */}
          {isMemeMode && (
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-purple-700 dark:text-purple-300">{t('compression.memeMode.intensity')}</label>
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  {quality}% - {quality <= 8 ? t('compression.memeMode.heavy') : quality <= 12 ? t('compression.memeMode.medium') : t('compression.memeMode.light')}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                value={quality}
                onChange={(e) => onQualityChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 dark:from-red-600 dark:via-orange-600 dark:to-yellow-600 slider-thumb"
                style={{
                  background: `linear-gradient(to right, 
                    #f87171 0%, 
                    #fb923c ${((quality - 5) / 10) * 50}%, 
                    #fbbf24 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400 mt-1">
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 质量滑块 - 在Meme模式时收起 */}
      {!isMemeMode && (
      <div className="mb-4 md:mb-6 animate-in slide-in-from-top duration-300">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('compression.quality.title')}
          </label>
          <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {quality}% - <span className="hidden sm:inline">{getQualityLabel(quality)}</span>
          </span>
        </div>
        <input
          type="range"
          min={isMemeMode ? "5" : "10"}
          max={isMemeMode ? "15" : "100"}
          value={isMemeMode ? Math.min(quality, 15) : quality}
          onChange={(e) => onQualityChange(Number(e.target.value))}
          disabled={isMemeMode}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider ${
            isMemeMode 
              ? 'bg-gradient-to-r from-red-300 to-orange-300 dark:from-red-700 dark:to-orange-700 cursor-not-allowed' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span className="hidden sm:inline">{t('compression.quality.minFile')}</span>
          <span className="sm:hidden">{t('compression.quality.minFileShort')}</span>
          <span className="hidden sm:inline">{t('compression.quality.bestQuality')}</span>
          <span className="sm:hidden">{t('compression.quality.bestQualityShort')}</span>
        </div>
      </div>
      )}

      {/* 格式选择 */}
      <div className="mb-4 md:mb-6">
        <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3 block">
          {t('compression.format')}
        </label>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {formats.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => onFormatChange(fmt.value)}
              className={`
                p-2 md:p-3 rounded-lg border-2 transition-all duration-300 text-left transform hover:scale-105 hover:shadow-md active:scale-95
                ${format === fmt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }
              `}
            >
              <div className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">{fmt.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block transition-colors duration-200">{fmt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 处理按钮 */}
      <button
        onClick={onProcess}
        disabled={isProcessing || imageCount === 0}
        className={`
          w-full flex items-center justify-center space-x-2 py-2.5 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium transition-all duration-300 transform relative overflow-hidden
          ${isProcessing || imageCount === 0
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
          }
        `}
      >
        {!isProcessing && imageCount > 0 && (
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out"></div>
         )}
        <Zap className={`w-4 h-4 md:w-5 md:h-5 relative z-10 ${isProcessing ? 'animate-pulse' : 'transition-transform duration-200 group-hover:scale-110'}`} />
        <span className="relative z-10">
          {isProcessing 
            ? t('compression.processing') 
            : imageCount === 0 
              ? t('compression.uploadFirst') 
              : t('compression.startProcessing', { count: imageCount })
          }
        </span>
      </button>

      {/* 提示信息 */}
      {isMemeMode && (
        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs md:text-sm text-red-800 dark:text-red-200">
            <span className="text-base mr-1">⚠️</span>
            <strong>{t('compression.memeMode.warning')}:</strong> {t('compression.memeMode.warningDescription')}
          </p>
        </div>
      )}
      
      {format === 'avif' && !isMemeMode && (
        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
            <strong>{t('compression.avifFormat')}:</strong> {t('compression.avifDescription')}
          </p>
        </div>
      )}
    </div>
  );
}