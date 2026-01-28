/**
 * Converts a file path from metadata format to filesystem format.
 * Metadata stores paths with leading slash (e.g., '/docs/file.md')
 * but actual files are relative to project root (e.g., 'docs/file.md').
 *
 * @param filePath - The file path from metadata with optional leading slash
 * @returns The filesystem path without leading slash
 */
export function getFilesystemPath(filePath: string): string {
  return filePath.startsWith('/') ? filePath.slice(1) : filePath;
}
