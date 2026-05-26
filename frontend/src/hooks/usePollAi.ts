import { useEffect, useRef, useState, useCallback } from 'react';
import { pollAiInsights } from '../api/client';
import type { AiInsight } from '../types/api';

type PollStatus = 'idle' | 'polling' | 'done' | 'error';

interface UsePollAiResult {
  insights: AiInsight[] | null;
  status: PollStatus;
  error: string | null;
  start: (id: string) => void;
  reset: () => void;
}

const POLL_INTERVAL = 2000;

export function usePollAi(): UsePollAiResult {
  const [insights, setInsights] = useState<AiInsight[] | null>(null);
  const [status, setStatus] = useState<PollStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const solveIdRef = useRef<string | null>(null);
  const activePollId = useRef(0);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setInsights(null);
    setStatus('idle');
    setError(null);
    solveIdRef.current = null;
  }, [cleanup]);

  const start = useCallback(
    (id: string) => {
      cleanup();
      setInsights(null);
      setError(null);
      setStatus('polling');
      solveIdRef.current = id;

      const pollId = ++activePollId.current;

      const poll = async () => {
        const currentId = solveIdRef.current;
        if (!currentId) return;

        try {
          const data = await pollAiInsights(currentId);
          if (pollId !== activePollId.current) return;
          if (!solveIdRef.current) return;

          if (data.status === 'done') {
            setInsights(data.insights);
            cleanup();
            setStatus('done');
          }
        } catch (err) {
          if (pollId !== activePollId.current) return;
          setError(err instanceof Error ? err.message : 'Polling failed');
          cleanup();
          setStatus('error');
        }
      };

      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL);
    },
    [cleanup],
  );

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { insights, status, error, start, reset };
}
