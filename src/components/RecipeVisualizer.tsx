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

const VizOperation: React.FC<{ node: Operation }> = ({ node }) => (
    <div className="viz-node viz-operation-wrapper">
        <div className="viz-operation-label">
            {formatOperation(node.name, node.args)}
        </div>
        {/* Target might be implicit/undefined in some cases */}
        {node.target && <VizNode node={node.target} />}
        {node.comment && <div className="viz-comment">{node.comment}</div>}
    </div>
);

const VizGroup: React.FC<{ node: Group }> = ({ node }) => (
    <div className="viz-node viz-group">
        <VizNode node={node.content} />
    </div>
);

// Sequence (Implicit space or ;)
const VizSequence: React.FC<{ node: Sequence }> = ({ node }) => (
    <div className="viz-node viz-sequence">
        {node.children.map((child, i) => (
            <VizNode key={i} node={child} />
        ))}
    </div>
);

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
        // Layout logic: if deep, horizontal might be better?
        // Defaulting to vertical for ingredients list visual
        return (
            <div className="viz-node" style={{ flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <VizNode node={node.left} />
                <div className="viz-operator" style={{ fontSize: '1rem', padding: '0 4px', minWidth: 'auto', borderRadius: '50%', color: 'var(--text-color)', borderColor: 'var(--border-color)', opacity: 0.7 }}>+</div>
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
