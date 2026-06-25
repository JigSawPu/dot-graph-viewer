import { useCallback, useEffect, useMemo, useState } from 'react';
import { cloneDocument } from '../lib/document';
import { loadDocument, saveDocument } from '../lib/storage';
import type { GraphDocument } from '../types';

interface HistoryState {
  past: GraphDocument[];
  present: GraphDocument;
  future: GraphDocument[];
}

export function useDocumentHistory() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: loadDocument(),
    future: []
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => saveDocument(history.present), 120);
    return () => window.clearTimeout(timer);
  }, [history.present]);

  const commit = useCallback((next: GraphDocument | ((current: GraphDocument) => GraphDocument)) => {
    setHistory(current => {
      const resolved = typeof next === 'function' ? next(cloneDocument(current.present)) : cloneDocument(next);
      return {
        past: [...current.past.slice(-59), cloneDocument(current.present)],
        present: resolved,
        future: []
      };
    });
  }, []);

  const replace = useCallback((next: GraphDocument) => {
    setHistory({ past: [], present: cloneDocument(next), future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory(current => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return {
        past: current.past.slice(0, -1),
        present: cloneDocument(previous),
        future: [cloneDocument(current.present), ...current.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(current => {
      const next = current.future[0];
      if (!next) return current;
      return {
        past: [...current.past, cloneDocument(current.present)],
        present: cloneDocument(next),
        future: current.future.slice(1)
      };
    });
  }, []);

  return useMemo(() => ({
    document: history.present,
    commit,
    replace,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  }), [commit, history.future.length, history.past.length, history.present, redo, replace, undo]);
}
