/**
 * Prisma Seed Script for Kanban Board Application
 *
 * This script populates the database with sample tasks for development and testing.
 * Run with: npm run db:seed
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { Priority, ColumnId } from '../src/generated/prisma/enums';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Create PostgreSQL pool and Prisma adapter
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Sample tasks representing a typical project workflow
// Note: ownerId will be set dynamically in main()
const createSampleTasks = (ownerId: string) => [
  // TODO column tasks
  {
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment to staging environment.',
    priority: Priority.HIGH,
    tags: ['devops', 'automation', 'github'],
    columnId: ColumnId.TODO,
    categories: ['Infrastructure', 'DevOps'],
    ownerId,
  },
  {
    title: 'Write API documentation',
    description: 'Document all REST endpoints using OpenAPI/Swagger specification.',
    priority: Priority.MEDIUM,
    tags: ['documentation', 'api'],
    columnId: ColumnId.TODO,
    categories: ['Documentation'],
    ownerId,
  },
  {
    title: 'Add dark mode support',
    description: 'Implement theme switching with system preference detection and local storage persistence.',
    priority: Priority.LOW,
    tags: ['ui', 'feature', 'accessibility'],
    columnId: ColumnId.TODO,
    categories: ['Frontend', 'UX'],
    ownerId,
  },
  {
    title: 'Implement search functionality',
    description: 'Add full-text search across task titles and descriptions with debounced input.',
    priority: Priority.MEDIUM,
    tags: ['feature', 'search', 'ux'],
    columnId: ColumnId.TODO,
    categories: ['Frontend', 'Feature'],
    ownerId,
  },

  // IN_PROGRESS column tasks
  {
    title: 'Migrate to PostgreSQL',
    description: 'Replace localStorage with PostgreSQL database using Prisma ORM for data persistence.',
    priority: Priority.HIGH,
    tags: ['database', 'migration', 'prisma'],
    columnId: ColumnId.IN_PROGRESS,
    categories: ['Backend', 'Infrastructure'],
    ownerId,
  },
  {
    title: 'Add user authentication',
    description: 'Implement JWT-based authentication with login, registration, and password reset flows.',
    priority: Priority.HIGH,
    tags: ['security', 'auth', 'backend'],
    columnId: ColumnId.IN_PROGRESS,
    categories: ['Backend', 'Security'],
    ownerId,
  },
  {
    title: 'Optimize bundle size',
    description: 'Analyze and reduce JavaScript bundle size using code splitting and tree shaking.',
    priority: Priority.MEDIUM,
    tags: ['performance', 'optimization'],
    columnId: ColumnId.IN_PROGRESS,
    categories: ['Frontend', 'Performance'],
    ownerId,
  },

  // COMPLETED column tasks
  {
    title: 'Set up project structure',
    description: 'Initialize Next.js project with TypeScript, Tailwind CSS, and ESLint configuration.',
    priority: Priority.HIGH,
    tags: ['setup', 'configuration'],
    columnId: ColumnId.COMPLETED,
    categories: ['Infrastructure', 'Setup'],
    ownerId,
  },
  {
    title: 'Implement drag and drop',
    description: 'Add drag and drop functionality for tasks using @dnd-kit library.',
    priority: Priority.HIGH,
    tags: ['feature', 'dnd', 'ux'],
    columnId: ColumnId.COMPLETED,
    categories: ['Frontend', 'Feature'],
    ownerId,
  },
  {
    title: 'Design glassmorphic UI',
    description: 'Create modern glassmorphic design system with pastel color palette and blur effects.',
    priority: Priority.MEDIUM,
    tags: ['design', 'ui', 'css'],
    columnId: ColumnId.COMPLETED,
    categories: ['Frontend', 'Design'],
    ownerId,
  },
  {
    title: 'Add input validation',
    description: 'Implement client-side validation for task forms with XSS protection.',
    priority: Priority.HIGH,
    tags: ['security', 'validation', 'forms'],
    columnId: ColumnId.COMPLETED,
    categories: ['Frontend', 'Security'],
    ownerId,
  },
  {
    title: 'Write unit tests for utilities',
    description: 'Add comprehensive test coverage for utility functions including ID generation and sanitization.',
    priority: Priority.MEDIUM,
    tags: ['testing', 'quality'],
    columnId: ColumnId.COMPLETED,
    categories: ['Testing', 'Quality'],
    ownerId,
  },
];

async function main(): Promise<void> {
  console.log('Starting database seed...\n');

  // Create or upsert a test user
  console.log('Setting up test user...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {}, // Don't update if exists
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
    },
  });
  console.log(`Test user: "${testUser.name}" (${testUser.email})`);

  // Clear existing tasks
  const deleteResult = await prisma.task.deleteMany();
  console.log(`\nCleared ${deleteResult.count} existing tasks`);

  // Create sample tasks with the test user as owner
  console.log('\nCreating sample tasks...');
  const sampleTasks = createSampleTasks(testUser.id);

  for (const task of sampleTasks) {
    const created = await prisma.task.create({
      data: task,
    });
    console.log(`  Created: "${created.title}" (${created.columnId})`);
  }

  // Summary
  const counts = await prisma.task.groupBy({
    by: ['columnId'],
    _count: { id: true },
  });

  console.log('\n--- Seed Summary ---');
  console.log(`Total tasks created: ${sampleTasks.length}`);
  counts.forEach((count) => {
    console.log(`  ${count.columnId}: ${count._count.id} tasks`);
  });
  console.log(`Task owner: "${testUser.name}"`);
  console.log('-------------------\n');
}

main()
  .then(async () => {
    console.log('Seed completed successfully!');
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
