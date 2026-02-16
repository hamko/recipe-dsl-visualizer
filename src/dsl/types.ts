export interface BaseNode {
    type: string;
}

export interface Ingredient extends BaseNode {
    type: 'INGREDIENT';
    name: string;
    quantity?: number;
    unit?: string;
}

export interface Operation extends BaseNode {
    type: 'OPERATION';
    name: string;
    args: (string | number)[];
    comment?: string;
    target?: Expression;
}

export interface Group extends BaseNode {
    type: 'GROUP';
    content: Expression;
}

export interface BinaryOp extends BaseNode {
    type: 'BINARY_OP';
    operator: '++' | '-' | '->' | '+';
    left: Expression;
    right: Expression;
}

// Implicit sequence (space separated items)
export interface Sequence extends BaseNode {
    type: 'SEQUENCE';
    children: Expression[];
}

export type Expression = Ingredient | Operation | Group | BinaryOp | Sequence;

export interface Recipe {
    title: string;
    ast: Expression;
    comment?: string;
}

export interface ParseError {
    message: string;
    index: number;
}
