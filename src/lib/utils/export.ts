/**
 * Export utilities for CSV and PNG downloads across all dashboards.
 */
import { toPng } from 'html-to-image';
import Papa from 'papaparse';

/**
 * Download data as CSV file.
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a DOM element as PNG image.
 */
export async function downloadPNG(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: '#0B0F19',
    pixelRatio: 2,
    // Exclude any elements with class 'export-exclude'
    filter: (node) => {
      if (node instanceof HTMLElement && node.classList?.contains('export-exclude')) {
        return false;
      }
      return true;
    },
  });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.png`;
  link.click();
}

/**
 * Download a correlation matrix as CSV.
 */
export function downloadMatrixCSV(
  tickers: string[],
  matrix: number[][],
  filename: string,
): void {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < tickers.length; i++) {
    const row: Record<string, unknown> = { '': tickers[i] };
    for (let j = 0; j < tickers.length; j++) {
      row[tickers[j]] = matrix[i]?.[j] ?? '';
    }
    rows.push(row);
  }
  downloadCSV(rows, filename);
}
