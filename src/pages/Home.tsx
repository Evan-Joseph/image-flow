import React, { useState, useCallback } from 'react';
import { Download, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DropZone from '../components/DropZone';
import ImageList from '../components/ImageList';
import CompressionPanel from '../components/CompressionPanel';
import ImagePreview from '../components/ImagePreview';
import BatchProcessor from '../components/BatchProcessor';
import ErrorHandler, { createErrorInfo, ErrorTypes, getErrorMessage } from '../components/ErrorHandler';
import StatisticsPanel, { calculateStatistics } from '../components/StatisticsPanel';

import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useImageProcessor } from '../hooks/useImageProcessor';
import JSZip from 'jszip';

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

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState('webp');
  const [isMemeMode, setIsMemeMode] = useState(false);
  const [memeIntensity, setMemeIntensity] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [previewCompressedData, setPreviewCompressedData] = useState<string | null>(null);
  const [isPreviewProcessing, setIsPreviewProcessing] = useState(false);
  const [errors, setErrors] = useState<Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    retryable?: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
  }>>([]);
  const { processImages, processImage } = useImageProcessor();

  const handleFilesAdded = useCallback((files: File[]) => {
    const newErrors: typeof errors = [];
    const validFiles: File[] = [];
    
    files.forEach(file => {
      // 文件大小检查
      if (file.size > 200 * 1024 * 1024) { // 200MB
        newErrors.push(createErrorInfo(
          `size_${file.name}`,
          getErrorMessage(ErrorTypes.FILE_TOO_LARGE, { maxSize: '200MB' }),
          'error'
        ));
        return;
      }
      
      // 文件类型检查
      if (!file.type.startsWith('image/')) {
        newErrors.push(createErrorInfo(
          `format_${file.name}`,
          getErrorMessage(ErrorTypes.UNSUPPORTED_FORMAT, { format: file.type }),
          'warning'
        ));
        return;
      }
      
      validFiles.push(file);
    });
    
    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
    }
    
    if (validFiles.length > 0) {
      const newImages: ImageItem[] = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
        originalSize: file.size
      }));
      
      setImages(prev => [...prev, ...newImages]);
    }
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
    
    // 如果删除的是选中的图片，清除选择
    if (selectedImageId === id) {
      setSelectedImageId(null);
      setPreviewCompressedData(null);
    }
    
    // 清除相关错误
    setErrors(prev => prev.filter(error => !error.id.includes(id)));
  }, [selectedImageId]);

  const handleDownloadImage = useCallback((id: string) => {
    const image = images.find(img => img.id === id);
    if (image && image.processedData) {
      const link = document.createElement('a');
      link.href = image.processedData;
      link.download = `compressed_${image.file.name.split('.')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [images, format]);

  // 实时预览处理
  const handlePreviewUpdate = useCallback(async () => {
    if (!selectedImageId) return;
    
    const selectedImage = images.find(img => img.id === selectedImageId);
    if (!selectedImage) return;

    setIsPreviewProcessing(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(selectedImage.file);
      });

      const actualQuality = isMemeMode ? (5 + memeIntensity * 5) : quality;
      const result = await processImage(imageData, actualQuality, format, selectedImage.originalSize, isMemeMode);
      if (result.success) {
        setPreviewCompressedData(result.data || null);
        // 清除相关的预览错误
        setErrors(prev => prev.filter(error => !error.id.includes(`preview_${selectedImageId}`)));
      } else {
        throw new Error(result.error || '预览处理失败');
      }
    } catch (error) {
      console.error('预览处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : '预览处理失败';
      setErrors(prev => [
        ...prev.filter(error => !error.id.includes(`preview_${selectedImageId}`)),
        createErrorInfo(
          `preview_${selectedImageId}`,
          `预览失败: ${errorMessage}`,
          'warning',
          {
            retryable: true,
            onRetry: handlePreviewUpdate,
            onDismiss: () => setErrors(prev => prev.filter(error => error.id !== `preview_${selectedImageId}`))
          }
        )
      ]);
    } finally {
      setIsPreviewProcessing(false);
    }
  }, [selectedImageId, images, quality, format, isMemeMode, memeIntensity, processImage]);

  // 当选中图片或设置改变时更新预览
  React.useEffect(() => {
    if (selectedImageId) {
      handlePreviewUpdate();
    }
  }, [selectedImageId, quality, format, isMemeMode, memeIntensity, handlePreviewUpdate]);

  const handleProcess = useCallback(async () => {
    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) return;

    setIsProcessing(true);
    
    // 更新状态为处理中
    setImages(prev => prev.map(img => 
      img.status === 'pending' ? { ...img, status: 'processing' as const } : img
    ));

    try {
      // 准备图片数据
      const imageDataPromises = pendingImages.map(async (img) => {
        return new Promise<{ data: string; name: string; originalSize: number }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ 
            data: reader.result as string, 
            name: img.id,
            originalSize: img.originalSize
          });
          reader.readAsDataURL(img.file);
        });
      });

      const imageDataArray = await Promise.all(imageDataPromises);
      
      // 处理图片，支持实时更新
      const actualQuality = isMemeMode ? (5 + memeIntensity * 5) : quality;
      const results = await processImages(
        imageDataArray, 
        actualQuality, 
        format,
        undefined, // progress callback
        (result) => {
          // 实时更新单个图片结果
          setImages(prev => prev.map(img => {
            if (img.id === result.id) {
              const updatedImg = {
                ...img,
                status: result.success ? 'completed' as const : 'failed' as const,
                processedData: result.data,
                compressedSize: result.size,
                compressionRatio: result.compressionRatio,
                error: result.error
              };
              
              // 如果处理失败，添加错误信息
              if (!result.success && result.error) {
                setErrors(prev => [
                  ...prev.filter(error => !error.id.includes(`process_${result.id}`)),
                  createErrorInfo(
                    `process_${result.id}`,
                    `${img.file.name}: ${result.error}`,
                    'error',
                    {
                      retryable: true,
                      onRetry: () => {
                        // 重试单个图片
                        setImages(prev => prev.map(img => 
                          img.id === result.id ? { ...img, status: 'pending' as const } : img
                        ));
                        setErrors(prev => prev.filter(error => error.id !== `process_${result.id}`));
                      },
                      onDismiss: () => setErrors(prev => prev.filter(error => error.id !== `process_${result.id}`))
                    }
                  )
                ]);
              } else if (result.success) {
                // 处理成功，清除相关错误
                setErrors(prev => prev.filter(error => !error.id.includes(`process_${result.id}`)));
              }
              
              return updatedImg;
            }
            return img;
          }));
        },
        isMemeMode // 添加meme模式参数
      );
    } catch (error) {
      console.error('批量处理失败:', error);
      // 将所有处理中的图片标记为失败
      setImages(prev => prev.map(img => 
        img.status === 'processing' ? { ...img, status: 'failed' as const, error: '处理失败' } : img
      ));
    } finally {
      setIsProcessing(false);
    }
  }, [images, quality, format, processImages]);

  const handleDownloadAll = useCallback(async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.processedData);
    if (completedImages.length === 0) return;

    const zip = new JSZip();
    
    for (const image of completedImages) {
      if (image.processedData) {
        // 将base64转换为blob
        const response = await fetch(image.processedData);
        const blob = await response.blob();
        const fileName = `compressed_${image.file.name.split('.')[0]}.${format}`;
        zip.file(fileName, blob);
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
  }, [images, format]);

  const completedCount = images.filter(img => img.status === 'completed').length;

  // 错误处理函数
  const handleRetryAll = useCallback(() => {
    // 重试所有失败的图片
    setImages(prev => prev.map(img => 
      img.status === 'failed' ? { ...img, status: 'pending' as const, error: undefined } : img
    ));
    // 清除所有处理错误
    setErrors(prev => prev.filter(error => !error.id.includes('process_')));
  }, []);

  const handleDismissAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 计算统计数据
  const statisticsData = React.useMemo(() => {
    return calculateStatistics(images);
  }, [images]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                ImageFlow
              </h1>
              <p className="text-gray-600 dark:text-gray-400 hidden lg:block text-sm md:text-base">
                {t('app.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {/* 主要内容区域 */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6 lg:space-y-8">
            {/* 上传区域 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('upload.title')}
              </h2>
              <DropZone onFilesAdded={handleFilesAdded} />
            </section>

            {/* 错误处理 */}
            {errors.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('errors.title')}
                </h2>
                <ErrorHandler
                  errors={errors}
                  onRetryAll={handleRetryAll}
                  onDismissAll={handleDismissAllErrors}
                />
              </section>
            )}

            {/* 批量处理 */}
            {images.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('batch.title')}
                </h2>
                <BatchProcessor
                  images={images}
                  quality={quality}
                  format={format}
                  onProcess={handleProcess}
                  isProcessing={isProcessing}
                />
              </section>
            )}

            {/* 实时预览 - 移至批量处理后方，更贴近图片列表 */}
            {selectedImageId && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('preview.title')}
                </h2>
                <ImagePreview
                  originalImage={images.find(img => img.id === selectedImageId)?.preview || ''}
                  compressedImage={previewCompressedData || undefined}
                  originalSize={images.find(img => img.id === selectedImageId)?.originalSize || 0}
                  compressedSize={previewCompressedData ? Math.round((previewCompressedData.length * 3) / 4) : undefined}
                  compressionRatio={previewCompressedData && images.find(img => img.id === selectedImageId) ? 
                    (((images.find(img => img.id === selectedImageId)!.originalSize - Math.round((previewCompressedData.length * 3) / 4)) / 
                    images.find(img => img.id === selectedImageId)!.originalSize) * 100).toFixed(2) : undefined}
                  isProcessing={isPreviewProcessing}
                />
              </section>
            )}

            {/* 图片列表 */}
            {images.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('imageList.title')} ({images.length})
                  </h2>
                </div>
                <ImageList 
                  images={images}
                  onRemove={handleRemoveImage}
                  onDownload={handleDownloadImage}
                  onSelect={setSelectedImageId}
                  selectedId={selectedImageId}
                />
              </section>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-4 md:space-y-6">
            {/* 移动端：压缩设置在顶部 */}
            <div className="xl:hidden order-first">
              {/* 压缩设置面板 - 移动端 */}
              <CompressionPanel
                quality={quality}
                format={format}
                isMemeMode={isMemeMode}
                memeIntensity={memeIntensity}
                onQualityChange={setQuality}
                onFormatChange={setFormat}
                onMemeToggle={setIsMemeMode}
                onMemeIntensityChange={setMemeIntensity}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                imageCount={images.filter(img => img.status === 'pending').length}
              />
            </div>
            
            {/* 桌面端：正常侧边栏布局 */}
            <div className="hidden xl:block">
              <CompressionPanel
                quality={quality}
                format={format}
                isMemeMode={isMemeMode}
                memeIntensity={memeIntensity}
                onQualityChange={setQuality}
                onFormatChange={setFormat}
                onMemeToggle={setIsMemeMode}
                onMemeIntensityChange={setMemeIntensity}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                imageCount={images.filter(img => img.status === 'pending').length}
              />
            </div>

            {/* 统计面板 */}
            {images.length > 0 && (
              <div className="hidden md:block">
                <StatisticsPanel data={statisticsData} />
              </div>
            )}


          </div>
        </div>
      </div>

      {/* 页脚广告 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="container mx-auto px-4">

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              {t('footer.privacy')}
            </p>
            <p>
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;