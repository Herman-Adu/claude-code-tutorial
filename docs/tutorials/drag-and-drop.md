# Drag and Drop

The drag-and-drop functionality is at the heart of the Kanban experience. This tutorial explains how to efficiently move tasks between columns and reorder them within columns.

## Basic Drag and Drop

### Moving Tasks Between Columns

1. **Initiate the drag** - Click and hold on a task card
2. **Drag to destination** - Move the card to another column
3. **Drop the task** - Release the mouse button to place the task

The task will be added to the new column and its status will update automatically.

### Visual Feedback

While dragging, you will see:

- **Drag preview** - A slightly transparent copy of the card
- **Drop indicator** - Highlighted area showing where the task will land
- **Column highlight** - The target column lights up when hovering over it

## Reordering Within Columns

Tasks can be reordered within the same column:

1. Click and hold the task you want to move
2. Drag it up or down within the column
3. Release to set the new position

This is useful for prioritizing tasks visually.

## Status Updates

When you drop a task in a new column, the status updates automatically:

| Column | Status |
|--------|--------|
| To Do | `TODO` |
| In Progress | `IN_PROGRESS` |
| Completed | `COMPLETED` |

The change is saved immediately and persisted to the database.

## Touch Device Support

On touch devices:

1. **Tap and hold** - Touch the task card for about 300ms
2. **Drag** - Move your finger to the destination
3. **Release** - Lift your finger to drop the task

### Touch Gestures

| Gesture | Action |
|---------|--------|
| Tap | Select / Open task |
| Tap and hold | Initiate drag |
| Swipe | Scroll within column |

## Keyboard Accessibility

For users who prefer keyboard navigation:

1. Tab to the task you want to move
2. Press `Space` or `Enter` to select
3. Use arrow keys to move position
4. Press `Space` or `Enter` to confirm

## Multi-Select Drag

Currently, the board supports single-task dragging. For bulk operations:

1. Move tasks one at a time
2. Or use the bulk actions menu (see [Bulk Operations](./bulk-operations))

## Performance Considerations

The drag-and-drop system is optimized for smooth performance:

- Uses optimistic updates for instant feedback
- Syncs with the server in the background
- Rolls back automatically if the save fails

### What Happens During a Drag

```
1. User initiates drag
2. UI shows drag preview
3. User drops task
4. UI updates immediately (optimistic)
5. Server request sent in background
6. If error: UI reverts to original state
```

## Drag Constraints

### Valid Drops

Tasks can be dropped:
- In any of the three columns
- At any position within a column

### Invalid Drops

If you drop in an invalid area:
- The task returns to its original position
- No error is shown (silent recovery)

## Tips for Effective Dragging

1. **Aim for the center** - Drop in the middle of a column for predictable placement
2. **Watch the indicator** - The drop line shows exact placement
3. **Use keyboard for precision** - Arrow keys give more control
4. **Avoid rapid movements** - Smooth dragging is more accurate

## Troubleshooting

### Task Not Moving

If a task is not responding to drag:

1. Ensure you are clicking on the task card itself
2. Try a longer press before dragging
3. Check if the task is in an editable/selected state
4. Refresh the page if the issue persists

### Task Jumping Back

If a task reverts to its original position:

1. Check your network connection
2. Look for error messages
3. The server may have rejected the move

### Laggy Dragging

If dragging feels slow:

1. Close other browser tabs
2. Check for browser extensions that may interfere
3. Try a different browser

## Accessibility Notes

The drag-and-drop system includes accessibility features:

- Screen reader announcements for drag operations
- Keyboard alternatives for all drag actions
- High contrast drop indicators
- Focus management during operations

## Next Steps

- Learn about [Organizing Tasks](./organizing-tasks)
- Explore [Keyboard Shortcuts](./keyboard-shortcuts)
