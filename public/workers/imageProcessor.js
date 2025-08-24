// 图片处理Worker - 增强版
self.onmessage = async function(e) {
  const { imageData, quality, format, id, originalSize, isMemeMode } = e.data;
  
  try {
    // 创建离屏Canvas
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    // 在Worker环境中使用createImageBitmap替代Image构造函数
    // 首先将base64转换为blob
    const response = await fetch(imageData);
    const imageBlob = await response.blob();
    
    // 使用createImageBitmap创建图片
    const img = await createImageBitmap(imageBlob);
    
    // 设置Canvas尺寸
    let targetWidth = img.width;
    let targetHeight = img.height;
    
    // Meme模式：极端压缩处理
    if (isMemeMode) {
      // 1. 大幅缩小尺寸（像素化效果）
      const scaleFactor = Math.max(0.1, Math.min(0.3, 200 / Math.max(img.width, img.height)));
      targetWidth = Math.max(32, Math.floor(img.width * scaleFactor));
      targetHeight = Math.max(32, Math.floor(img.height * scaleFactor));
      
      // 2. 设置低分辨率canvas
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // 3. 关闭抗锯齿，增强像素化效果
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'low';
      
      // 4. 绘制缩小的图片
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // 5. 添加噪点效果（可选）
      const imageDataObj = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageDataObj.data;
      
      // 添加轻微的颜色量化和噪点
      for (let i = 0; i < data.length; i += 4) {
        // 颜色量化（减少颜色深度）
        data[i] = Math.floor(data[i] / 32) * 32;     // Red
        data[i + 1] = Math.floor(data[i + 1] / 32) * 32; // Green
        data[i + 2] = Math.floor(data[i + 2] / 32) * 32; // Blue
        
        // 添加轻微噪点
        if (Math.random() < 0.1) {
          const noise = (Math.random() - 0.5) * 40;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
      }
      
      ctx.putImageData(imageDataObj, 0, 0);
      
    } else {
      // 正常模式：保持原始尺寸
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // 高质量绘制
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);
    }
    
    // 根据格式进行压缩
    let mimeType = 'image/jpeg';
    let actualFormat = format;
    
    switch (format) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        // 检查浏览器是否支持WebP
        if (canvas.convertToBlob && await checkWebPSupport()) {
          mimeType = 'image/webp';
        } else {
          mimeType = 'image/jpeg';
          actualFormat = 'jpeg';
        }
        break;
      case 'avif':
        // 尝试AVIF，不支持则降级到WebP
        if (await checkAVIFSupport()) {
          mimeType = 'image/avif';
        } else if (await checkWebPSupport()) {
          mimeType = 'image/webp';
          actualFormat = 'webp';
        } else {
          mimeType = 'image/jpeg';
          actualFormat = 'jpeg';
        }
        break;
    }
    
    // 转换为Blob
    const blobOptions = { type: mimeType };
    if (mimeType !== 'image/png') {
      // Meme模式强制使用极低质量
      blobOptions.quality = isMemeMode ? Math.min(0.15, quality / 100) : quality / 100;
    }
    
    const resultBlob = await canvas.convertToBlob(blobOptions);
    
    // 计算压缩率
    const compressionRatio = originalSize > 0 
      ? ((originalSize - resultBlob.size) / originalSize * 100).toFixed(2)
      : '0.00';
    
    // 转换为Base64
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage({
        id,
        success: true,
        data: reader.result,
        size: resultBlob.size,
        originalSize: originalSize,
        format: actualFormat,
        compressionRatio: compressionRatio,
        message: actualFormat !== format ? `已降级到${actualFormat.toUpperCase()}格式` : undefined
      });
    };
    reader.onerror = () => {
      self.postMessage({
        id,
        success: false,
        error: '文件读取失败'
      });
    };
    reader.readAsDataURL(resultBlob);
    
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message || '图片处理失败'
    });
  }
};

// 检查WebP支持
async function checkWebPSupport() {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const blob = await canvas.convertToBlob({ type: 'image/webp' });
    return blob.type === 'image/webp';
  } catch {
    return false;
  }
}

// 检查AVIF支持
async function checkAVIFSupport() {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const blob = await canvas.convertToBlob({ type: 'image/avif' });
    return blob.type === 'image/avif';
  } catch {
    return false;
  }
}