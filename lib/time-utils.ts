/**
 * Time formatting utilities
 */

/**
 * Formats duration string to hr:min:sec format
 * Handles various input formats:
 * - "45" (minutes) -> "0:45:00"
 * - "1:23" (min:sec) -> "0:01:23"
 * - "1:23:45" (hr:min:sec) -> "1:23:45"
 * - "45 min" -> "0:45:00"
 * - "1 hr 23 min" -> "1:23:00"
 */
export function formatDuration(duration: string | undefined): string {
  if (!duration) return '';

  // Remove any text like "min", "hr", etc.
  const cleanDuration = duration.replace(/[^\d:]/g, '');

  // Split by colons
  const parts = cleanDuration.split(':');

  if (parts.length === 1) {
    // Just minutes (e.g., "45")
    const minutes = parseInt(parts[0], 10);
    if (isNaN(minutes)) return duration; // fallback to original
    return `0:${minutes.toString().padStart(2, '0')}:00`;
  } else if (parts.length === 2) {
    // Minutes:seconds (e.g., "1:23")
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (isNaN(minutes) || isNaN(seconds)) return duration; // fallback to original
    return `0:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else if (parts.length === 3) {
    // Hours:minutes:seconds (e.g., "1:23:45")
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return duration; // fallback to original
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Fallback to original if format is unrecognized
  return duration;
}

/**
 * Formats time from milliseconds to hr:min:sec format
 * Used for audio player time display
 */
export function formatTime(millis: number): string {
  if (!millis || isNaN(millis)) return '0:00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}