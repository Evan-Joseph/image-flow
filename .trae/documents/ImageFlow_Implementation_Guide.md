# ImageFlow 开发实施指南

## 1. 项目初始化

### 1.1 创建Next.js项目
```bash
npx create-next-app@latest imageflow --typescript --tailwind --eslint --app
cd imageflow
```

### 1.2 安装核心依赖
```bash
npm install @supabase/supabase-js jszip canvas html2canvas
npm install -D @types/jszip
```

### 1.3 环境变量配置
创建 `.env.local` 文件：
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AdSense配置
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_GOOGLE_AD_SLOT_HEADER=YYYYYYYYYY
NEXT_PUBLIC_GOOGLE_AD_SLOT_SIDEBAR=ZZZZZZZZZZ
NEXT_PUBLIC_GOOGLE_AD_SLOT_FOOTER=AAAAAAAAAA

# 功能开关
NEXT_PUBLIC_ENABLE_SERVER_AVIF=true
NEXT_PUBLIC_MAX_FILE_SIZE=209715200
NEXT_PUBLIC_MAX_FILE_COUNT=50
```

## 2. 核心组件实现

### 2.1 主题系统
```typescript
// contexts/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'comfort';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('imageflow-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // 根据系统设置自动选择
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('imageflow-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 2.2 图片处理Worker
```typescript
// workers/imageProcessor.ts
self.onmessage = async function(e) {
  const { imageData, quality, format, id } = e.data;
  
  try {
    // 创建离屏Canvas
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    
    // 创建图片对象
    const img = new Image();
    img.src = imageData;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // 设置Canvas尺寸
    canvas.width = img.width;
    canvas.height = img.height;
    
    // 绘制图片
    ctx?.drawImage(img, 0, 0);
    
    // 根据格式进行压缩
    let mimeType = 'image/jpeg';
    switch (format) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'avif':
        // AVIF需要特殊处理，这里先降级到WebP
        mimeType = 'image/webp';
        break;
    }
    
    // 转换为Blob
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: quality / 100
    });
    
    // 转换为Base64
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage({
        id,
        success: true,
        data: reader.result,
        size: blob.size,
        originalSize: imageData.length
      });
    };
    reader.readAsDataURL(blob);
    
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message
    });
  }
};
```

### 2.3 拖拽上传组件
```typescript
// components/DropZone.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export default function DropZone({ onFilesAdded, maxFiles = 50, maxSize = 200 * 1024 * 1024 }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 验证文件类型
    const validFiles = acceptedFiles.filter(file => {
      return file.type.startsWith('image/');
    });

    if (validFiles.length !== acceptedFiles.length) {
      alert(`已过滤 ${acceptedFiles.length - validFiles.length} 个非图片文件`);
    }

    // 检查文件数量限制
    if (validFiles.length > maxFiles) {
      alert(`文件数量超过限制，最多支持 ${maxFiles} 个文件`);
      return;
    }

    // 检查总文件大小
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxSize) {
      alert(`文件总大小超过限制，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    onFilesAdded(validFiles);
  }, [onFilesAdded, maxFiles, maxSize]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.heic']
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="text-6xl text-gray-400">
          📸
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            拖拽图片到这里，或点击选择文件
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            支持 JPG、PNG、WebP、AVIF、HEIC 格式
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            最多 {maxFiles} 个文件，总大小不超过 {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 2.4 Google AdSense集成
```typescript
// components/GoogleAd.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GoogleAdProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
}

export default function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = { display: 'block' } 
}: GoogleAdProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, []);

  // 开发环境显示占位符
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div 
        className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 rounded-lg p-4 text-center"
        style={style}
      >
        <p className="text-gray-500 text-sm">广告位 (开发环境)</p>
        <p className="text-xs text-gray-400">Slot: {slot}</p>
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive.toString()}
    />
  );
}

// app/layout.tsx 中的AdSense脚本加载
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        
        {/* Google AdSense 脚本 */}
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
```

## 3. Supabase Edge Function实现

### 3.1 AVIF转换函数
```typescript
// supabase/functions/convert-avif/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ConvertRequest {
  imageData: string;
  quality: number;
  format: string;
}

serve(async (req) => {
  // CORS处理
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { imageData, quality, format }: ConvertRequest = await req.json();

    // 验证输入
    if (!imageData || !quality || format !== 'avif') {
      return new Response(
        JSON.stringify({ success: false, error: '无效的请求参数' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 这里应该集成实际的AVIF转换库
    // 由于Deno环境限制，这里使用模拟实现
    const processedData = await simulateAvifConversion(imageData, quality);

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData,
        message: '转换成功'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('AVIF转换错误:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

// 模拟AVIF转换（实际项目中需要集成真实的转换库）
async function simulateAvifConversion(imageData: string, quality: number): Promise<string> {
  // 这里应该使用实际的AVIF编码库
  // 目前返回原始数据作为示例
  await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟处理时间
  return imageData;
}
```

## 4. 部署配置

### 4.1 Vercel部署配置
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_GOOGLE_ADSENSE_ID": "@google-adsense-id"
  }
}
```

### 4.2 ads.txt文件
```txt
# public/ads.txt
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

### 4.3 SEO优化
```typescript
// app/layout.tsx metadata
export const metadata: Metadata = {
  title: 'ImageFlow - 专业的在线图片压缩与格式转换工具',
  description: '免费的在线图片处理工具，支持JPG、PNG、WebP、AVIF格式转换和压缩，保护隐私，无需上传服务器',
  keywords: '图片压缩,格式转换,WebP,AVIF,在线工具,图片优化',
  authors: [{ name: 'ImageFlow Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'ImageFlow - 专业图片处理工具',
    description: '免费在线图片压缩与格式转换，支持最新AVIF格式',
    type: 'website',
    locale: 'zh_CN'
  }
};
```

## 5. 性能优化

### 5.1 代码分割
```typescript
// 动态导入大型组件
const ImageEditor = dynamic(() => import('../components/ImageEditor'), {
  loading: () => <div>加载中...</div>,
  ssr: false
});
```

### 5.2 Web Workers优化
```typescript
// hooks/useImageProcessor.ts
import { useCallback, useRef } from 'react';

export function useImageProcessor() {
  const workerRef = useRef<Worker>();

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker('/workers/imageProcessor.js');
    }
    return workerRef.current;
  }, []);

  const processImage = useCallback((imageData: string, quality: number, format: string) => {
    return new Promise((resolve, reject) => {
      const worker = initWorker();
      const id = Math.random().toString(36).substr(2, 9);

      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          worker.removeEventListener('message', handleMessage);
          if (e.data.success) {
            resolve(e.data);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ imageData, quality, format, id });
    });
  }, [initWorker]);

  return { processImage };
}
```

这个实施指南提供了ImageFlow应用的完整开发框架，包含了所有核心功能的实现方案和Google AdSense集成。开发团队可以基于这个指南进行具体的代码实现。