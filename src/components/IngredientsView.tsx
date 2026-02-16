
import React from 'react';
import { Expression, Ingredient } from '../dsl/types';
import { formatIngredient, getIngredientImage } from '../data/mappings';

// Recursively extract all ingredients
function extractIngredients(node: Expression): Ingredient[] {
    const list: Ingredient[] = [];
    if (!node) return list;

    switch (node.type) {
        case 'INGREDIENT':
            list.push(node as Ingredient);
            break;
        case 'GROUP':
            list.push(...extractIngredients(node.content));
            break;
        case 'OPERATION':
            // Target is optional? In types it is optional.
            if (node.target) {
                list.push(...extractIngredients(node.target));
            }
            break;
        case 'BINARY_OP':
            list.push(...extractIngredients(node.left));
            list.push(...extractIngredients(node.right));
            break;
        case 'SEQUENCE':
            node.children.forEach(c => list.push(...extractIngredients(c)));
            break;
    }
    return list;
}

export const IngredientsView: React.FC<{ ast: Expression }> = ({ ast }) => {
    const ingredients = extractIngredients(ast);
    // Deduplicate? Or show total inputs?
    // Often ingredients are repeated if split.
    // Let's just list them.

    return (
        <div style={{ padding: '1rem', color: '#c0caf5' }}>
            <h3 style={{ borderBottom: '1px solid #414868', paddingBottom: '0.5rem' }}>原材料リスト</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {ingredients.map((ing, i) => {
                    const img = getIngredientImage(ing.name);
                    const label = formatIngredient(ing.name, ing.quantity, ing.unit);
                    return (
                        <div key={i} style={{
                            backgroundColor: '#24283b',
                            padding: '1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            {img && (
                                <img
                                    src={img}
                                    alt={ing.name}
                                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
                                />
                            )}
                            <div style={{ fontWeight: 'bold' }}>{label}</div>
                            {/* Original name debug */}
                            {/* <div style={{ fontSize: '0.8em', opacity: 0.5 }}>({ing.name})</div> */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
