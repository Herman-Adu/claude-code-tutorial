# Filtering and Search

The Kanban board provides powerful filtering and search capabilities to help you find tasks quickly and focus on specific subsets of your work.

## Quick Filters

### Priority Filter

Filter tasks by their priority level:

1. Click the **Priority** dropdown in the filter bar
2. Select a priority level:
   - **All** - Show all tasks
   - **High** - Show only high-priority tasks
   - **Medium** - Show only medium-priority tasks
   - **Low** - Show only low-priority tasks

### Status Filter

Filter by column/status:

1. Click the **Status** dropdown
2. Select which columns to show:
   - All columns
   - To Do only
   - In Progress only
   - Completed only

### Tag Filter

Filter by task tags:

1. Click the **Tags** dropdown
2. Select one or more tags
3. Tasks with matching tags will be displayed

## Search Functionality

### Basic Search

The search box allows quick text-based filtering:

1. Click the search input field
2. Type your search term
3. Results update in real-time

Search matches against:
- Task titles
- Task descriptions

### Search Tips

| Pattern | Example | Matches |
|---------|---------|---------|
| Single word | `login` | Tasks containing "login" |
| Multiple words | `user auth` | Tasks containing both words |
| Phrase | `"user authentication"` | Exact phrase match |

## Combining Filters

Filters can be combined for precise results:

```
Priority: High + Tag: bug + Search: "mobile"
```

This would show only high-priority bug tasks containing "mobile".

### Filter Logic

- Multiple filters use AND logic
- Multiple tags use OR logic within the tag filter
- Search combines with other filters

## Filter Presets

Save time with common filter combinations:

### "Urgent Work" Preset

- Priority: High
- Status: To Do, In Progress
- Tags: Any

### "Bug Triage" Preset

- Priority: All
- Status: To Do
- Tags: bug

### "Today's Focus" Preset

- Priority: High, Medium
- Status: In Progress
- Tags: Any

## Clearing Filters

To return to the unfiltered view:

1. Click the **Clear Filters** button
2. Or click the "X" on individual filter chips
3. Or refresh the page

## Keyboard Shortcuts

Speed up filtering with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `/` | Focus search box |
| `Escape` | Clear search / Close filter dropdown |
| `Ctrl+F` | Open filter panel |

## Advanced Search Techniques

### Negation

Exclude terms from search:

- `-bug` - Exclude tasks with "bug"
- `feature -mobile` - Features but not mobile-related

### Wildcards

Use partial matching:

- `auth*` - Matches "auth", "authentication", "authorize"
- `*fix` - Matches "bugfix", "hotfix", "quickfix"

## Filter Best Practices

1. **Start broad, narrow down** - Begin with loose filters
2. **Use bookmarks** - Save filtered URLs for quick access
3. **Regular cleanup** - Filters work better with organized tasks
4. **Learn shortcuts** - Keyboard navigation speeds up workflow

> **Tip:** The filter state persists in the URL. Share a filtered view by copying the page URL.

## Troubleshooting

### No Results Found

If your search returns no results:

1. Check spelling
2. Try broader search terms
3. Clear other filters that may be limiting results
4. Verify tasks exist with the criteria

### Filters Not Working

If filters seem unresponsive:

1. Refresh the page
2. Clear all filters and try again
3. Check browser console for errors

## Next Steps

- Explore [Keyboard Shortcuts](./keyboard-shortcuts)
- Learn about [Organizing Tasks](./organizing-tasks)
