# Working with Task Details

Understanding how to effectively use task details helps you capture context, track progress, and communicate clearly. This tutorial covers the task detail view and all its capabilities.

## Opening Task Details

Access the task detail view:

1. **Click the task card** on the board
2. **Press Enter** when a task is focused
3. **Double-click** the task title
4. **Use keyboard shortcut** `E` to edit

## The Task Detail View

The detail view shows all task information:

### Header Section

- **Title** - The task name (editable)
- **Status badge** - Current column
- **Priority badge** - Priority level
- **Close button** - Return to board

### Main Content

- **Description** - Detailed information
- **Tags** - Category labels
- **Due date** - When the task should be completed
- **Created date** - When the task was created
- **Last modified** - Most recent update

### Actions

- **Edit** - Modify task details
- **Move** - Change column
- **Delete** - Remove the task
- **Duplicate** - Create a copy

## Editing Task Details

### Editing the Title

1. Click the title text
2. Type the new title
3. Press `Enter` or click away to save
4. Press `Escape` to cancel

### Editing the Description

The description supports rich text:

1. Click the description area
2. Enter or modify text
3. Use markdown formatting
4. Click **Save** or press `Ctrl/Cmd + Enter`

#### Markdown Support

```markdown
**Bold text** for emphasis
*Italic text* for subtle emphasis
- Bullet points
- For lists
1. Numbered lists
2. For sequences
`code` for technical terms
[Links](https://example.com)
```

### Changing Priority

1. Click the priority badge
2. Select from the dropdown:
   - Low (green)
   - Medium (amber)
   - High (red)
3. Change saves immediately

### Managing Tags

#### Adding Tags

1. Click **Add Tag** or the tag area
2. Type a new tag name, or
3. Select from existing tags
4. Press `Enter` to add

#### Removing Tags

1. Click the **X** on any tag
2. Or click the tag and press `Delete`
3. Tag is removed immediately

### Setting Due Date

1. Click the due date field
2. Select a date from the picker
3. Optionally set a time
4. Click **Apply** to save

#### Removing Due Date

1. Click the due date field
2. Click **Clear** or delete the date
3. Task will have no due date

## Task Metadata

### Viewing History

Some task details track history:

| Field | History |
|-------|---------|
| Created | Original creation date/time |
| Modified | Last update timestamp |
| Moved | When status changed (if tracked) |

### Task Identification

Each task has a unique identifier:

- Shown in the URL when viewing
- Can be used for references
- Persists even if title changes

## Keyboard Shortcuts in Detail View

| Shortcut | Action |
|----------|--------|
| `Escape` | Close detail view |
| `E` | Enter edit mode |
| `P` | Change priority |
| `M` | Move to column |
| `D` or `Delete` | Delete task |
| `Ctrl/Cmd + Enter` | Save changes |
| `Tab` | Navigate between fields |

## Working with Long Descriptions

### Best Practices

For detailed task descriptions:

1. **Use headers** to organize sections
2. **Add checklists** for subtasks
3. **Include context** for future reference
4. **Link related resources**

### Example Structure

```markdown
## Overview
Brief summary of what this task involves.

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two
- [ ] Criterion three

## Technical Notes
Any implementation details or considerations.

## Resources
- [Design mockup](link)
- [Related documentation](link)
```

## Attachments and Links

### Adding Links

Include URLs in the description:

1. Paste the URL in the description
2. Or use markdown link syntax
3. Links become clickable when saved

### External Resources

Reference external tools:

- Design files (Figma, Sketch)
- Documentation (Confluence, Notion)
- Issue trackers (Jira, GitHub)
- Communication (Slack threads)

## Task Templates

### Creating Consistent Tasks

For recurring task types, use a template approach:

1. Create a template task with standard structure
2. Duplicate when creating similar tasks
3. Modify the specific details
4. Maintain consistency across tasks

### Template Example

```markdown
## Bug Report Template

**Environment:**
- Browser:
- OS:
- Version:

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Screenshots:**
```

## Collaboration Features

### Comments (if available)

Add comments to discuss the task:

1. Scroll to the comments section
2. Type your comment
3. Press `Enter` or click **Post**
4. Comments appear chronologically

### Mentions

Reference team members:

- Type `@` followed by their name
- They receive a notification
- Their name becomes a link

## Mobile Considerations

On mobile devices:

- Tap to open task details
- Swipe to navigate between fields
- Use the on-screen keyboard for editing
- Tap outside to close

## Best Practices

1. **Keep titles concise** - Details go in description
2. **Update regularly** - Stale information causes confusion
3. **Use consistent formatting** - Templates help
4. **Add context** - Future you will thank present you
5. **Link resources** - Keep everything connected

> **Tip:** Treat task descriptions as documentation. Write them for someone unfamiliar with the context.

## Next Steps

- Learn about [Creating Tasks](./creating-tasks)
- Explore [Organizing Tasks](./organizing-tasks)
