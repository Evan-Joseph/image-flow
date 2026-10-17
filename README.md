# 🖼️ ImageFlow

<p align="center">
  <b>A Browser-First, Privacy-Focused Image Compression & Conversion Suite</b><br>
  纯客户端本地处理 · 零上传隐私保护 · 支持 WebP / AVIF 现代格式与批量生产流
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Format-WebP%20%7C%20AVIF%20%7C%20PNG%20%7C%20JPEG-blue" alt="Formats">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen" alt="100% Client-Side">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT">
</p>

---

## 📖 项目简介 (Overview)

**ImageFlow** 是一个现代化的轻量级图片批量压缩与格式转换工具。

与传统的云端图片处理服务不同，ImageFlow 默认将**全部压缩、重采样与转码计算置于浏览器本地沙箱内完成**（借助 HTML5 Canvas 与现代浏览器编码 API）。原始图像绝不上传至任何远端服务器，从物理层面上保障了敏感文档、研发资产与个人照片的绝对隐私。

同时，工程内置了可选的轻量级 Node/Express 后端接口与 Docker 镜像，满足需要私有化集群部署或跨域中转的工程需求。

---

## 🌟 核心特性 (Key Features)

- **🔒 纯端侧计算与零外传隐私**：所有图像计算均在用户设备内存中执行，无网络上传等待，无数据泄露风险。
- **⚡ 现代高效编码支持**：原生支持将臃肿的 PNG / JPEG 无损或有损转换为新一代 WebP 与 AVIF 格式，平均节省 60%~85% 传输带宽。
- **📦 批量流水线作业**：支持多张图片同时拖拽导入、全局/单张参数独立调节、一键打包为 ZIP 批量导出。
- **👀 实时画质比对预览**：提供双视图画质与体积比对滑块，直观掌控压缩率与细节保真度之间的平衡。
- **🎨 多套主题与国际化**：内置浅色、深色以及低对比度护眼主题，完整覆盖中英双语界面。

---

## 📊 常见格式压缩对比 (Compression Benchmarks)

| 原始格式 | 目标格式 | 压缩质量 (Quality) | 平均体积降幅 (Size Reduction) | 适用场景 |
|---|---|:---:|:---:|---|
| PNG (截屏/图表) | **WebP** | 80% | **-72%** | Web 前端静态资源加速 |
| JPEG (高清摄影) | **AVIF** | 75% | **-81%** | 移动端高保真画报展示 |
| JPEG / PNG | **JPEG** | 70% | **-54%** | 通用传统客户端兼容 |

---

## 🛠️ 技术栈 (Tech Stack)

- **核心前端**：React 18, TypeScript, Vite, Tailwind CSS
- **图像引擎**：HTML5 Canvas 2D Context, OffscreenCanvas, Browser Native Image Codecs
- **国际化与状态**：React Context API, 本地化词表
- **可选服务端**：Express 4, Multer, Dockerfile

---

## 📦 项目结构 (Directory Structure)

```text
image-flow/
├── src/
│   ├── components/      # 上传拖拽区、压缩参数控制板、比对预览器、统计卡片
│   ├── contexts/        # 主题上下文与设置持久化
│   ├── hooks/           # useImageCompressor, useTheme 核心 Hook
│   ├── i18n/            # 中英文国际化词典
│   └── utils/           # 字节换算、Canvas 渲染与 ZIP 打包工具
├── api/                 # 可选的 Express 后端 API 服务
└── public/              # 静态资源与网站元数据
```

---

## 🚀 快速开始 (Quickstart)

### 1. 安装与本地启动

```bash
git clone https://github.com/Evan-Joseph/image-flow.git
cd image-flow
pnpm install
pnpm run dev
```

在浏览器打开 `http://localhost:5173` 即可立即体验高速离线压缩。

### 2. 生产构建

```bash
pnpm run build
```

构建产物位于 `dist/` 目录，可直接托管于任何静态托管服务（Cloudflare Pages, Vercel, GitHub Pages, Nginx 等）。

### 3. Docker 私有化部署（可选）

```bash
docker build -t image-flow:latest .
docker run -d -p 3000:3000 image-flow:latest
```

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源。
