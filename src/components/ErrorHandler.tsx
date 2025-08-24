import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorInfo {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ErrorHandlerProps {
  errors: ErrorInfo[];
  onRetryAll?: () => void;
  onDismissAll?: () => void;
}

export default function ErrorHandler({ errors, onRetryAll, onDismissAll }: ErrorHandlerProps) {
  const { t } = useTranslation();
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedErrors(newExpanded);
  };

  const getIcon = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  if (errors.length === 0) {
    return null;
  }

  const retryableErrors = errors.filter(error => error.retryable);
  const errorCount = errors.filter(error => error.type === 'error').length;
  const warningCount = errors.filter(error => error.type === 'warning').length;

  return (
    <div className="space-y-4">
      {/* 错误统计和批量操作 */}
      {errors.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('errors.summary', { count: errors.length })}
              </div>
              {errorCount > 0 && (
                <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('errors.errorCount', { count: errorCount })}</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center space-x-1 text-sm text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('errors.warningCount', { count: warningCount })}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {retryableErrors.length > 0 && onRetryAll && (
                <button
                  onClick={onRetryAll}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('errors.retryAll')}</span>
                </button>
              )}
              {onDismissAll && (
                <button
                  onClick={onDismissAll}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>{t('errors.clearAll')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 错误列表 */}
      <div className="space-y-3">
        {errors.map((error) => (
          <div
            key={error.id}
            className={`rounded-lg border p-4 ${getBackgroundColor(error.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getIcon(error.type)}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${getTextColor(error.type)}`}>
                    {error.message.length > 100 && !expandedErrors.has(error.id) ? (
                      <>
                        {error.message.substring(0, 100)}...
                        <button
                          onClick={() => toggleExpanded(error.id)}
                          className="ml-2 text-xs underline hover:no-underline"
                        >
                          {t('errors.expand')}
                        </button>
                      </>
                    ) : (
                      <>
                        {error.message}
                        {error.message.length > 100 && (
                          <button
                            onClick={() => toggleExpanded(error.id)}
                            className="ml-2 text-xs underline hover:no-underline"
                          >
                            {t('errors.collapse')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* 错误类型提示 */}
                  <div className="mt-2 text-xs opacity-75">
                    {error.type === 'error' && t('errors.errorDescription')}
                    {error.type === 'warning' && t('errors.warningDescription')}
                    {error.type === 'info' && t('errors.infoDescription')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {error.retryable && error.onRetry && (
                  <button
                    onClick={error.onRetry}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    title={t('errors.retry')}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                {error.onDismiss && (
                  <button
                    onClick={error.onDismiss}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    title={t('errors.dismiss')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 错误处理工具函数
export const createErrorInfo = (
  id: string,
  message: string,
  type: ErrorInfo['type'] = 'error',
  options?: {
    retryable?: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
  }
): ErrorInfo => ({
  id,
  message,
  type,
  retryable: options?.retryable || false,
  onRetry: options?.onRetry,
  onDismiss: options?.onDismiss
});

// 常见错误类型
export const ErrorTypes = {
  NETWORK_ERROR: 'network_error',
  FILE_TOO_LARGE: 'file_too_large',
  UNSUPPORTED_FORMAT: 'unsupported_format',
  PROCESSING_FAILED: 'processing_failed',
  QUOTA_EXCEEDED: 'quota_exceeded',
  SERVER_ERROR: 'server_error'
} as const;

// 错误消息模板
export const getErrorMessage = (type: string, details?: any, t?: any) => {
  if (!t) {
    // 如果没有传入翻译函数，返回默认英文消息
    switch (type) {
      case ErrorTypes.NETWORK_ERROR:
        return 'Network connection failed, please check your connection and try again';
      case ErrorTypes.FILE_TOO_LARGE:
        return `File too large, maximum supported size is ${details?.maxSize || '200MB'}`;
      case ErrorTypes.UNSUPPORTED_FORMAT:
        return `Unsupported file format: ${details?.format || 'unknown format'}`;
      case ErrorTypes.PROCESSING_FAILED:
        return `Image processing failed: ${details?.reason || 'unknown reason'}`;
      case ErrorTypes.QUOTA_EXCEEDED:
        return 'Processing quota exceeded, please try again later';
      case ErrorTypes.SERVER_ERROR:
        return `Server error (${details?.status || 500}): ${details?.message || 'internal error'}`;
      default:
        return details?.message || 'Unknown error occurred';
    }
  }
  
  switch (type) {
    case ErrorTypes.NETWORK_ERROR:
      return t('messages.networkError');
    case ErrorTypes.FILE_TOO_LARGE:
      return t('messages.fileTooLarge', { maxSize: details?.maxSize || '200MB' });
    case ErrorTypes.UNSUPPORTED_FORMAT:
      return t('messages.unsupportedFormat', { format: details?.format || t('messages.unknownFormat') });
    case ErrorTypes.PROCESSING_FAILED:
      return t('messages.processingFailed', { reason: details?.reason || t('messages.unknownReason') });
    case ErrorTypes.QUOTA_EXCEEDED:
      return t('messages.quotaExceeded');
    case ErrorTypes.SERVER_ERROR:
      return t('messages.serverError', { status: details?.status || 500, message: details?.message || t('messages.internalError') });
    default:
      return details?.message || t('messages.unknownError');
  }
};