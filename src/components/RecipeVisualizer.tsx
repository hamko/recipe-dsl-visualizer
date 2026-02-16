import React from 'react';
import { Expression, Ingredient, Operation, Group, BinaryOp, Sequence } from '../dsl/types';
import { formatIngredient, formatOperation, getIngredientImage } from '../data/mappings';

interface Props {
    data: Expression;
}

const RecipeVisualizer: React.FC<Props> = ({ data }) => {
    return (
        <div className="viz-root" style={{ display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
            <VizNode node={data} />
        </div>
    );
};

const VizNode: React.FC<{ node: Expression }> = ({ node }) => {
    if (!node) return null;

    switch (node.type) {
        case 'INGREDIENT':
            return <VizIngredient node={node as Ingredient} />;
        case 'OPERATION':
            return <VizOperation node={node as Operation} />;
        case 'GROUP':
            return <VizGroup node={node as Group} />;
        case 'BINARY_OP':
            return <VizBinary node={node as BinaryOp} />;
        case 'SEQUENCE':
            return <VizSequence node={node as Sequence} />;
        default:
            return <div>Unknown Node: {(node as any)?.type}</div>;
    }
};

const VizIngredient: React.FC<{ node: Ingredient }> = ({ node }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const image = getIngredientImage(node.name);
    const displayName = formatIngredient(node.name, node.quantity, node.unit);

    return (
        <div
            className="viz-node"
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="viz-ingredient">
                {displayName}
            </div>
            {showTooltip && image && (
                <div className="viz-tooltip" style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#16161e',
                    border: '1px solid #7aa2f7',
                    borderRadius: '8px',
                    padding: '4px',
                    zIndex: 100,
                    marginBottom: '8px',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                }}>
                    <img src={image} alt={node.name} style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '4px', display: 'block' }} />
                </div>
            )}
            {(node as any).comment && <div className="viz-comment">{(node as any).comment}</div>}
        </div>
    );
};

// Flatten nested operation chain into [target, op1, op2, ...]
function flattenOpChain(node: Operation): { target: Expression | undefined; ops: { name: string; args: (string | number)[]; comment?: string }[] } {
    const ops: { name: string; args: (string | number)[]; comment?: string }[] = [];
    let current: Expression | undefined = node;

    while (current && current.type === 'OPERATION') {
        const op = current as Operation;
        ops.unshift({ name: op.name, args: op.args, comment: op.comment });
        current = op.target;
    }

    return { target: current, ops };
}

const VizOperation: React.FC<{ node: Operation }> = ({ node }) => {
    const { target, ops } = flattenOpChain(node);

    return (
        <div className="viz-node" style={{ flexDirection: 'column', gap: '0', alignItems: 'center' }}>
            {/* Render the base target (ingredient/group) */}
            {target && <VizNode node={target} />}

            {/* Render each operation as an arrow step */}
            {ops.map((op, i) => (
                <React.Fragment key={i}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '2px', height: '10px', backgroundColor: '#e0af68' }} />
                        <div style={{ fontSize: '0.7rem', color: '#e0af68' }}>▼</div>
                    </div>
                    <div className="viz-operation-label">
                        {formatOperation(op.name, op.args)}
                    </div>
                    {op.comment && <div className="viz-comment">{op.comment}</div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const VizGroup: React.FC<{ node: Group }> = ({ node }) => (
    <div className="viz-node">
        <VizNode node={node.content} />
    </div>
);

// Sequence (semicolon-separated phases)
const VizSequence: React.FC<{ node: Sequence }> = ({ node }) => {
    // Single child: no wrapping
    if (node.children.length <= 1) {
        return (
            <div className="viz-node">
                {node.children.map((child, i) => (
                    <VizNode key={i} node={child} />
                ))}
            </div>
        );
    }

    // Multiple children: wrap entire group in one dashed border
    return (
        <div className="viz-node" style={{
            border: '2px dashed #414868',
            borderRadius: '12px',
            padding: '1rem',
            backgroundColor: 'rgba(36, 40, 59, 0.3)',
        }}>
            <div className="viz-sequence">
                {node.children.map((child, i) => (
                    <VizNode key={i} node={child} />
                ))}
            </div>
        </div>
    );
};

const VizBinary: React.FC<{ node: BinaryOp }> = ({ node }) => {
    const isFlow = node.operator === '->';
    const isAdd = node.operator === '++' || node.operator === '+';
    const isMinus = node.operator === '-';

    if (isFlow) {
        return (
            <div className="viz-node viz-binary-row">
                <VizNode node={node.left} />
                <div className="viz-arrow">→</div>
                <VizNode node={node.right} />
            </div>
        );
    }

    if (isAdd) {
        // A ++ B means: Make A first, then add B into it (temporal order)
        return (
            <div className="viz-node" style={{ flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                <VizNode node={node.left} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ width: '2px', height: '12px', backgroundColor: '#9ece6a' }} />
                    <div style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        backgroundColor: '#9ece6a',
                        color: '#1a1b26',
                        borderRadius: '8px',
                        fontWeight: 'bold'
                    }}>
                        ＋投入
                    </div>
                    <div style={{ width: '2px', height: '12px', backgroundColor: '#9ece6a' }} />
                </div>
                <VizNode node={node.right} />
            </div>
        );
    }

    if (isMinus) {
        return (
            <div className="viz-node" style={{ flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <VizNode node={node.left} />
                <div className="viz-operator" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>-</div>
                <VizNode node={node.right} />
            </div>
        );
    }

    // Fallback (Generic binary op)
    return (
        <div className="viz-node viz-binary-row">
            <VizNode node={node.left} />
            <div className="viz-operator">{node.operator}</div>
            <VizNode node={node.right} />
        </div>
    );
};

export default RecipeVisualizer;
