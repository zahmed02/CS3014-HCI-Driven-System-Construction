import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useUndo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T, record = true) => {
    if (record) {
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    } else {
      setHistory([newState]);
      setCurrentIndex(0);
    }
  }, [history, currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(i => i - 1);
      toast.info('Undo successful');
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(i => i + 1);
      toast.info('Redo successful');
    }
  }, [canRedo]);

  return { state, setState, undo, redo, canUndo, canRedo };
}