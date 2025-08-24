import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImagePreviewProps {
  originalImage: string;
  compressedImage?: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: string;
  isProcessing?: boolean;
}

export default function ImagePreview({
  originalImage,
  compressedImage,
  originalSize,
  compressedSize,
  compressionRatio,
  isProcessing = false
}: ImagePreviewProps) {
  const { t } = useTranslation();
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 处理鼠标拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(0, Math.min(100, newPosition)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理触摸事件（移动端支持）
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const newPosition = ((touch.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(0, Math.min(100, newPosition)));
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 缩放控制
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!originalImage) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>{t('preview.selectImageHint', '选择图片后将显示预览对比')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 头部控制栏 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('preview.title')}
          </h3>
          
          {/* 缩放控制 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title={t('preview.zoomOut', '缩小')}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title={t('preview.zoomIn', '放大')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title={t('preview.resetZoom', '重置缩放')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 文件信息 */}
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('preview.originalSize')}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatFileSize(originalSize)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('preview.compressedSize')}</p>
            {compressedSize !== undefined ? (
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatFileSize(compressedSize)}
                </p>
                {compressionRatio && (
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    {t('preview.saved', '节省')} {compressionRatio}%
                  </p>
                )}
              </div>
            ) : isProcessing ? (
              <p className="text-blue-500">{t('preview.processing')}</p>
            ) : (
              <p className="text-gray-400">{t('preview.notProcessed', '未处理')}</p>
            )}
          </div>
        </div>
      </div>

      {/* 图片对比区域 */}
      <div 
        ref={containerRef}
        className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-crosshair"
        style={{ userSelect: 'none' }}
      >
        {/* 原始图片 */}
        <div className="absolute inset-0">
          <img
            src={originalImage}
            alt={t('preview.original')}
            className="w-full h-full object-contain"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        </div>

        {/* 压缩后图片 */}
        {compressedImage && (
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
          >
            <img
              src={compressedImage}
              alt={t('preview.compressed')}
              className="w-full h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>
        )}

        {/* 分割线 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-col-resize z-10"
          style={{ left: `${splitPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* 分割线手柄 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center">
            <div className="w-1 h-4 bg-gray-400 rounded"></div>
          </div>
        </div>

        {/* 标签 */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {t('preview.original')}
        </div>
        {compressedImage && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {t('preview.compressed')}
          </div>
        )}

        {/* 处理中遮罩 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-900 dark:text-gray-100">{t('preview.processing')}</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">{t('preview.dragHint', '拖拽中间的分割线来对比压缩前后的效果')}</p>
      </div>
    </div>
  );
}