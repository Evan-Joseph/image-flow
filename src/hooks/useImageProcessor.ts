import React, { useCallback, useRef } from 'react';

interface ProcessImageResult {
  id: string;
  success: boolean;
  data?: string;
  size?: number;
  originalSize?: number;
  format?: string;
  compressionRatio?: string;
  error?: string;
  message?: string;
}

interface ProcessImageInput {
  data: string;
  name: string;
  originalSize: number;
}

export function useImageProcessor() {
  const workerRef = useRef<Worker>();

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      // 添加时间戳参数破坏缓存，确保每次都加载最新的 Worker 文件
      const timestamp = Date.now();
      console.log('[DEBUG] Creating Worker with timestamp:', timestamp);
      
      try {
        workerRef.current = new Worker(`/workers/imageProcessor.js?v=${timestamp}`);
        console.log('[DEBUG] Worker created successfully');
        
        // 监听 Worker 消息
        workerRef.current.addEventListener('message', (e) => {
          if (e.data.type === 'init') {
            if (e.data.success) {
              console.log('[DEBUG] Worker initialization successful:', e.data.message);
            } else {
              console.error('[DEBUG] Worker initialization failed:', e.data.error);
            }
          } else if (e.data.type === 'test') {
            console.log('[DEBUG] Worker test response received:', e.data);
          }
        });
        
        // 监听 Worker 错误
        workerRef.current.addEventListener('error', (error) => {
          console.error('[DEBUG] Worker error event:', error);
        });
        
      } catch (error) {
        console.error('[DEBUG] Failed to create Worker:', error);
        throw error;
      }
    }
    return workerRef.current;
  }, []);

  // 在 hook 初始化时就创建 Worker
  React.useEffect(() => {
    console.log('[DEBUG] useImageProcessor hook initialized, creating Worker...');
    
    try {
      initWorker();
    } catch (error) {
      console.error('[DEBUG] Failed to initialize Worker:', error);
    }
    
    return () => {
      if (workerRef.current) {
        console.log('[DEBUG] Cleaning up Worker');
        workerRef.current.terminate();
        workerRef.current = undefined;
      }
    };
  }, [initWorker]);

  // 添加 Worker 测试函数
  const testWorker = useCallback(() => {
    console.log('[DEBUG] Testing Worker...');
    
    try {
      const worker = initWorker();
      
      // 发送测试消息
      worker.postMessage({
        test: true,
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        quality: 80,
        format: 'jpeg',
        id: 'test-' + Date.now(),
        originalSize: 100,
        isMemeMode: false
      });
      
      console.log('[DEBUG] Test message sent to Worker');
    } catch (error) {
      console.error('[DEBUG] Failed to test Worker:', error);
    }
  }, [initWorker]);

  // AVIF服务端处理函数
  const processAVIFOnServer = useCallback(async (imageData: string, quality: number): Promise<ProcessImageResult> => {
    // 检查是否启用服务端AVIF处理
    const serverAvifEnabled = import.meta.env.VITE_ENABLE_SERVER_AVIF === 'true';
    if (!serverAvifEnabled) {
      throw new Error('服务端AVIF处理已禁用');
    }

    try {
      // 设置较短的超时时间，快速失败
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch('/api/convert-avif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          quality,
          format: 'avif'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('图片过大，服务端不支持处理');
        }
        throw new Error(`服务器错误: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          id: '',
          success: true,
          data: result.data,
          size: result.size || 0,
          format: 'avif',
          compressionRatio: result.compressionRatio || '0.00',
          message: result.message
        };
      } else {
        throw new Error(result.error || '服务端转换失败');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('服务端处理超时');
        }
        throw new Error(`AVIF服务端处理失败: ${error.message}`);
      }
      throw new Error('AVIF服务端处理失败: 未知错误');
    }
  }, []);

  const processImage = useCallback(async (imageData: string, quality: number, format: string, originalSize: number, isMemeMode: boolean = false): Promise<ProcessImageResult> => {
    // AVIF格式优先尝试服务端处理
    if (format === 'avif') {
      try {
        const serverResult = await processAVIFOnServer(imageData, quality);
        return {
          ...serverResult,
          originalSize,
          message: '服务端AVIF转换成功'
        };
      } catch (serverError) {
        console.warn('服务端AVIF处理失败，降级到客户端处理:', serverError);
        // 继续使用客户端处理
      }
    }

    // 客户端处理（包括AVIF降级处理）
    return new Promise((resolve, reject) => {
      const worker = initWorker();
      const id = Math.random().toString(36).substr(2, 9);
      let timeoutId: NodeJS.Timeout;

      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          worker.removeEventListener('message', handleMessage);
          clearTimeout(timeoutId);
          if (e.data.success) {
            const result = {
              ...e.data,
              originalSize
            };
            // 如果是AVIF降级处理，添加提示信息
            if (format === 'avif' && e.data.format !== 'avif') {
              result.message = `AVIF格式不支持，已降级到${e.data.format.toUpperCase()}格式`;
            }
            resolve(result);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        clearTimeout(timeoutId);
        reject(new Error(`Worker错误: ${error.message}`));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);
      worker.postMessage({ imageData, quality, format, id, originalSize, isMemeMode });

      // 设置超时处理
      timeoutId = setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error('图片处理超时'));
      }, 30000); // 30秒超时
    });
  }, [initWorker, processAVIFOnServer]);

  const processImages = useCallback(async (
    images: ProcessImageInput[], 
    quality: number, 
    format: string,
    onProgress?: (progress: number) => void,
    onItemComplete?: (result: ProcessImageResult) => void,
    isMemeMode: boolean = false
  ): Promise<ProcessImageResult[]> => {
    const results: ProcessImageResult[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await processImage(images[i].data, quality, format, images[i].originalSize, isMemeMode);
        const finalResult = { ...result, id: images[i].name };
        results.push(finalResult);
        
        if (onItemComplete) {
          onItemComplete(finalResult);
        }
      } catch (error) {
        const errorResult = {
          id: images[i].name,
          success: false,
          error: error instanceof Error ? error.message : '处理失败',
          originalSize: images[i].originalSize
        };
        results.push(errorResult);
        
        if (onItemComplete) {
          onItemComplete(errorResult);
        }
      }
      
      if (onProgress) {
        onProgress(((i + 1) / images.length) * 100);
      }
    }
    
    return results;
  }, [processImage]);



  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = undefined;
    }
  }, []);

  return { processImage, processImages, processAVIFOnServer, cleanup, testWorker };
}