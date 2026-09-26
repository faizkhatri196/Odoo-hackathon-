export const APP_NAME = 'StockSense';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const DOCUMENT_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  waiting: { label: 'Waiting', color: 'amber' },
  ready: { label: 'Ready', color: 'blue' },
  done: { label: 'Done', color: 'emerald' },
  canceled: { label: 'Canceled', color: 'rose' },
};
