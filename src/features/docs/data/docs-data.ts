import type { DocMetadata } from "../types";
import { getFilesystemPath } from '@/lib/path';
export { getFilesystemPath };

/**
 * Static documentation metadata based on actual files in the docs/ folder.
 *
 * This data is extracted to a separate file so it can be imported by both:
 * - Client-side hooks (useDocsData)
 * - Server-side components (dynamic route pages)
 */
export const DOCS_DATA: DocMetadata[] = [
  // Getting Started
  {
    slug: "project-setup",
    title: "Project Setup",
    description: "Initial project setup and configuration guide",
    category: "getting-started",
    filePath: "/docs/getting-started/project-setup.md",
  },

  // Guides
  {
    slug: "read-me-first",
    title: "Read Me First",
    description: "Essential information before diving into the codebase",
    category: "guides",
    filePath: "/docs/guides/00_READ_ME_FIRST.md",
  },
  {
    slug: "architecture-quick-ref",
    title: "Architecture Quick Reference",
    description: "Quick reference for architecture patterns",
    category: "guides",
    filePath: "/docs/guides/ARCHITECTURE_QUICK_REFERENCE.md",
  },
  {
    slug: "test-implementation",
    title: "Test Implementation Guide",
    description: "Guide for implementing tests",
    category: "guides",
    filePath: "/docs/guides/TEST_IMPLEMENTATION_GUIDE.md",
  },
  {
    slug: "test-quick-ref",
    title: "Test Review Quick Reference",
    description: "Quick reference for test reviews",
    category: "guides",
    filePath: "/docs/guides/TEST_REVIEW_QUICK_REFERENCE.md",
  },
  {
    slug: "testing-verification",
    title: "Testing Verification",
    description: "Verification procedures for tests",
    category: "guides",
    filePath: "/docs/guides/testing-verification.md",
  },

  // Architecture
  {
    slug: "architecture-overview",
    title: "Architecture Overview",
    description: "High-level system architecture",
    category: "architecture",
    filePath: "/docs/architecture/overview.md",
  },
  {
    slug: "database-schema",
    title: "Database Schema",
    description: "Database design and schema documentation",
    category: "architecture",
    filePath: "/docs/architecture/database-schema.md",
  },
  {
    slug: "storage-layer",
    title: "Storage Layer",
    description: "Data storage implementation details",
    category: "architecture",
    filePath: "/docs/architecture/storage-layer.md",
  },
  {
    slug: "technical-decisions",
    title: "Technical Decisions",
    description: "Key technical decisions and rationale",
    category: "architecture",
    filePath: "/docs/architecture/technical-decisions.md",
  },

  // Components
  {
    slug: "kanban-board",
    title: "Kanban Board",
    description: "Kanban board component documentation",
    category: "components",
    filePath: "/docs/components/kanban-board.md",
  },
  {
    slug: "ui-components",
    title: "UI Components",
    description: "Reusable UI components",
    category: "components",
    filePath: "/docs/components/ui-components.md",
  },
  {
    slug: "feature-components",
    title: "Feature Components",
    description: "Feature-specific components",
    category: "components",
    filePath: "/docs/components/feature-components.md",
  },

  // API
  {
    slug: "api-actions",
    title: "API & Actions",
    description: "Server actions and API documentation",
    category: "api",
    filePath: "/docs/api/api-and-actions.md",
  },
  {
    slug: "types-constants",
    title: "Types & Constants",
    description: "TypeScript types and constants",
    category: "api",
    filePath: "/docs/api/types-and-constants.md",
  },

  // Testing
  {
    slug: "testing-strategy",
    title: "Testing Strategy",
    description: "Overall testing strategy and approach",
    category: "testing",
    filePath: "/docs/testing/TESTING_STRATEGY.md",
  },
  {
    slug: "ci-cd-pipeline",
    title: "CI/CD Pipeline",
    description: "Continuous integration and deployment",
    category: "testing",
    filePath: "/docs/testing/CI_CD_PIPELINE.md",
  },
  {
    slug: "testing-task-list",
    title: "Testing Task List",
    description: "Checklist of testing tasks",
    category: "testing",
    filePath: "/docs/testing/TESTING_TASK_LIST.md",
  },

  // Reviews
  {
    slug: "architecture-review",
    title: "Architecture Review",
    description: "Comprehensive architecture analysis",
    category: "reviews",
    filePath: "/docs/reviews/ARCHITECTURE_REVIEW.md",
  },
  {
    slug: "architecture-review-summary",
    title: "Architecture Review Summary",
    description: "Executive summary of architecture review",
    category: "reviews",
    filePath: "/docs/reviews/ARCHITECTURE_REVIEW_SUMMARY.md",
  },
  {
    slug: "architecture-review-validation",
    title: "Architecture Review Validation",
    description: "Validation of architecture review with supplemental analysis",
    category: "reviews",
    filePath: "/docs/reviews/ARCHITECTURE_REVIEW_VALIDATION.md",
  },
  {
    slug: "security-review",
    title: "Security Best Practices Review",
    description: "Security analysis and recommendations",
    category: "reviews",
    filePath: "/docs/reviews/SECURITY_BEST_PRACTICES_REVIEW.md",
  },
  {
    slug: "test-coverage-review",
    title: "Test Coverage Review",
    description: "Analysis of test coverage",
    category: "reviews",
    filePath: "/docs/reviews/TEST_COVERAGE_REVIEW.md",
  },
  {
    slug: "comprehensive-test-review",
    title: "Comprehensive Test Review",
    description: "Full test assessment",
    category: "reviews",
    filePath: "/docs/reviews/COMPREHENSIVE_TEST_REVIEW.md",
  },
  {
    slug: "test-review-executive-summary",
    title: "Test Review Executive Summary",
    description: "Executive summary of testing assessment and key metrics",
    category: "reviews",
    filePath: "/docs/reviews/TEST_REVIEW_EXECUTIVE_SUMMARY.md",
  },
  {
    slug: "test-review-summary",
    title: "Test Review Summary",
    description: "Test coverage and quality review overview",
    category: "reviews",
    filePath: "/docs/reviews/TEST_REVIEW_SUMMARY.md",
  },

  // Blogs/Articles
  {
    slug: "claude-recovery",
    title: "Claude Recovery Sprint C",
    description: "Development recovery sprint documentation",
    category: "blogs",
    filePath: "/docs/blogs/CLAUDE_RECOVERY_SPRINT_C.md",
  },
  {
    slug: "server-actions-status",
    title: "Server Actions Test Status",
    description: "Current status of server action tests",
    category: "blogs",
    filePath: "/docs/blogs/SERVER_ACTIONS_TEST_STATUS.md",
  },
  {
    slug: "testing-plan-status",
    title: "Testing Plan Implementation Status",
    description: "Progress on testing plan implementation",
    category: "blogs",
    filePath: "/docs/blogs/TESTING_PLAN_IMPLEMENTATION_STATUS.md",
  },

  // Planned Features
  {
    slug: "authentication",
    title: "Authentication",
    description: "Planned authentication feature",
    category: "planned-features",
    filePath: "/docs/planned-features/authentication.md",
  },
  {
    slug: "calendar-view",
    title: "Calendar View",
    description: "Planned calendar view feature",
    category: "planned-features",
    filePath: "/docs/planned-features/calendar-view.md",
  },
  {
    slug: "filtering-system",
    title: "Filtering System",
    description: "Planned task filtering system",
    category: "planned-features",
    filePath: "/docs/planned-features/filtering-system.md",
  },
];

/**
 * Find a document by its slug.
 *
 * @param slug - The URL slug to search for
 * @returns The document metadata if found, undefined otherwise
 */
export function findDocBySlug(slug: string): DocMetadata | undefined {
  return DOCS_DATA.find((doc) => doc.slug === slug);
}

