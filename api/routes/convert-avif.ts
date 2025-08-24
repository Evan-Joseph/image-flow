import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

interface ConvertRequest {
  imageData: string;
  quality: number;
  format: string;
}

interface ConvertResponse {
  success: boolean;
  data?: string;
  size?: number;
  compressionRatio?: string;
  error?: string;
  message?: string;
}

// AVIF转换端点
router.post('/convert-avif', async (req: Request, res: Response) => {
  try {
    const { imageData, quality, format }: ConvertRequest = req.body;

    // 验证输入
    if (!imageData || !quality || format !== 'avif') {
      return res.status(400).json({
        success: false,
        error: '无效的请求参数'
      } as ConvertResponse);
    }

    // 验证质量参数
    if (quality < 0 || quality > 100) {
      return res.status(400).json({
        success: false,
        error: '质量参数必须在0-100之间'
      } as ConvertResponse);
    }

    // 验证图片数据格式
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: '无效的图片数据格式'
      } as ConvertResponse);
    }

    // 检查图片大小限制 (10MB)
    const imageSizeEstimate = (imageData.length * 3) / 4; // Base64解码后的大概大小
    if (imageSizeEstimate > 10 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: '图片过大，服务端处理最大支持10MB'
      } as ConvertResponse);
    }

    // 模拟AVIF转换处理
    // 在实际项目中，这里应该集成真实的AVIF转换库
    const processedData = await simulateAvifConversion(imageData, quality);

    // 计算压缩率
    const originalSize = imageSizeEstimate;
    const compressedSize = (processedData.length * 3) / 4;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    res.json({
      success: true,
      data: processedData,
      size: compressedSize,
      compressionRatio: compressionRatio,
      message: '服务端AVIF转换成功'
    } as ConvertResponse);

  } catch (error) {
    console.error('AVIF转换错误:', error);
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误，请稍后重试'
    } as ConvertResponse);
  }
});

// 模拟AVIF转换（实际项目中需要集成真实的转换库）
async function simulateAvifConversion(imageData: string, quality: number): Promise<string> {
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // 模拟转换过程
  try {
    // 解析base64数据
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 在实际实现中，这里应该使用真实的AVIF编码库
    // 例如: sharp, imagemagick, 或其他支持AVIF的库
    
    // 模拟压缩效果 - 根据质量调整文件大小
    const compressionFactor = (100 - quality) / 100 * 0.5 + 0.3; // 30%-80%的压缩率
    const compressedSize = Math.floor(buffer.length * compressionFactor);
    
    // 创建模拟的压缩数据
    const compressedBuffer = buffer.slice(0, compressedSize);
    
    // 返回base64格式的AVIF数据（这里实际上还是原格式，仅作演示）
    return `data:image/avif;base64,${compressedBuffer.toString('base64')}`;
    
  } catch (error) {
    throw new Error(`AVIF转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 健康检查端点
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AVIF转换服务',
    timestamp: new Date().toISOString()
  });
});

// 获取支持的格式
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    supported: ['avif'],
    input_formats: ['jpeg', 'jpg', 'png', 'webp'],
    max_size: '10MB',
    quality_range: [0, 100]
  });
});

export default router;