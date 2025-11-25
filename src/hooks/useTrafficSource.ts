import { useEffect, useState } from 'react';
import {
  TrafficSourceData,
  getTrafficSource,
  initializeTrafficTracking,
  isPpcTraffic,
  isOrganicTraffic,
  incrementPropertyViewCount,
  getPropertyViewCount,
} from '@/utils/trafficSource';

/**
 * Hook for accessing traffic source data
 */
export function useTrafficSource() {
  const [trafficSource, setTrafficSource] = useState<TrafficSourceData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize traffic tracking on first load
    initializeTrafficTracking();

    // Get the traffic source data
    const data = getTrafficSource();
    setTrafficSource(data);
    setIsLoaded(true);
  }, []);

  return {
    trafficSource,
    isLoaded,
    isPpc: trafficSource?.trafficType === 'ppc',
    isOrganic: trafficSource?.trafficType === 'organic',
    isDirect: trafficSource?.trafficType === 'direct',
  };
}

/**
 * Hook for tracking property views and determining if registration should be shown
 */
export function usePropertyViewTracking() {
  const [viewCount, setViewCount] = useState(0);
  const [shouldShowRegistration, setShouldShowRegistration] = useState(false);
  const { isPpc, isOrganic, isLoaded } = useTrafficSource();

  useEffect(() => {
    if (!isLoaded) return;

    const currentCount = getPropertyViewCount();
    setViewCount(currentCount);

    // For PPC traffic, show registration on first property view
    // For organic traffic, show optional registration on first property view
    if (currentCount === 0 && (isPpc || isOrganic)) {
      setShouldShowRegistration(true);
    }
  }, [isLoaded, isPpc, isOrganic]);

  const trackPropertyView = () => {
    const newCount = incrementPropertyViewCount();
    setViewCount(newCount);

    // Show registration on first view
    if (newCount === 1 && (isPpc || isOrganic)) {
      setShouldShowRegistration(true);
    }
  };

  const dismissRegistration = () => {
    setShouldShowRegistration(false);
  };

  return {
    viewCount,
    shouldShowRegistration,
    trackPropertyView,
    dismissRegistration,
    isPpc,
    isOrganic,
    isRequiredRegistration: isPpc, // PPC requires registration, organic is optional
  };
}
