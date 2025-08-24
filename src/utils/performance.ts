// Core Web Vitals 性能监控和优化工具

// Web Vitals 指标类型
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// 性能监控配置
interface PerformanceConfig {
  enableAnalytics?: boolean;
  enableConsoleLog?: boolean;
  enableBeacon?: boolean;
}

// 默认配置
const defaultConfig: PerformanceConfig = {
  enableAnalytics: true,
  enableConsoleLog: import.meta.env.DEV,
  enableBeacon: true
};

// 发送性能数据到 Google Analytics
export const sendToAnalytics = (metric: WebVitalsMetric) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_map: {
        metric_rating: metric.rating,
        metric_delta: metric.delta
      }
    });
  }
};

// 发送性能数据到服务器
export const sendToBeacon = (metric: WebVitalsMetric) => {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    });
    
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  }
};

// 性能指标处理函数
export const handleMetric = (metric: WebVitalsMetric, config: PerformanceConfig = defaultConfig) => {
  // 控制台输出（开发环境）
  if (config.enableConsoleLog) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta
    });
  }

  // 发送到 Google Analytics
  if (config.enableAnalytics) {
    sendToAnalytics(metric);
  }

  // 发送到服务器
  if (config.enableBeacon) {
    sendToBeacon(metric);
  }
};

// 图片懒加载优化
export const createImageObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: '50px 0px'
  });
};

// 预加载关键资源
export const preloadCriticalResources = () => {
  if (typeof document === 'undefined') return;

  // 预加载关键字体
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // 预连接到重要域名
  const preconnectDomains = [
    'https://pagead2.googlesyndication.com',
    'https://www.googletagmanager.com',
    'https://fonts.gstatic.com'
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// 防抖函数（优化性能）
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// 节流函数（优化性能）
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 检测设备性能
export const getDevicePerformance = () => {
  if (typeof navigator === 'undefined') return 'unknown';

  // 检查设备内存
  const memory = (navigator as any).deviceMemory;
  if (memory) {
    if (memory >= 8) return 'high';
    if (memory >= 4) return 'medium';
    return 'low';
  }

  // 检查硬件并发数
  const cores = navigator.hardwareConcurrency;
  if (cores) {
    if (cores >= 8) return 'high';
    if (cores >= 4) return 'medium';
    return 'low';
  }

  return 'unknown';
};

// 优化图片加载
export const optimizeImageLoading = () => {
  if (typeof document === 'undefined') return;

  // 为所有图片添加 loading="lazy"
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });
};

// 监控 CLS（累积布局偏移）
export const monitorCLS = () => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          console.log('Layout shift detected:', entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('CLS monitoring not supported:', error);
  }
};

// 初始化性能监控
export const initPerformanceMonitoring = (config: PerformanceConfig = defaultConfig) => {
  if (typeof window === 'undefined') return;

  // 预加载关键资源
  preloadCriticalResources();

  // 优化图片加载
  optimizeImageLoading();

  // 监控 CLS
  monitorCLS();

  // 动态导入 web-vitals 库（使用新的 API）
  import('web-vitals').then((vitals) => {
    // web-vitals 5.x 使用 on* 函数
    if ('onCLS' in vitals) {
      (vitals as any).onCLS((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('onFID' in vitals) {
      (vitals as any).onFID((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('onFCP' in vitals) {
      (vitals as any).onFCP((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('onLCP' in vitals) {
      (vitals as any).onLCP((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('onTTFB' in vitals) {
      (vitals as any).onTTFB((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    
    // 兼容旧版本 API
    if ('getCLS' in vitals) {
      (vitals as any).getCLS((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('getFID' in vitals) {
      (vitals as any).getFID((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('getFCP' in vitals) {
      (vitals as any).getFCP((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
    if ('getLCP' in vitals) {
      (vitals as any).getLCP((metric: any) => handleMetric(metric as WebVitalsMetric, config));
    }
  }).catch(error => {
    console.warn('Web Vitals library not available:', error);
  });
};

// 导出类型
export type { PerformanceConfig };