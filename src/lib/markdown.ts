import { readFile, stat } from 'fs/promises';
import path from 'path';

/**
 * Validates and sanitizes a file path to prevent directory traversal attacks.
 * Ensures the resolved path stays within the docs directory.
 *
 * @param filePath - The relative file path to validate (e.g., 'getting-started/project-setup.md')
 * @param baseDir - The base directory that the path must stay within
 * @returns The sanitized absolute path, or null if the path is invalid
 */
function sanitizePath(filePath: string, baseDir: string): string | null {
  // Normalize the path to handle different OS path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Block obvious traversal attempts
  if (
    normalizedPath.includes('..') ||
    normalizedPath.startsWith('/') ||
    normalizedPath.includes(':') ||
    normalizedPath.includes('\0')
  ) {
    return null;
  }

  // Resolve the full path
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, normalizedPath);

  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    return null;
  }

  return resolvedPath;
}

/**
 * Loads a markdown file from the filesystem.
 *
 * @param filePath - Path to the markdown file relative to project root
 *                   (e.g., 'docs/getting-started/project-setup.md')
 * @returns The file contents as a string, or null if the file doesn't exist
 *          or the path is invalid
 *
 * @example
 * ```typescript
 * const content = await loadMarkdownFile('docs/getting-started/project-setup.md');
 * if (content === null) {
 *   // Handle 404
 * }
 * ```
 */
export async function loadMarkdownFile(filePath: string): Promise<string | null> {
  try {
    // Get the project root directory
    const projectRoot = process.cwd();

    // Sanitize and validate the path
    const sanitizedPath = sanitizePath(filePath, projectRoot);
    if (sanitizedPath === null) {
      console.warn(`Invalid file path rejected: ${filePath}`);
      return null;
    }

    // Ensure the file has a markdown extension
    if (!sanitizedPath.endsWith('.md') && !sanitizedPath.endsWith('.mdx')) {
      console.warn(`Non-markdown file rejected: ${filePath}`);
      return null;
    }

    // Check file size to prevent memory exhaustion
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const stats = await stat(sanitizedPath);
    if (stats.size > MAX_FILE_SIZE) {
      console.warn(`File exceeds size limit: ${filePath}`);
      return null;
    }

    // Read and return the file contents
    const content = await readFile(sanitizedPath, 'utf-8');
    return content;
  } catch (error) {
    // Handle file not found gracefully (expected)
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    // Handle permission errors (unexpected, log with context)
    if (error instanceof Error && 'code' in error && (error.code === 'EACCES' || error.code === 'EPERM')) {
      console.error(`Access denied loading markdown file: ${filePath}`, {
        code: error.code,
        path: filePath,
      });
      return null;
    }

    // Handle other unexpected errors
    console.error(`Unexpected error loading markdown file: ${filePath}`, {
      code: (error as NodeJS.ErrnoException)?.code || 'UNKNOWN',
    }, error);
    return null;
  }
}

/**
 * Extracts metadata from markdown frontmatter if present.
 * Frontmatter is expected in YAML format between --- delimiters.
 *
 * @param content - The markdown content that may contain frontmatter
 * @returns An object with the extracted metadata and the content without frontmatter
 *
 * @example
 * ```typescript
 * const { metadata, content } = extractFrontmatter(rawMarkdown);
 * // metadata: { title: 'My Doc', description: '...' }
 * // content: the markdown without the frontmatter block
 * ```
 */
export function extractFrontmatter(content: string): {
  metadata: Record<string, string>;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const frontmatterBlock = match[1];
  const metadata: Record<string, string> = {};

  // Parse simple YAML key-value pairs
  const lines = frontmatterBlock.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key && value) {
        metadata[key] = value;
      }
    }
  }

  // Return content without the frontmatter
  const contentWithoutFrontmatter = content.slice(match[0].length);
  return { metadata, content: contentWithoutFrontmatter };
}
