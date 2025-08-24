'use client';

import { useEffect, useState, useRef } from 'react';
import { AlertCircle, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GoogleAdProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  placement?: 'header' | 'sidebar' | 'footer' | 'inline' | 'above-fold' | 'within-content';
  autoAds?: boolean;
  lazyLoad?: boolean;
  adTest?: boolean;
}

// 扩展Window接口以支持adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = { display: 'block' },
  className = '',
  title,
  placement = 'inline',
  autoAds = false,
  lazyLoad = true,
  adTest = false
}: GoogleAdProps) {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const adRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  
  const adTitle = title || t('ads.title');

  // 获取广告位样式 - 基于AdSense最佳实践
  const getAdStyles = () => {
    const baseStyles = { ...style };
    
    switch (placement) {
      case 'header':
        return {
          ...baseStyles,
          minHeight: '50px',
          maxHeight: '90px',
          width: '100%'
        };
      case 'above-fold':
        return {
          ...baseStyles,
          minHeight: '250px',
          maxHeight: '300px',
          width: '100%'
        };
      case 'within-content':
        return {
          ...baseStyles,
          minHeight: '280px',
          maxHeight: '400px',
          width: '100%',
          margin: '20px auto'
        };
      case 'sidebar':
        return {
          ...baseStyles,
          minHeight: '250px',
          maxHeight: '600px',
          width: '300px'
        };
      case 'footer':
        return {
          ...baseStyles,
          minHeight: '90px',
          maxHeight: '250px',
          width: '100%'
        };
      default:
        return {
          ...baseStyles,
          minHeight: '250px',
          width: '100%'
        };
    }
  };

  // 获取广告格式 - 基于位置优化
  const getAdFormat = () => {
    if (format !== 'auto') return format;
    
    switch (placement) {
      case 'header':
      case 'footer':
        return 'horizontal';
      case 'sidebar':
        return 'vertical';
      case 'above-fold':
      case 'within-content':
        return 'rectangle';
      default:
        return 'auto';
    }
  };

  // 检查广告是否在视口中（用于懒加载）
  const isInViewport = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  // 加载广告 - 优化版本
  const loadAd = () => {
    if (!adRef.current) return;
    
    // 懒加载检查
    if (lazyLoad && !isInViewport(adRef.current)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer.disconnect();
              loadAdContent();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(adRef.current);
      return;
    }
    
    loadAdContent();
  };

  // 实际加载广告内容
  const loadAdContent = () => {
    if (import.meta.env.PROD && window.adsbygoogle) {
      try {
        // Auto Ads配置
        if (autoAds) {
          (window.adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: import.meta.env.VITE_GOOGLE_ADSENSE_ID,
            enable_page_level_ads: true,
            overlays: {bottom: true},
            vignette: {}
          });
        } else {
          // 标准广告配置
          const adConfig: any = {};
          
          // 测试模式配置
          if (adTest || import.meta.env.DEV) {
            adConfig.google_ad_test = 'on';
          }
          
          (window.adsbygoogle = window.adsbygoogle || []).push(adConfig);
        }
        
        setIsLoaded(true);
        setHasError(false);
        
        // 性能监控
        if (window.gtag) {
          window.gtag('event', 'ad_loaded', {
            event_category: 'ads',
            event_label: `${placement}_${slot}`,
            value: 1
          });
        }
      } catch (error) {
        console.error('AdSense error:', error);
        setHasError(true);
        
        // 错误监控
        if (window.gtag) {
          window.gtag('event', 'ad_error', {
            event_category: 'ads',
            event_label: `${placement}_${slot}`,
            value: 1
          });
        }
        
        // 智能重试机制
        const retryDelay = Math.min(5000 * Math.pow(2, retryTimeoutRef.current ? 1 : 0), 30000);
        retryTimeoutRef.current = setTimeout(() => {
          if (adRef.current) {
            loadAdContent();
          }
        }, retryDelay);
      }
    }
  };

  useEffect(() => {
    // 延迟加载广告，避免影响页面性能
    const timer = setTimeout(() => {
      loadAd();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 手动重试
  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    loadAd();
  };

  // 切换可见性
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 开发环境显示占位符
  if (import.meta.env.DEV) {
    return (
      <div 
        ref={adRef}
        className={`bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 rounded-lg p-4 text-center transition-all duration-200 ${className}`}
        style={getAdStyles()}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 text-sm font-medium">{adTitle} ({t('ads.devEnvironment')})</p>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Slot: {slot}</span>
            <button
              onClick={toggleVisibility}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isVisible ? t('ads.hide') : t('ads.show')}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {isVisible && (
          <div className="space-y-1">
            <p className="text-xs text-gray-400">{t('ads.position')}: {placement}</p>
            <p className="text-xs text-gray-400">{t('ads.format')}: {getAdFormat()}</p>
            <p className="text-xs text-gray-400">{t('ads.responsive')}: {responsive ? t('ads.yes') : t('ads.no')}</p>
            <p className="text-xs text-gray-400">Auto Ads: {autoAds ? t('ads.yes') : t('ads.no')}</p>
            <p className="text-xs text-gray-400">Lazy Load: {lazyLoad ? t('ads.yes') : t('ads.no')}</p>
            {(adTest || import.meta.env.DEV) && (
              <p className="text-xs text-yellow-500">⚠️ Test Mode Active</p>
            )}
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">AdSense Optimized</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 生产环境
  if (!isVisible) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <button
          onClick={toggleVisibility}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t('ads.show')}
        </button>
      </div>
    );
  }

  return (
    <div ref={adRef} className={`relative ${className}`}>
      {/* 广告标签 */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{t('ads.label')}</span>
        <button
          onClick={toggleVisibility}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title={t('ads.hide')}
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>

      {/* 错误状态 */}
      {hasError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">{t('ads.loadFailed')}</p>
          <button
            onClick={handleRetry}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            {t('ads.retry')}
          </button>
        </div>
      )}

      {/* 广告内容 */}
      {!hasError && (
        <>
          <ins
            className="adsbygoogle"
            style={getAdStyles()}
            data-ad-client={import.meta.env.VITE_GOOGLE_ADSENSE_ID}
            data-ad-slot={slot}
            data-ad-format={getAdFormat()}
            data-full-width-responsive={responsive.toString()}
            data-ad-test={adTest || import.meta.env.DEV ? 'on' : undefined}
            data-adbreak-test={import.meta.env.DEV ? 'on' : undefined}
            {...(autoAds && {
              'data-page-level-ads': 'true',
              'data-auto-ads-type': 'adsense'
            })}
          />
          
          {/* 加载状态 */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">{t('ads.loading')}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}