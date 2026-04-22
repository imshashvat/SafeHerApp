import { useState, useEffect } from 'react';
import { crimeDataService } from '../services/crimeDataService';

/**
 * Hook that ensures crimeDataService is loaded before screens try to read data.
 * Returns { loaded: boolean } — screens should show a loading state until loaded=true.
 */
export function useCrimeData() {
  const [loaded, setLoaded] = useState(crimeDataService.loaded);

  useEffect(() => {
    if (crimeDataService.loaded) {
      setLoaded(true);
      return;
    }
    // If not loaded yet, load and then trigger a re-render
    const success = crimeDataService.load();
    setLoaded(success);
  }, []);

  return { loaded };
}
