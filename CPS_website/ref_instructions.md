# Updating References (Single Source of Truth)

**Required file:** `assets/data/references.json`

Everything—bottom reference cards, tooltips, and in-text links—comes from this JSON file. There is **no fallback**. If the file is missing or empty, the page shows a "No references yet" card and logs an error in the console.

---

## Add a Reference

1. Open `assets/data/references.json`.
2. Append a new object (IDs must stay unique and numeric):
   ```json
   {
     "id": 18,
     "title": "Your Paper Title",
     "authors": "A. Author, B. Author",
     "venue": "Venue, Year",
     "url": "https://doi.org/..."
   }
   ```
3. Cite it anywhere in the content with `<a class="reference-link" data-ref="18">[18]</a>`.
4. Serve locally (`python -m http.server 8000`) and refresh. The References list updates automatically.

**Tips**
- Prefer DOI/publisher URLs. Use `"#"` temporarily if unknown.
- IDs do not have to be sequential, but they must be unique.
- If you renumber IDs, update every matching `data-ref` anchor.

---

## Remove a Reference

1. Delete the object with that `id` from `assets/data/references.json`.
2. Search the HTML for `<a class="reference-link" data-ref="ID">` and remove/update those citations.
3. Refresh the site to confirm the card disappears.

---

## Edit a Reference

1. Modify any fields (title, authors, venue, url) inside the JSON entry.
2. Refresh the page. The bottom card, tooltip, and citation URLs update automatically.

---

## Quick Validation Checklist

- Console shows `✓ Loaded N references from assets/data/references.json.` (N = number of JSON entries).
- Bottom list displays the same count, with correct numbers/titles/authors/venue.
- Hovering any `[N]` link shows the title tooltip.
- Clicking a citation smooth-scrolls to the correct card and highlights it.
- Titles with real URLs open in a new tab; placeholders (`#`) do not navigate away.

If any of these fail, double-check the `id`, `url`, or HTML `data-ref` attributes.

