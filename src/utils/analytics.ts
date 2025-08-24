// Google Analytics 和 Search Console 集成工具

// 扩展 Window 接口
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// 分析配置接口
interface AnalyticsConfig {
  gaId?: string;
  gscId?: string;
  enableDebug?: boolean;
  enableEcommerce?: boolean;
  enableEnhancedMeasurement?: boolean;
}

// 事件参数接口
interface EventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameter?: any;
  [key: string]: any;
}

// 电子商务事件参数
interface EcommerceParams {
  currency?: string;
  value?: number;
  transaction_id?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity?: number;
    price?: number;
  }>;
}

// 默认配置
const defaultConfig: AnalyticsConfig = {
  gaId: import.meta.env.VITE_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID',
  enableDebug: import.meta.env.DEV,
  enableEcommerce: true,
  enableEnhancedMeasurement: true
};

// 初始化 Google Analytics
export const initGoogleAnalytics = (config: AnalyticsConfig = defaultConfig) => {
  if (typeof window === 'undefined' || !config.gaId || config.gaId === 'GA_MEASUREMENT_ID') {
    console.warn('Google Analytics not initialized: Missing or invalid GA ID');
    return;
  }

  // 创建 gtag 脚本
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaId}`;
  document.head.appendChild(script);

  // 初始化 dataLayer 和 gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  // 配置 Google Analytics
  window.gtag('js', new Date());
  window.gtag('config', config.gaId, {
    debug_mode: config.enableDebug,
    enhanced_measurement: config.enableEnhancedMeasurement,
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    cookie_flags: 'SameSite=None;Secure',
    // 隐私设置
    anonymize_ip: true,
    respect_dnt: true
  });

  // 设置用户属性
  window.gtag('config', config.gaId, {
    custom_map: {
      dimension1: 'user_type',
      dimension2: 'device_performance',
      dimension3: 'compression_usage'
    }
  });

  console.log('Google Analytics initialized with ID:', config.gaId);
};

// 发送页面浏览事件
export const trackPageView = (pagePath?: string, pageTitle?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', defaultConfig.gaId, {
    page_path: pagePath || window.location.pathname,
    page_title: pageTitle || document.title
  });
};

// 发送自定义事件
export const trackEvent = (eventName: string, params: EventParams = {}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, {
    event_category: params.event_category || 'engagement',
    event_label: params.event_label,
    value: params.value,
    ...params
  });

  if (defaultConfig.enableDebug) {
    console.log('Analytics Event:', eventName, params);
  }
};

// 图片处理相关事件追踪
export const trackImageProcessing = {
  // 图片上传
  upload: (fileCount: number, totalSize: number) => {
    trackEvent('image_upload', {
      event_category: 'image_processing',
      event_label: 'file_upload',
      value: fileCount,
      file_count: fileCount,
      total_size_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100
    });
  },

  // 图片压缩
  compress: (originalSize: number, compressedSize: number, format: string) => {
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
    trackEvent('image_compress', {
      event_category: 'image_processing',
      event_label: `compress_${format}`,
      value: compressionRatio,
      original_size_kb: Math.round(originalSize / 1024),
      compressed_size_kb: Math.round(compressedSize / 1024),
      compression_ratio: compressionRatio
    });
  },

  // 格式转换
  convert: (fromFormat: string, toFormat: string, fileSize: number) => {
    trackEvent('image_convert', {
      event_category: 'image_processing',
      event_label: `${fromFormat}_to_${toFormat}`,
      value: Math.round(fileSize / 1024),
      from_format: fromFormat,
      to_format: toFormat,
      file_size_kb: Math.round(fileSize / 1024)
    });
  },

  // 批量处理
  batch: (fileCount: number, totalSavings: number) => {
    trackEvent('batch_process', {
      event_category: 'image_processing',
      event_label: 'batch_complete',
      value: fileCount,
      file_count: fileCount,
      total_savings_mb: Math.round(totalSavings / 1024 / 1024 * 100) / 100
    });
  },

  // 下载
  download: (fileCount: number, downloadType: 'single' | 'batch') => {
    trackEvent('image_download', {
      event_category: 'image_processing',
      event_label: downloadType,
      value: fileCount,
      file_count: fileCount,
      download_type: downloadType
    });
  }
};

// 用户行为事件追踪
export const trackUserBehavior = {
  // 主题切换
  themeChange: (theme: string) => {
    trackEvent('theme_change', {
      event_category: 'user_preference',
      event_label: theme,
      theme: theme
    });
  },

  // 语言切换
  languageChange: (language: string) => {
    trackEvent('language_change', {
      event_category: 'user_preference',
      event_label: language,
      language: language
    });
  },

  // 功能使用
  featureUse: (feature: string, action: string) => {
    trackEvent('feature_use', {
      event_category: 'feature_interaction',
      event_label: `${feature}_${action}`,
      feature: feature,
      action: action
    });
  },

  // 错误追踪
  error: (errorType: string, errorMessage: string, context?: string) => {
    trackEvent('error_occurred', {
      event_category: 'error',
      event_label: errorType,
      error_type: errorType,
      error_message: errorMessage,
      context: context
    });
  }
};

// 性能事件追踪
export const trackPerformance = {
  // 页面加载时间
  pageLoad: (loadTime: number) => {
    trackEvent('page_load_time', {
      event_category: 'performance',
      event_label: 'load_complete',
      value: Math.round(loadTime),
      load_time_ms: Math.round(loadTime)
    });
  },

  // 图片处理时间
  processingTime: (operation: string, duration: number, fileSize: number) => {
    trackEvent('processing_time', {
      event_category: 'performance',
      event_label: operation,
      value: Math.round(duration),
      operation: operation,
      duration_ms: Math.round(duration),
      file_size_kb: Math.round(fileSize / 1024)
    });
  }
};

// 广告事件追踪
export const trackAds = {
  // 广告加载
  loaded: (adSlot: string, placement: string) => {
    trackEvent('ad_loaded', {
      event_category: 'ads',
      event_label: `${placement}_${adSlot}`,
      ad_slot: adSlot,
      placement: placement
    });
  },

  // 广告错误
  error: (adSlot: string, placement: string, error: string) => {
    trackEvent('ad_error', {
      event_category: 'ads',
      event_label: `${placement}_${adSlot}`,
      ad_slot: adSlot,
      placement: placement,
      error_message: error
    });
  },

  // 广告点击
  click: (adSlot: string, placement: string) => {
    trackEvent('ad_click', {
      event_category: 'ads',
      event_label: `${placement}_${adSlot}`,
      ad_slot: adSlot,
      placement: placement
    });
  }
};

// 设置用户属性
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', defaultConfig.gaId, {
    user_properties: properties
  });
};

// 设置自定义维度
export const setCustomDimensions = (dimensions: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  Object.entries(dimensions).forEach(([key, value]) => {
    window.gtag('config', defaultConfig.gaId, {
      custom_map: { [key]: value }
    });
  });
};

// 初始化 Search Console（通过 meta 标签验证）
export const initSearchConsole = (verificationCode?: string) => {
  if (typeof document === 'undefined' || !verificationCode) {
    console.warn('Search Console verification code not provided');
    return;
  }

  // 添加 Search Console 验证 meta 标签
  const metaTag = document.createElement('meta');
  metaTag.name = 'google-site-verification';
  metaTag.content = verificationCode;
  document.head.appendChild(metaTag);

  console.log('Search Console verification meta tag added');
};

// 发送转换事件（用于 AdSense 优化）
export const trackConversion = (conversionLabel: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'conversion', {
    send_to: `${defaultConfig.gaId}/${conversionLabel}`,
    value: value,
    currency: 'USD'
  });
};

// 导出配置和类型
export type { AnalyticsConfig, EventParams, EcommerceParams };
export { defaultConfig };