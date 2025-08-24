import React, { useState, useCallback } from 'react';
import { Play, Pause, Download, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import JSZip from 'jszip';
import { useTranslation } from 'react-i18next';

interface BatchProcessorProps {
  images: Array<{
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processedData?: string;
    originalSize: number;
    compressedSize?: number;
    compressionRatio?: string;
    error?: string;
  }>;
  quality: number;
  format: string;
  onProcess: () => Promise<void>;
  isProcessing: boolean;
}

export default function BatchProcessor({
  images,
  quality,
  format,
  onProcess,
  isProcessing
}: BatchProcessorProps) {
  const { t } = useTranslation();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const pendingCount = images.filter(img => img.status === 'pending').length;
  const processingCount = images.filter(img => img.status === 'processing').length;
  const completedCount = images.filter(img => img.status === 'completed').length;
  const failedCount = images.filter(img => img.status === 'failed').length;
  const totalCount = images.length;

  const processingProgress = totalCount > 0 
    ? ((completedCount + failedCount) / totalCount) * 100 
    : 0;

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 计算总体统计
  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressedSize = images
    .filter(img => img.status === 'completed' && img.compressedSize)
    .reduce((sum, img) => sum + (img.compressedSize || 0), 0);
  const overallCompressionRatio = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(2)
    : '0.00';

  // 批量下载
  const handleDownloadAll = useCallback(async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.processedData);
    if (completedImages.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      
      for (let i = 0; i < completedImages.length; i++) {
        const image = completedImages[i];
        if (image.processedData) {
          // 将base64转换为blob
          const response = await fetch(image.processedData);
          const blob = await response.blob();
          const fileName = `compressed_${image.file.name.split('.')[0]}.${format}`;
          zip.file(fileName, blob);
          
          setDownloadProgress(((i + 1) / completedImages.length) * 100);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `compressed_images_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Batch download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [images, format]);

  // 估算剩余时间
  const getEstimatedTime = () => {
    if (!isProcessing || processingCount === 0) return null;
    
    const avgTimePerImage = 3; // 假设每张图片平均处理3秒
    const remainingImages = pendingCount + processingCount;
    const estimatedSeconds = remainingImages * avgTimePerImage;
    
    if (estimatedSeconds < 60) {
      return t('batch.estimatedTimeSeconds', '约 {{seconds}} 秒', { seconds: estimatedSeconds });
    } else {
      const minutes = Math.ceil(estimatedSeconds / 60);
      return t('batch.estimatedTimeMinutes', '约 {{minutes}} 分钟', { minutes });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('batch.title')}
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('batch.imageCount', '{{count}} 张图片', { count: totalCount })}
        </div>
      </div>

      {/* 处理统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('batch.pending', '待处理')}</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {pendingCount}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('batch.processing', '处理中')}</span>
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {processingCount}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('batch.completed', '已完成')}</span>
          </div>
          <div className="text-lg font-semibold text-green-600">
            {completedCount}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('batch.failed', '失败')}</span>
          </div>
          <div className="text-lg font-semibold text-red-600">
            {failedCount}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      {isProcessing && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('batch.progress')}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(processingProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          {getEstimatedTime() && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('batch.remainingTime', '剩余时间')}: {getEstimatedTime()}
            </div>
          )}
        </div>
      )}

      {/* 压缩统计 */}
      {completedCount > 0 && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            {t('batch.compressionStats', '压缩统计')}
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-600 dark:text-green-400">{t('batch.originalSize', '原始大小')}:</span>
              <div className="font-medium text-green-800 dark:text-green-200">
                {formatFileSize(totalOriginalSize)}
              </div>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400">{t('batch.compressedSize', '压缩后')}:</span>
              <div className="font-medium text-green-800 dark:text-green-200">
                {formatFileSize(totalCompressedSize)}
              </div>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400">{t('batch.saved', '节省')}:</span>
              <div className="font-medium text-green-800 dark:text-green-200">
                {overallCompressionRatio}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button
          onClick={onProcess}
          disabled={isProcessing || pendingCount === 0}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isProcessing || pendingCount === 0
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
          }`}
        >
          {isProcessing ? (
            <>
              <Pause className="w-5 h-5" />
              <span>{t('batch.processing')}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>
                {pendingCount === 0 ? t('batch.noPendingImages', '没有待处理图片') : t('batch.startProcessing', '开始处理 ({{count}} 张)', { count: pendingCount })}
              </span>
            </>
          )}
        </button>

        {completedCount > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="flex items-center justify-center space-x-2 py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{Math.round(downloadProgress)}%</span>
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                <span>{t('batch.downloadAll', '打包下载')} ({completedCount})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 设置信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('batch.quality', '压缩质量')}: {quality}%</span>
          <span>{t('batch.outputFormat', '输出格式')}: {format.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}