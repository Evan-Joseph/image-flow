import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const staticPath = path.join(__dirname, '../../dist');
  
  app.use(express.static(staticPath));
}

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

// SPA 路由处理 - 所有非API路由都返回index.html（仅生产环境）
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const staticPath = path.join(__dirname, '../../dist');
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      res.status(404).json({
        error: 'API端点不存在',
        path: req.originalUrl,
        method: req.method
      });
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