
export interface RecipeRow {
    title: string;
    recipe: string;
    comment: string;
}

export function parseMarkdownTable(markdown: string): RecipeRow[] {
    const lines = markdown.trim().split('\n');
    return lines.map(line => {
        // |Title|Recipe|Comment|
        // Split by |
        const parts = line.split('|').map(p => p.trim());

        // Check if valid row (at least 3 pipes means 2 parts?)
        // |A|B| -> ["", "A", "B", ""] (length 4)
        // |A|B|C| -> ["", "A", "B", "C", ""] (length 5)
        if (parts.length < 4) return null;

        const title = parts[1];
        const recipe = parts[2];
        const comment = parts[3] || '';

        // Filter out table headers/separators
        if (!title || /^-+$/.test(title) || title.startsWith('#')) return null;

        return { title, recipe, comment };
    }).filter((r): r is RecipeRow => r !== null && !!r.title);
}
