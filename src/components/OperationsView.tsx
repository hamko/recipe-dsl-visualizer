
import React from 'react';
import { Expression, Operation } from '../dsl/types';
import { formatOperation } from '../data/mappings';

function extractOperations(node: Expression): Operation[] {
    const list: Operation[] = [];
    if (!node) return list;

    switch (node.type) {
        case 'INGREDIENT':
            // No operations
            break;
        case 'GROUP':
            list.push(...extractOperations(node.content));
            break;
        case 'OPERATION':
            // Prepend or append? Typically operations happen "after" children
            if (node.target) {
                list.push(...extractOperations(node.target));
            }
            list.push(node as Operation); // This operation happens last
            break;
        case 'BINARY_OP':
            list.push(...extractOperations(node.left));
            list.push(...extractOperations(node.right));
            break;
        case 'SEQUENCE':
            node.children.forEach(c => list.push(...extractOperations(c)));
            break;
    }
    return list;
}

export const OperationsView: React.FC<{ ast: Expression }> = ({ ast }) => {
    const ops = extractOperations(ast);

    return (
        <div style={{ padding: '1rem', color: '#c0caf5' }}>
            <h3 style={{ borderBottom: '1px solid #414868', paddingBottom: '0.5rem' }}>調理手順リスト</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {ops.map((op, i) => {
                    const label = formatOperation(op.name, op.args);
                    const rawArgs = `@${op.name}` + (op.args.length ? op.args.join('') : '') + (op.comment ? `{${op.comment}}` : '');

                    return (
                        <li key={i} style={{
                            backgroundColor: '#24283b',
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '1.1rem' }}>{i + 1}. {label}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.5, fontFamily: 'monospace' }}>
                                    {rawArgs}
                                </span>
                            </div>
                            {op.comment && (
                                <div style={{ fontSize: '0.85rem', color: '#e0af68', marginTop: '0.3rem', fontStyle: 'italic' }}>
                                    ⚠ {op.comment}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
