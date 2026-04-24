import { useCallback, useState } from 'react';

export interface ApiTestResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

const API_BASE = 'http://localhost:3000/api';

export const useApiTester = () => {
  const [results, setResults] = useState<Record<string, ApiTestResult>>({});
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (name: string, endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();

      setResults((prev) => ({
        ...prev,
        [name]: {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: !response.ok ? data.error || response.statusText : undefined,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, run };
};
