import { createEmptyDocument } from './document';
import { STORAGE_KEY } from './constants';
import type { GraphDocument } from '../types';

export function loadDocument(): GraphDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyDocument();
    const parsed = JSON.parse(raw) as GraphDocument;
    if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return createEmptyDocument();
    return parsed;
  } catch {
    return createEmptyDocument();
  }
}

export function saveDocument(document: GraphDocument): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}
