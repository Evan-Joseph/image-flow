import React, { useState, useRef, useEffect } from 'react';
import { X, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedData?: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: string;
  error?: string;
}

interface ImageListProps {
  images: ImageItem[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}

// 懒加载图片组件
const LazyImage: React.FC<{
  src: string;
  alt: string;
  className: string;
  onLoad?: () => void;
}> = ({ src, alt, className, onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 group-hover/image:brightness-75 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            loading="lazy"
            decoding="async"
            width="300"
            height="200"
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <Loader className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}
        </>
      )}
      {!isInView && (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default function ImageList({ images, onRemove, onDownload, onSelect, selectedId }: ImageListProps) {
  const { t } = useTranslation();
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: ImageItem['status']) => {
    switch (status) {
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm md:text-base">{t('imageList.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {images.map((image) => (
        <div 
          key={image.id} 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-lg group ${
            selectedId === image.id 
              ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg scale-105' 
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
          } ${onSelect ? 'cursor-pointer' : ''}`}
          onClick={() => onSelect?.(image.id)}
        >
          {/* 图片预览 */}
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 group/image">
            <LazyImage
              src={image.preview}
              alt={image.file.name}
              className="relative w-full h-full"
            />
            {/* 悬停提示 */}
            {onSelect && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-sm">
                <div className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transform scale-95 group-hover/image:scale-100 transition-all duration-300">
                  {t('imageList.hoverTip')}
                </div>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="absolute top-1 right-1 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 transform hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
            >
              <X className="w-3 h-3 md:w-4 md:h-4 transition-transform duration-200" />
            </button>
            {/* 状态指示器 */}
            <div className="absolute top-1 left-1 md:top-2 md:left-2 flex items-center space-x-1">
              {getStatusIcon(image.status)}
            </div>
          </div>

          {/* 文件信息 */}
          <div className="p-3 md:p-4">
            <h3 className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 truncate" title={image.file.name}>
              {image.file.name}
            </h3>
            
            <div className="mt-2 space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t('imageList.originalSize')}:</span>
                <span>{formatFileSize(image.originalSize)}</span>
              </div>
              
              {image.compressedSize && (
                <>
                  <div className="flex justify-between">
                    <span>{t('imageList.compressedSize')}:</span>
                    <span>{formatFileSize(image.compressedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('statistics.compressionRatio')}:</span>
                    <span className="text-green-600 dark:text-green-400">{image.compressionRatio}%</span>
                  </div>
                </>
              )}
              
              {image.error && (
                <div className="text-red-500 text-xs mt-1">
                  {image.error}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="mt-2 md:mt-3 flex space-x-2">
              {image.status === 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(image.id);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md text-xs md:text-sm"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 group-hover:scale-110" />
                  <span className="hidden sm:inline">{t('imageList.actions.download')}</span>
                  <span className="sm:hidden">{t('imageList.actions.downloadShort')}</span>
                </button>
              )}
              
              {image.status === 'failed' && (
                <button
                  className="flex-1 px-2 md:px-3 py-1.5 md:py-2 bg-gray-500 text-white rounded-md text-xs md:text-sm cursor-not-allowed"
                  disabled
                >
                  {t('imageList.status.failed')}
                </button>
              )}
              
              {image.status === 'processing' && (
                <button
                  className="flex-1 px-2 md:px-3 py-1.5 md:py-2 bg-blue-500 text-white rounded-md text-xs md:text-sm cursor-not-allowed"
                  disabled
                >
                  {t('imageList.status.processing')}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}