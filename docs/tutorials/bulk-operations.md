# Bulk Operations

When you need to perform actions on multiple tasks at once, bulk operations save significant time. This tutorial covers how to select, modify, and manage tasks in batches.

## Selecting Multiple Tasks

### Click Selection

Hold modifier keys while clicking:

| Modifier | Behavior |
|----------|----------|
| `Ctrl/Cmd + Click` | Add/remove individual task from selection |
| `Shift + Click` | Select range of tasks |
| `Ctrl/Cmd + A` | Select all visible tasks |

### Checkbox Selection

When available:

1. Enable selection mode via the toolbar
2. Click checkboxes on individual tasks
3. Use "Select All" for all visible tasks

### Keyboard Selection

1. Navigate to a task with arrow keys
2. Press `Space` to toggle selection
3. Continue navigating and selecting
4. View selection count in the toolbar

## Bulk Actions

Once tasks are selected, available actions appear in the bulk action bar:

### Move to Column

Move all selected tasks to a different column:

1. Select tasks
2. Click **Move to** dropdown
3. Choose destination column
4. All selected tasks move instantly

### Change Priority

Update priority for multiple tasks:

1. Select tasks
2. Click **Set Priority** dropdown
3. Choose the new priority level
4. All selected tasks update

### Add Tags

Apply tags to multiple tasks:

1. Select tasks
2. Click **Add Tag**
3. Choose or type a tag
4. Tag is added to all selected tasks

### Remove Tags

Remove tags from multiple tasks:

1. Select tasks
2. Click **Remove Tag**
3. Select the tag to remove
4. Tag is removed from all selected tasks

### Delete Tasks

Delete multiple tasks at once:

1. Select tasks
2. Click **Delete**
3. Confirm the deletion (lists affected tasks)
4. All selected tasks are removed

> **Warning:** Bulk delete cannot be undone. Review the confirmation carefully.

## Bulk Edit Panel

For more complex edits, use the bulk edit panel:

1. Select tasks
2. Click **Edit Selected** or press `E`
3. The bulk edit panel opens
4. Make changes to applicable fields
5. Click **Apply to Selected**

### Editable Fields

| Field | Behavior |
|-------|----------|
| Priority | Sets same priority for all |
| Tags | Adds tags (does not remove existing) |
| Column | Moves all to specified column |

## Selection Persistence

Selection behavior during operations:

- **After move:** Selection is maintained
- **After priority change:** Selection is maintained
- **After delete:** Selection is cleared
- **After page refresh:** Selection is cleared

## Filtering and Bulk Actions

Combine filtering with bulk operations:

### Example Workflow

1. Filter to show only `bug` tagged tasks
2. Press `Ctrl/Cmd + A` to select all visible
3. Change priority to High
4. All bugs are now high priority

### Batch Processing Pattern

```
1. Set filter criteria
2. Select all visible
3. Apply bulk action
4. Clear filter
5. Repeat for next batch
```

## Performance Considerations

For large selections:

| Selection Size | Expected Performance |
|----------------|----------------------|
| 1-10 tasks | Instant |
| 10-50 tasks | 1-2 seconds |
| 50-100 tasks | 2-5 seconds |
| 100+ tasks | May need batching |

### Tips for Large Operations

1. Work in smaller batches (50 or fewer)
2. Wait for operations to complete before starting new ones
3. Check for errors in the notification area
4. Use filters to reduce selection size

## Keyboard Shortcuts for Bulk Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + A` | Select all visible |
| `Escape` | Clear selection |
| `Delete` | Delete selected (with confirmation) |
| `M` | Open move menu for selection |
| `P` | Open priority menu for selection |

## Undo and Recovery

Bulk operations and recovery options:

| Operation | Recovery |
|-----------|----------|
| Move | Re-select and move back |
| Priority change | Re-select and change again |
| Tag add | Remove tag (bulk or individual) |
| Delete | Not recoverable (use with caution) |

## Best Practices

1. **Preview before acting** - Check selection count before bulk actions
2. **Use filters** - Narrow scope before selecting all
3. **Start small** - Test with a few tasks first
4. **Backup important data** - Before major bulk deletes
5. **Work in batches** - For large numbers of tasks

> **Tip:** If you need to perform the same bulk operation regularly, consider whether the workflow could be improved to avoid the repetitive work.

## Common Use Cases

### Sprint Cleanup

Move all completed tasks to archive:

1. Go to Completed column
2. Select all tasks older than 2 weeks
3. Archive or delete

### Priority Reset

Reset priorities at start of sprint:

1. Filter to show all non-Low tasks
2. Select all
3. Set priority to Medium
4. Manually adjust true high priorities

### Tag Migration

Rename or consolidate tags:

1. Filter by old tag
2. Select all
3. Add new tag
4. Remove old tag

## Next Steps

- Learn about [Workflow Optimization](./workflow-optimization)
- Explore [Keyboard Shortcuts](./keyboard-shortcuts)
