#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

total_links=0
broken_links=0
md_extension_links=0

echo "=== Markdown Link Verification ==="
echo ""

# Check for .md extensions in links
echo "Checking for .md extensions in internal links..."
md_count=$(grep -r '\]\([^)]*\.md\)' docs --include="*.md" | wc -l)
if [ "$md_count" -gt 0 ]; then
    echo -e "${RED}✗ Found $md_count internal links with .md extensions${NC}"
    md_extension_links=$md_count
    grep -r '\]\([^)]*\.md\)' docs --include="*.md"
else
    echo -e "${GREEN}✓ No .md extensions found in internal links${NC}"
fi

echo ""
echo "Verifying relative internal links..."

# Extract all relative links and check if files exist
while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    links=$(echo "$line" | grep -oE '\]\(\./[^)]*\)' | sed 's/\]\(//g' | sed 's/)//g' | sort -u)
    
    while IFS= read -r link; do
        [ -z "$link" ] && continue
        
        # Remove .md if present
        target="${link%.md}"
        
        # Resolve relative path
        dir=$(dirname "$file")
        full_path="$dir/$target.md"
        
        ((total_links++))
        
        if [ ! -f "$full_path" ]; then
            echo -e "${RED}✗ Broken: $file -> $link (expected: $full_path)${NC}"
            ((broken_links++))
        fi
    done <<< "$links"
done < <(grep -r '\]\(\./[^)]*\)' docs --include="*.md" -l)

echo ""
echo "=== Summary ==="
echo "Total relative links checked: $total_links"
echo -e "Broken links: ${RED}$broken_links${NC}"
echo -e ".md extension links: ${RED}$md_extension_links${NC}"

if [ "$broken_links" -eq 0 ] && [ "$md_extension_links" -eq 0 ]; then
    echo -e "${GREEN}✓ All links verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Link verification failed${NC}"
    exit 1
fi
