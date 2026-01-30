import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Models for E2E Tests
 *
 * These classes encapsulate page interactions and selectors,
 * making tests more maintainable and readable.
 */

/**
 * Kanban Board Page interactions
 */
export class KanbanBoardPage {
  readonly page: Page;

  // Column locators
  readonly todoColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly completedColumn: Locator;

  // Task modal locators
  readonly taskModal: Locator;
  readonly taskTitleInput: Locator;
  readonly taskDescriptionInput: Locator;
  readonly taskPrioritySelect: Locator;
  readonly taskSaveButton: Locator;
  readonly taskCancelButton: Locator;

  // Search and filter locators
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly filterPanel: Locator;

  // Header elements
  readonly addTaskButton: Locator;
  readonly labelManagerButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Columns - using aria-label or data attributes
    this.todoColumn = page.locator('[data-column="todo"], [aria-label*="To Do"]').first();
    this.inProgressColumn = page.locator('[data-column="in-progress"], [aria-label*="In Progress"]').first();
    this.completedColumn = page.locator('[data-column="completed"], [aria-label*="Completed"]').first();

    // Task modal elements
    this.taskModal = page.locator('[role="dialog"]').first();
    this.taskTitleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
    this.taskDescriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]');
    this.taskPrioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]');
    this.taskSaveButton = page.locator('button:has-text("Save"), button:has-text("Create")');
    this.taskCancelButton = page.locator('button:has-text("Cancel")');

    // Search and filter
    this.searchInput = page.getByRole('textbox', { name: /search/i });
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.filterPanel = page.getByRole('dialog', { name: /filter/i });

    // Header buttons
    this.addTaskButton = page.locator('button:has-text("Add Task"), button:has-text("New Task")').first();
    this.labelManagerButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels")').first();
  }

  /**
   * Navigate to the Kanban board
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all task cards on the board
   */
  async getAllTaskCards(): Promise<Locator> {
    return this.page.locator('[data-testid="task-card"], .task-card, [class*="TaskCard"]');
  }

  /**
   * Get task cards in a specific column
   */
  getTaskCardsInColumn(columnId: 'todo' | 'in-progress' | 'completed'): Locator {
    const column = columnId === 'todo' ? this.todoColumn :
                   columnId === 'in-progress' ? this.inProgressColumn :
                   this.completedColumn;
    return column.locator('[data-testid="task-card"], .task-card');
  }

  /**
   * Find a task card by its title
   */
  getTaskCardByTitle(title: string): Locator {
    return this.page.locator(`text="${title}"`).locator('xpath=ancestor::*[contains(@class, "task") or contains(@data-testid, "task")]').first();
  }

  /**
   * Click the add task button for a specific column
   */
  async clickAddTaskInColumn(columnId: 'todo' | 'in-progress' | 'completed'): Promise<void> {
    const column = columnId === 'todo' ? this.todoColumn :
                   columnId === 'in-progress' ? this.inProgressColumn :
                   this.completedColumn;

    const addButton = column.locator('button:has-text("Add"), button[aria-label*="Add"]').first();
    await addButton.click();
  }

  /**
   * Create a new task via the modal
   */
  async createTask(
    title: string,
    options?: {
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      columnId?: 'todo' | 'in-progress' | 'completed';
    }
  ): Promise<void> {
    // Open the task modal (either via header button or column button)
    if (options?.columnId) {
      await this.clickAddTaskInColumn(options.columnId);
    } else if (await this.addTaskButton.isVisible()) {
      await this.addTaskButton.click();
    } else {
      await this.clickAddTaskInColumn('todo');
    }

    // Wait for modal to be visible
    await expect(this.taskModal).toBeVisible();

    // Fill in task details
    await this.taskTitleInput.fill(title);

    if (options?.description) {
      await this.taskDescriptionInput.fill(options.description);
    }

    if (options?.priority) {
      await this.taskPrioritySelect.selectOption(options.priority);
    }

    // Save the task
    await this.taskSaveButton.click();

    // Wait for modal to close
    await expect(this.taskModal).not.toBeVisible();
  }

  /**
   * Edit an existing task
   */
  async editTask(
    currentTitle: string,
    newData: {
      title?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    }
  ): Promise<void> {
    const taskCard = this.getTaskCardByTitle(currentTitle);
    const editButton = taskCard.locator('button[aria-label*="Edit"]');

    await editButton.click();
    await expect(this.taskModal).toBeVisible();

    if (newData.title) {
      await this.taskTitleInput.clear();
      await this.taskTitleInput.fill(newData.title);
    }

    if (newData.description !== undefined) {
      await this.taskDescriptionInput.clear();
      await this.taskDescriptionInput.fill(newData.description);
    }

    if (newData.priority) {
      await this.taskPrioritySelect.selectOption(newData.priority);
    }

    await this.taskSaveButton.click();
    await expect(this.taskModal).not.toBeVisible();
  }

  /**
   * Delete a task
   */
  async deleteTask(title: string): Promise<void> {
    const taskCard = this.getTaskCardByTitle(title);
    const deleteButton = taskCard.locator('button[aria-label*="Delete"]');

    await deleteButton.click();

    // Confirm deletion in the confirmation modal
    const confirmModal = this.page.locator('[role="dialog"]').filter({ hasText: /delete|confirm/i });
    await expect(confirmModal).toBeVisible();

    const confirmButton = confirmModal.locator('button:has-text("Delete"), button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for task to be removed
    await expect(taskCard).not.toBeVisible();
  }

  /**
   * Drag a task from one column to another
   */
  async dragTaskToColumn(
    taskTitle: string,
    targetColumn: 'todo' | 'in-progress' | 'completed'
  ): Promise<void> {
    const taskCard = this.getTaskCardByTitle(taskTitle);
    const targetColumnLocator = targetColumn === 'todo' ? this.todoColumn :
                                targetColumn === 'in-progress' ? this.inProgressColumn :
                                this.completedColumn;

    // Get bounding boxes
    const taskBox = await taskCard.boundingBox();
    const columnBox = await targetColumnLocator.boundingBox();

    if (!taskBox || !columnBox) {
      throw new Error('Could not get bounding boxes for drag operation');
    }

    // Perform drag operation
    await this.page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + columnBox.height / 2, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Search for tasks
   */
  async searchTasks(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounced search
    await this.page.waitForTimeout(400);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    const clearButton = this.page.getByRole('button', { name: /clear search/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      await this.searchInput.clear();
    }
  }

  /**
   * Open the filter panel
   */
  async openFilterPanel(): Promise<void> {
    await this.filterButton.click();
    await expect(this.filterPanel).toBeVisible();
  }

  /**
   * Apply a priority filter
   */
  async filterByPriority(priority: 'low' | 'medium' | 'high'): Promise<void> {
    await this.openFilterPanel();

    const prioritySelect = this.page.getByLabel(/priority/i);
    await prioritySelect.selectOption(priority.toUpperCase());

    const applyButton = this.page.getByRole('button', { name: /apply/i });
    await applyButton.click();
  }
}

/**
 * Label Manager interactions
 */
export class LabelManagerPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly createButton: Locator;
  readonly nameInput: Locator;
  readonly colorPicker: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
    this.createButton = page.locator('button:has-text("Create New Label"), button:has-text("Create Label")');
    this.nameInput = page.locator('input#label-name, input[placeholder*="label name" i]');
    this.colorPicker = page.locator('[data-testid="color-picker"]');
    this.saveButton = page.locator('button:has-text("Create Label"), button:has-text("Save")').last();
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  /**
   * Open the label manager modal
   */
  async open(kanbanPage: KanbanBoardPage): Promise<void> {
    await kanbanPage.labelManagerButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * Create a new label
   */
  async createLabel(name: string, color?: string): Promise<void> {
    await this.createButton.click();

    await this.nameInput.fill(name);

    if (color) {
      // Click on the color option
      const colorOption = this.page.locator(`[data-color="${color}"], button[title*="${color}" i]`);
      if (await colorOption.count() > 0) {
        await colorOption.first().click();
      }
    }

    await this.saveButton.click();

    // Wait for the form to close (returns to list view)
    await expect(this.nameInput).not.toBeVisible();
  }

  /**
   * Get a label by name in the list
   */
  getLabelByName(name: string): Locator {
    return this.modal.locator(`text="${name}"`).locator('xpath=ancestor::*[1]');
  }

  /**
   * Delete a label
   */
  async deleteLabel(name: string): Promise<void> {
    const labelRow = this.getLabelByName(name);
    const deleteButton = labelRow.locator('button[aria-label*="Delete"]');

    await deleteButton.click();

    // Confirm deletion
    const confirmModal = this.page.locator('[role="dialog"]').filter({ hasText: /delete/i }).last();
    await expect(confirmModal).toBeVisible();

    const confirmButton = confirmModal.locator('button:has-text("Delete")');
    await confirmButton.click();

    // Wait for label to be removed
    await expect(labelRow).not.toBeVisible();
  }

  /**
   * Close the label manager modal
   */
  async close(): Promise<void> {
    const closeButton = this.modal.locator('button[aria-label*="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await expect(this.modal).not.toBeVisible();
  }
}

/**
 * Notifications Page interactions
 */
export class NotificationsPage {
  readonly page: Page;
  readonly notificationList: Locator;
  readonly markAllReadButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.notificationList = page.locator('[data-testid="notification-list"], .notification-list');
    this.markAllReadButton = page.locator('button:has-text("Mark all as read")');
    this.emptyState = page.locator('text=/no notifications/i');
  }

  /**
   * Navigate to notifications page
   */
  async goto(): Promise<void> {
    await this.page.goto('/notifications');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all notification items
   */
  getNotificationItems(): Locator {
    return this.page.locator('[data-testid="notification-item"], .notification-item');
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    const items = this.getNotificationItems();
    return items.count();
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(index: number): Promise<void> {
    const notification = this.getNotificationItems().nth(index);
    const markReadButton = notification.locator('button[aria-label*="Mark as read"]');

    if (await markReadButton.isVisible()) {
      await markReadButton.click();
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(index: number): Promise<void> {
    const notification = this.getNotificationItems().nth(index);
    const deleteButton = notification.locator('button[aria-label*="Delete"]');

    await deleteButton.click();
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    if (await this.markAllReadButton.isVisible()) {
      await this.markAllReadButton.click();
    }
  }
}
