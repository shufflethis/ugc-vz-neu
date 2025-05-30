'use client';

import { useState, useEffect } from 'react';

// Helper function to detect iOS devices with comprehensive detection
const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;

  // Multiple detection methods for iOS
  const userAgent = navigator.userAgent;
  const isIOSUserAgent = /iPad|iPhone|iPod/.test(userAgent);
  const isSafariOnMac = navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Mac');
  const isTouchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;

  // iOS 13+ detection (iPad can report as Mac)
  const isIPadOS = navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1;

  const result = isIOSUserAgent || isIPadOS;

  return result;
};

// Helper function to detect mobile devices
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const useDeviceDetection = () => {
  const [isIOSDeviceState, setIsIOSDeviceState] = useState(false);
  const [isMobileDeviceState, setIsMobileDeviceState] = useState(false);

  useEffect(() => {
    const isIOS = isIOSDevice();
    const isMobile = isMobileDevice();

    setIsIOSDeviceState(isIOS);
    setIsMobileDeviceState(isMobile);
  }, []);

  return {
    isIOSDeviceState,
    isMobileDeviceState
  };
};
