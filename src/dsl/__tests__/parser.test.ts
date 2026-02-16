
import { describe, it, expect } from 'vitest';
import { parseRecipe } from '../parser';
import { rawRecipesMarkdown } from '../../data/rawRecipes';

function parseMarkdownTable(markdown: string) {
    const lines = markdown.trim().split('\n');
    return lines.map(line => {
        // |Title|Recipe|Comment|
        // Split by | but ignore empty start/end
        const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length < 2) return null;
        return { title: parts[0], recipe: parts[1], comment: parts[2] };
    }).filter(r => r !== null);
}

describe('Recipe DSL Parser', () => {
    const recipes = parseMarkdownTable(rawRecipesMarkdown);

    it('should parse simple ingredient: 豚バラ500', () => {
        const ast = parseRecipe('豚バラ500');
        expect(ast).toMatchObject({
            type: 'INGREDIENT',
            name: '豚バラ',
            quantity: 500
        });
    });

    it('should parse ingredient with unit: 水1.5合分', () => {
        const ast = parseRecipe('水1.5合分');
        expect(ast).toMatchObject({
            type: 'INGREDIENT',
            name: '水',
            quantity: 1.5,
            unit: '合分'
        });
    });

    it('should parse operation with args: @SauteL5', () => {
        // Lexer splits SauteL / 5? Or Saute / L / 5?
        // Regex: ID excludes digits. "SauteL" is ID. "5" is Number.
        // Parser consumes ID, consumes adjacent Number.
        // Name: "SauteL", Args: [5]
        const ast = parseRecipe('豚バラ@SauteL5');
        // Expect Operation(Ingredient, "SauteL", [5])
        expect(ast).toMatchObject({
            type: 'OPERATION',
            name: 'SauteL',
            args: ['5'] // Args are stored as strings in my parser implementation? Yes, `argTok.value`.
        });
    });

    it('should parse complex args: @Cut-1-1', () => {
        // @Cut-1-1
        // "Cut", "-", "1", "-", "1"
        const ast = parseRecipe('人参@Cut-1-1');
        expect(ast).toMatchObject({
            type: 'OPERATION',
            name: 'Cut',
            args: ['-', '1', '-', '1']
        });
    });

    it('should parse group: ((A))', () => {
        const ast = parseRecipe('((A))');
        expect(ast).toMatchObject({
            type: 'GROUP',
            content: {
                type: 'GROUP',
                content: { type: 'INGREDIENT', name: 'A' }
            }
        });
    });

    // Dynamic tests for all recipes
    recipes.forEach((r) => {
        if (!r) return;
        it(`should parse recipe: ${r.title}`, () => {
            // Some recipes might be empty "||"
            if (!r.recipe) return;

            try {
                const ast = parseRecipe(r.recipe);
                expect(ast).toBeTruthy();

                // Basic consistency check
                // console.log(JSON.stringify(ast, null, 2));
            } catch (e: any) {
                console.error(`Failed parsing "${r.title}"\nRecipe: ${r.recipe}\nError: ${e.message}`);
                throw e;
            }
        });
    });
});
