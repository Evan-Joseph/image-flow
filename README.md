# ImageFlow

Browser-first image compression and conversion tool for WebP, AVIF, and batch image workflows.

ImageFlow focuses on fast local processing: common image optimization runs in the browser, with a lightweight Node/Express API reserved for optional server-side features. The project is a Vite + React + TypeScript application with batch processing, preview, theme switching, i18n, and deployment assets.

## Features

- Drag-and-drop upload for single or batch image workflows.
- Compression quality controls with preview-oriented UI.
- Format conversion workflow for JPG, PNG, WebP, and AVIF-oriented use cases.
- Batch download flow for processed images.
- Light, dark, and eye-care theme support.
- English and Chinese UI copy through the local i18n layer.
- Optional API server for deployment scenarios that need backend support.

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS
- Express server for optional API routes
- Dockerfile and deployment config

## Quick Start

```bash
pnpm install
pnpm run dev
```

Common commands:

```bash
pnpm run build
pnpm run check
pnpm run lint
pnpm run server:dev
```

## Environment

Copy `.env.example` to `.env` when backend or hosted integrations are needed:

```bash
cp .env.example .env
```

Keep real service keys in local or deployment environment variables. Do not commit `.env` files.

## Project Structure

```text
src/
  components/      UI components for upload, processing, preview, ads, and stats
  contexts/        Theme state
  hooks/           Image processing and theme hooks
  i18n/            Localized copy
  pages/           Main app pages
  utils/           Analytics and performance helpers
api/               Optional Express API server
public/            Static assets, sitemap, robots, and metadata
```

## Notes

This repository is kept as a compact application prototype. Large source image sets and private deployment credentials should stay outside Git and be supplied through local files or platform environment variables.
