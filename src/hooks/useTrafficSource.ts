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
  const [ppcThreshold, setPpcThreshold] = useState(1); // Default: show on 1st view for PPC
  const [organicThreshold, setOrganicThreshold] = useState(4); // Default: show on 4th view for organic
  const { isPpc, isOrganic, isLoaded } = useTrafficSource();

  // Fetch registration settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Note: These endpoints are public, no auth required for reading settings
        const [ppcResponse, organicResponse] = await Promise.all([
          fetch('/api/admin/settings/ppc/registration').then(r => r.ok ? r.json() : null),
          fetch('/api/admin/settings/organic/registration').then(r => r.ok ? r.json() : null)
        ]);

        if (ppcResponse?.viewThreshold !== undefined) {
          setPpcThreshold(ppcResponse.viewThreshold);
        }
        if (organicResponse?.viewThreshold !== undefined) {
          setOrganicThreshold(organicResponse.viewThreshold);
        }
      } catch (error) {
        console.error('Failed to fetch registration settings:', error);
        // Keep default values on error
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const currentCount = getPropertyViewCount();
    setViewCount(currentCount);

    // Don't show modal on initial load (currentCount = 0)
    // Modal will be shown after trackPropertyView is called
  }, [isLoaded, isPpc, isOrganic]);

  const trackPropertyView = () => {
    const newCount = incrementPropertyViewCount();
    setViewCount(newCount);

    // Show registration based on traffic type and threshold
    if (isPpc && newCount === ppcThreshold) {
      setShouldShowRegistration(true);
    } else if (isOrganic && newCount === organicThreshold) {
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
    ppcThreshold,
    organicThreshold,
  };
}
