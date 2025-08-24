import React from 'react';
import { BarChart3, TrendingDown, FileText, Zap, Clock, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatisticsData {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  totalTimeSaved: number;
  formatBreakdown: {
    [format: string]: {
      count: number;
      originalSize: number;
      compressedSize: number;
    };
  };
}

interface StatisticsPanelProps {
  data: StatisticsData;
  className?: string;
}

export default function StatisticsPanel({ data, className = '' }: StatisticsPanelProps) {
  const { t } = useTranslation();
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化百分比
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // 计算节省的空间
  const spaceSaved = data.totalOriginalSize - data.totalCompressedSize;
  const spaceSavedPercentage = data.totalOriginalSize > 0 
    ? (spaceSaved / data.totalOriginalSize) * 100 
    : 0;

  // 获取最佳压缩格式
  const getBestFormat = () => {
    let bestFormat = '';
    let bestRatio = 0;
    
    Object.entries(data.formatBreakdown).forEach(([format, stats]) => {
      if (stats.originalSize > 0) {
        const ratio = ((stats.originalSize - stats.compressedSize) / stats.originalSize) * 100;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestFormat = format;
        }
      }
    });
    
    return { format: bestFormat, ratio: bestRatio };
  };

  const bestFormat = getBestFormat();

  if (data.totalFiles === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
          <p className="text-sm md:text-base">{t('statistics.noImages')}</p>
          <p className="text-xs md:text-sm mt-1">{t('statistics.uploadHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          {t('statistics.title')}
        </h3>
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          {t('statistics.completed', { completed: data.completedFiles, total: data.totalFiles })}
        </div>
      </div>

      {/* 主要统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4 text-center">
          <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1 md:mb-2" />
          <div className="text-lg md:text-2xl font-bold text-blue-900 dark:text-blue-100">
            {data.totalFiles}
          </div>
          <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400">{t('statistics.totalFiles')}</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 md:p-4 text-center">
          <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 mx-auto mb-1 md:mb-2" />
          <div className="text-lg md:text-2xl font-bold text-green-900 dark:text-green-100">
            {formatPercentage(data.averageCompressionRatio)}
          </div>
          <div className="text-xs md:text-sm text-green-600 dark:text-green-400">{t('statistics.averageCompression')}</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 md:p-4 text-center">
          <Zap className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1 md:mb-2" />
          <div className="text-lg md:text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatFileSize(spaceSaved)}
          </div>
          <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400">{t('statistics.totalSaved')}</div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 md:p-4 text-center">
          <Target className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400 mx-auto mb-1 md:mb-2" />
          <div className="text-lg md:text-2xl font-bold text-orange-900 dark:text-orange-100">
            {data.completedFiles > 0 ? Math.round((data.completedFiles / data.totalFiles) * 100) : 0}%
          </div>
          <div className="text-xs md:text-sm text-orange-600 dark:text-orange-400">{t('statistics.successRate')}</div>
        </div>
      </div>

      {/* 文件大小对比 */}
      <div className="mb-4 md:mb-6">
        <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">{t('statistics.sizeComparison')}</h4>
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{t('statistics.originalSize')}</span>
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatFileSize(data.totalOriginalSize)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{t('statistics.compressedSize')}</span>
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatFileSize(data.totalCompressedSize)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
            <span className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400">{t('statistics.spaceSaved')}</span>
            <span className="text-xs md:text-sm font-bold text-green-600 dark:text-green-400">
              {formatFileSize(spaceSaved)} ({formatPercentage(spaceSavedPercentage)})
            </span>
          </div>
        </div>
      </div>

      {/* 格式分析 */}
      {Object.keys(data.formatBreakdown).length > 0 && (
        <div className="mb-4 md:mb-6">
          <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">{t('statistics.formatAnalysis')}</h4>
          <div className="space-y-2">
            {Object.entries(data.formatBreakdown).map(([format, stats]) => {
              const compressionRatio = stats.originalSize > 0 
                ? ((stats.originalSize - stats.compressedSize) / stats.originalSize) * 100 
                : 0;
              
              return (
                <div key={format} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 uppercase">
                      {format}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                      {t('statistics.fileCount', { count: stats.count })}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatPercentage(compressionRatio)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      {t('statistics.saved', { size: formatFileSize(stats.originalSize - stats.compressedSize) })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 最佳格式推荐 */}
      {bestFormat.format && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-3 md:p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-1 md:mb-2">
            <Target className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs md:text-sm font-medium text-green-800 dark:text-green-200">
              {t('statistics.bestFormat')}
            </span>
          </div>
          <p className="text-xs md:text-sm text-green-700 dark:text-green-300">
            {t('statistics.bestFormatDescription', { 
              format: bestFormat.format.toUpperCase(), 
              ratio: formatPercentage(bestFormat.ratio) 
            })}
          </p>
        </div>
      )}

      {/* 处理失败提示 */}
      {data.failedFiles > 0 && (
        <div className="mt-3 md:mt-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 md:p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-red-500"></div>
            <span className="text-xs md:text-sm font-medium text-red-800 dark:text-red-200">
              {t('statistics.processingFailed')}
            </span>
          </div>
          <p className="text-xs md:text-sm text-red-700 dark:text-red-300">
            {t('statistics.failedDescription', { count: data.failedFiles })}
          </p>
        </div>
      )}
    </div>
  );
}

// 统计数据计算工具函数
export const calculateStatistics = (images: Array<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: string;
  file: File;
  processedData?: string;
}>): StatisticsData => {
  const completedImages = images.filter(img => img.status === 'completed');
  const failedImages = images.filter(img => img.status === 'failed');
  
  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressedSize = completedImages.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
  
  // 计算平均压缩率
  const compressionRatios = completedImages
    .map(img => parseFloat(img.compressionRatio || '0'))
    .filter(ratio => !isNaN(ratio));
  const averageCompressionRatio = compressionRatios.length > 0 
    ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length 
    : 0;
  
  // 格式分析
  const formatBreakdown: StatisticsData['formatBreakdown'] = {};
  completedImages.forEach(img => {
    const format = img.file.type.split('/')[1] || 'unknown';
    if (!formatBreakdown[format]) {
      formatBreakdown[format] = {
        count: 0,
        originalSize: 0,
        compressedSize: 0
      };
    }
    formatBreakdown[format].count++;
    formatBreakdown[format].originalSize += img.originalSize;
    formatBreakdown[format].compressedSize += img.compressedSize || 0;
  });
  
  return {
    totalFiles: images.length,
    completedFiles: completedImages.length,
    failedFiles: failedImages.length,
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio,
    totalTimeSaved: 0, // 可以根据需要计算
    formatBreakdown
  };
};