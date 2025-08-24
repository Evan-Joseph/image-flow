'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export default function DropZone({ onFilesAdded, maxFiles = 50, maxSize = 200 * 1024 * 1024 }: DropZoneProps) {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 验证文件类型
    const validFiles = acceptedFiles.filter(file => {
      return file.type.startsWith('image/');
    });

    if (validFiles.length !== acceptedFiles.length) {
      alert(t('messages.filteredNonImageFiles', { count: acceptedFiles.length - validFiles.length }));
    }

    // 检查文件数量限制
    if (validFiles.length > maxFiles) {
      alert(t('messages.fileCountExceeded', { maxFiles }));
      return;
    }

    // 检查总文件大小
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxSize) {
      alert(t('messages.totalSizeExceeded', { maxSize: Math.round(maxSize / 1024 / 1024) }));
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
        border-2 border-dashed rounded-lg p-4 md:p-6 lg:p-8 text-center cursor-pointer transition-all duration-200
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-3 md:space-y-4">
        <div className="flex justify-center">
          {isDragActive ? (
            <Upload className="w-12 h-12 md:w-16 md:h-16 text-blue-500" />
          ) : (
            <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-base md:text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('upload.dropzone')}
          </p>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 md:mt-2">
            {t('upload.subtitle')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('upload.limit', { maxFiles, maxSize: Math.round(maxSize / 1024 / 1024) })}
          </p>
        </div>
      </div>
    </div>
  );
}