# ImageFlow - Zeabur 部署指南

## 项目架构

本项目采用前后端分离架构：
- **前端**: React + Vite + TypeScript
- **后端**: Express + TypeScript
- **部署**: Docker + Zeabur

## 部署到 Zeabur

### 1. 准备工作

确保你的代码已推送到 GitHub 仓库。

### 2. 在 Zeabur 创建项目

1. 访问 [Zeabur](https://zeabur.com) 并使用 GitHub 登录
2. 点击 "创建项目" 按钮
3. 选择部署区域（推荐选择离用户最近的区域）

### 3. 部署服务

1. 在项目页面点击 "添加服务"
2. 选择 "Git Service"
3. 选择你的 GitHub 仓库
4. Zeabur 会自动检测到 Node.js 项目并开始构建

### 4. 环境变量配置

在 Zeabur 控制台的环境变量页面添加以下变量：

```bash
# 必需的环境变量
NODE_ENV=production
VITE_GOOGLE_ADSENSE_ID=your-adsense-id
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 可选的环境变量
VITE_ENABLE_ADS=true
VITE_ENABLE_ANALYTICS=true
```

### 5. 域名配置

1. 在服务页面点击 "Domain" 标签
2. 点击 "Generate Domain" 获取免费子域名
3. 或点击 "Custom Domain" 绑定自定义域名

## 项目特性

### 🚀 自动构建
- 前端自动构建为静态文件
- 后端 TypeScript 自动编译
- 支持 pnpm 包管理器

### 🔧 生产优化
- 使用 Node.js 18 LTS
- 静态文件服务优化
- SPA 路由支持
- API 路由分离

### 📦 Docker 支持
- 多阶段构建优化
- 最小化镜像大小
- 生产环境配置

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（前后端同时启动）
pnpm run dev

# 仅启动前端
pnpm run client:dev

# 仅启动后端
pnpm run server:dev

# 构建项目
pnpm run build
pnpm run server:build

# 生产环境启动
pnpm start
```

## 故障排除

### 构建失败
1. 检查 Node.js 版本是否为 18+
2. 确保所有依赖都在 package.json 中
3. 检查 TypeScript 编译错误

### 运行时错误
1. 检查环境变量是否正确设置
2. 查看 Zeabur 控制台的日志输出
3. 确保端口配置正确（使用 process.env.PORT）

### 静态文件问题
1. 确保前端构建成功
2. 检查静态文件路径配置
3. 验证 SPA 路由配置

## 支持的功能

- ✅ 图片压缩和格式转换
- ✅ 批量处理
- ✅ 实时预览
- ✅ 多语言支持
- ✅ 深色模式
- ✅ Google AdSense 集成
- ✅ 响应式设计
- ✅ PWA 支持

## 性能优化

- 前端资源压缩和缓存
- API 响应优化
- 图片处理在浏览器端进行
- CDN 加速（通过 Zeabur）

---

更多信息请参考 [Zeabur 官方文档](https://zeabur.com/docs)