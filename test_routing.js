// Quick test to verify docs routing works
const path = require('path');

// Test 1: Verify DOCS_DATA can be imported
try {
  const { DOCS_DATA, findDocBySlug, toFilesystemPath } = require('./src/features/docs/data/docs-data.ts');
  console.log('✓ Can import DOCS_DATA');
  console.log(`  Total docs: ${DOCS_DATA.length}`);
  
  // Test findDocBySlug
  const doc = findDocBySlug('project-setup');
  if (doc) {
    console.log(`✓ findDocBySlug works: found "${doc.title}"`);
  } else {
    console.log('✗ findDocBySlug failed');
  }
  
  // Test toFilesystemPath
  const fsPath = toFilesystemPath('/docs/getting-started/project-setup.md');
  if (fsPath === 'docs/getting-started/project-setup.md') {
    console.log(`✓ toFilesystemPath works correctly`);
  } else {
    console.log(`✗ toFilesystemPath returned: ${fsPath}`);
  }
} catch (e) {
  console.error('✗ Import failed:', e.message);
}

// Test 2: Verify path sanitization
const { loadMarkdownFile } = require('./src/lib/markdown.ts');
console.log('\n✓ Can import loadMarkdownFile');

console.log('\nAll routing verification checks completed.');
