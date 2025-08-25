import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import convertAvifRoutes from './routes/convert-avif.js';

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // 生产环境域名
    : ['http://localhost:5173', 'http://localhost:3000'], // 开发环境
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // 特别记录 /workers/ 路径的请求
  if (req.path.startsWith('/workers/')) {
    console.log(`[WORKER REQUEST] ${req.method} ${req.path} - User-Agent: ${req.get('User-Agent')}`);
    console.log(`[WORKER REQUEST] Headers:`, req.headers);
  }
  
  next();
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api', convertAvifRoutes);

// Analytics API 路由
app.post('/api/analytics/web-vitals', (req, res) => {
  // 接收 web-vitals 数据
  const { name, value, id, delta } = req.body;
  
  // 在生产环境中，这里可以将数据发送到分析服务
  console.log('Web Vitals:', { name, value, id, delta });
  
  res.json({ success: true, message: 'Web vitals data received' });
});

// 测试路由 - 直接返回 imageProcessor.js 文件内容
app.get('/test/worker', (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // 修复路径：与静态文件服务保持一致
  const workerPath = path.join(__dirname, '..', 'workers', 'imageProcessor.js');
  
  console.log(`[TEST WORKER] Attempting to read file: ${workerPath}`);
  
  try {
    if (fs.existsSync(workerPath)) {
      const content = fs.readFileSync(workerPath, 'utf8');
      console.log(`[TEST WORKER] File exists, size: ${content.length} bytes`);
      console.log(`[TEST WORKER] First 100 chars: ${content.substring(0, 100)}`);
      
      res.setHeader('Content-Type', 'application/javascript');
      res.send(content);
    } else {
      console.log(`[TEST WORKER] File does not exist at: ${workerPath}`);
      res.status(404).json({ error: 'Worker file not found', path: workerPath });
    }
  } catch (error) {
    console.error(`[TEST WORKER] Error reading file:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to read worker file', details: errorMessage });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      auth: 'available',
      avif_conversion: 'available'
    }
  });
});

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // 修复路径：编译后的文件在 dist/api/app.js，所以静态文件在 dist/ 目录
  const staticPath = path.join(__dirname, '..');
  
  console.log(`[STATIC FILES] Static path: ${staticPath}`);
  console.log(`[STATIC FILES] __dirname: ${__dirname}`);
  console.log(`[STATIC FILES] __filename: ${__filename}`);
  
  // 验证静态文件目录是否存在
  if (fs.existsSync(staticPath)) {
    console.log(`[STATIC FILES] Static directory exists`);
    const workerPath = path.join(staticPath, 'workers', 'imageProcessor.js');
    if (fs.existsSync(workerPath)) {
      console.log(`[STATIC FILES] Worker file exists at: ${workerPath}`);
    } else {
      console.log(`[STATIC FILES] Worker file NOT found at: ${workerPath}`);
    }
  } else {
    console.log(`[STATIC FILES] Static directory NOT found: ${staticPath}`);
  }
  
  // 静态文件服务，设置正确的MIME类型
  app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
      console.log(`[STATIC FILES] Serving file: ${filePath}`);
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  
  // SPA 路由处理 - 只有HTML页面路由才返回index.html
  app.get('*', (req, res) => {
    // 排除API路由
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        error: 'API端点不存在',
        path: req.originalUrl,
        method: req.method
      });
    }
    
    // 只有HTML页面路由才返回index.html（不是静态资源）
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    const hasStaticExtension = staticExtensions.some(ext => req.path.endsWith(ext));
    
    if (!hasStaticExtension) {
      // 只有非静态文件的路由才返回 index.html
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      // 静态文件如果到这里说明没找到，返回404
      res.status(404).send('File not found');
    }
  });
} else {
  // 开发环境的404处理
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'API端点不存在',
      path: req.originalUrl,
      method: req.method
    });
  });
}

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

export default app;