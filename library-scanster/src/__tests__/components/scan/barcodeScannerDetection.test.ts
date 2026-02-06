import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for barcode scanner detection logic used in HardwareScannerTab.
 *
 * Hardware barcode scanners typically:
 * 1. Type characters very rapidly (< 50ms between keystrokes)
 * 2. End input with Enter key
 * 3. Input consists of digits (and sometimes X for ISBN-10 check digit)
 *
 * The detection algorithm accumulates characters typed within a time threshold
 * and treats rapid input ending with Enter as scanner input.
 */

// Simulates the barcode scanner detection logic from HardwareScannerTab
interface ScannerDetector {
  buffer: string;
  lastKeyTime: number;
  timeThreshold: number;
  handleKeyDown: (key: string, timestamp: number) => { isBarcode: boolean; isbn: string | null };
  reset: () => void;
}

function createScannerDetector(timeThreshold = 150): ScannerDetector {
  let buffer = '';
  let lastKeyTime = 0;

  return {
    get buffer() { return buffer; },
    get lastKeyTime() { return lastKeyTime; },
    timeThreshold,

    handleKeyDown(key: string, timestamp: number) {
      // Reset buffer if too much time passed
      if (timestamp - lastKeyTime > timeThreshold) {
        buffer = '';
      }
      lastKeyTime = timestamp;

      // Accumulate barcode characters
      if (key.length === 1 && /[\d\-Xx]/.test(key)) {
        buffer += key;
      }

      // On Enter with valid barcode-length buffer, treat as scanner input
      if (key === 'Enter' && buffer.length >= 10) {
        const scannedIsbn = buffer.replace(/[-\s]/g, '');
        buffer = '';
        return { isBarcode: true, isbn: scannedIsbn };
      }

      return { isBarcode: false, isbn: null };
    },

    reset() {
      buffer = '';
      lastKeyTime = 0;
    },
  };
}

describe('Barcode Scanner Detection', () => {
  let detector: ScannerDetector;

  beforeEach(() => {
    detector = createScannerDetector(150);
  });

  describe('rapid input detection', () => {
    it('detects ISBN-13 scanned rapidly', () => {
      const isbn = '9780451524935';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      // Simulate rapid typing (30ms between keystrokes)
      for (const char of isbn) {
        result = detector.handleKeyDown(char, time);
        time += 30;
      }

      // Press Enter
      result = detector.handleKeyDown('Enter', time);

      expect(result.isBarcode).toBe(true);
      expect(result.isbn).toBe(isbn);
    });

    it('detects ISBN-10 scanned rapidly', () => {
      const isbn = '0451524934';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      for (const char of isbn) {
        result = detector.handleKeyDown(char, time);
        time += 30;
      }

      result = detector.handleKeyDown('Enter', time);

      expect(result.isBarcode).toBe(true);
      expect(result.isbn).toBe(isbn);
    });

    it('detects ISBN-10 with X check digit', () => {
      const isbn = '155860832X';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      for (const char of isbn) {
        result = detector.handleKeyDown(char, time);
        time += 30;
      }

      result = detector.handleKeyDown('Enter', time);

      expect(result.isBarcode).toBe(true);
      expect(result.isbn).toBe(isbn);
    });

    it('handles ISBN with hyphens (removes them)', () => {
      const isbnWithHyphens = '978-0-451-52493-5';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      for (const char of isbnWithHyphens) {
        result = detector.handleKeyDown(char, time);
        time += 30;
      }

      result = detector.handleKeyDown('Enter', time);

      expect(result.isBarcode).toBe(true);
      expect(result.isbn).toBe('9780451524935');
    });
  });

  describe('slow input rejection', () => {
    it('rejects slowly typed input (human typing speed)', () => {
      const isbn = '9780451524935';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      // Simulate slow typing (200ms between keystrokes - above threshold)
      for (const char of isbn) {
        result = detector.handleKeyDown(char, time);
        time += 200;
      }

      result = detector.handleKeyDown('Enter', time);

      // Should not detect as barcode because buffer resets between slow keystrokes
      expect(result.isBarcode).toBe(false);
    });

    it('rejects input shorter than 10 characters', () => {
      const shortInput = '12345678';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      for (const char of shortInput) {
        result = detector.handleKeyDown(char, time);
        time += 30;
      }

      result = detector.handleKeyDown('Enter', time);

      expect(result.isBarcode).toBe(false);
    });
  });

  describe('buffer management', () => {
    it('resets buffer after successful scan', () => {
      const isbn = '9780451524935';
      let time = 1000;

      for (const char of isbn) {
        detector.handleKeyDown(char, time);
        time += 30;
      }

      detector.handleKeyDown('Enter', time);

      // Buffer should be cleared after successful scan
      expect(detector.buffer).toBe('');
    });

    it('resets buffer when time threshold exceeded', () => {
      // Type some characters
      let time = 1000;
      detector.handleKeyDown('1', time);
      time += 30;
      detector.handleKeyDown('2', time);
      time += 30;
      detector.handleKeyDown('3', time);

      // Wait longer than threshold
      time += 200;
      detector.handleKeyDown('4', time);

      // Buffer should only contain the last character
      expect(detector.buffer).toBe('4');
    });

    it('ignores non-barcode characters', () => {
      let time = 1000;

      detector.handleKeyDown('a', time);
      time += 30;
      detector.handleKeyDown('b', time);
      time += 30;
      detector.handleKeyDown('1', time);
      time += 30;
      detector.handleKeyDown('2', time);

      // Only digits should be in buffer
      expect(detector.buffer).toBe('12');
    });
  });

  describe('edge cases', () => {
    it('handles Enter without prior input', () => {
      const result = detector.handleKeyDown('Enter', 1000);
      expect(result.isBarcode).toBe(false);
    });

    it('handles lowercase x in ISBN-10', () => {
      const isbn = '155860832x';
      let result = { isBarcode: false, isbn: null as string | null };
      let time = 1000;

      for (const char of isbn) {
        result = detector.handleKeyDown(char, time);
        time += 30;
      }

      result = detector.handleKeyDown('Enter', time);

      expect(result.isBarcode).toBe(true);
      expect(result.isbn).toBe('155860832x');
    });

    it('can detect multiple scans in sequence', () => {
      const isbn1 = '9780451524935';
      const isbn2 = '9780062316110';
      let time = 1000;

      // First scan
      for (const char of isbn1) {
        detector.handleKeyDown(char, time);
        time += 30;
      }
      let result = detector.handleKeyDown('Enter', time);
      expect(result.isbn).toBe(isbn1);

      // Wait a bit between scans
      time += 500;

      // Second scan
      for (const char of isbn2) {
        detector.handleKeyDown(char, time);
        time += 30;
      }
      result = detector.handleKeyDown('Enter', time);
      expect(result.isbn).toBe(isbn2);
    });
  });
});
