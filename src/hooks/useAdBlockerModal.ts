import { useState, useEffect } from 'react';

const ADBLOCKER_MODAL_KEY = 'imageflow_adblocker_modal_shown';

export const useAdBlockerModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 检查是否已经显示过弹窗
    const hasShown = localStorage.getItem(ADBLOCKER_MODAL_KEY);
    
    if (!hasShown) {
      // 延迟 1 秒显示弹窗，让页面先加载完成
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    // 记录已经显示过弹窗
    localStorage.setItem(ADBLOCKER_MODAL_KEY, 'true');
  };

  const resetModal = () => {
    // 重置弹窗状态（用于测试）
    localStorage.removeItem(ADBLOCKER_MODAL_KEY);
    setIsModalOpen(true);
  };

  return {
    isModalOpen,
    closeModal,
    resetModal
  };
};