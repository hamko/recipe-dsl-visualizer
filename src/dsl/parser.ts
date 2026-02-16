
import {
    Expression, Ingredient, Operation, Group, BinaryOp, Sequence,
    Recipe
} from './types';
import { tokenize, Token, TokenType } from './lexer';

export class Parser {
    private tokens: Token[];
    private pos: number;
    private input: string;

    constructor(input: string) {
        this.input = input;
        this.tokens = tokenize(input);
        this.pos = 0;
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private consume(type?: TokenType): Token {
        const token = this.tokens[this.pos];
        if (type && token.type !== type) {
            throw new Error(`Expected ${type} but got ${token.type} at ${token.start}`);
        }
        this.pos++;
        return token;
    }

    public parse(): Expression {
        const expr = this.parseSequence();
        this.consume(TokenType.EOF); // Ensure all tokens are consumed
        return expr;
    }

    // ; separated
    private parseSequence(): Expression {
        let left = this.parseTransition();
        while (this.pos < this.tokens.length && this.peek().type === TokenType.SEMI) {
            this.consume(TokenType.SEMI);
            if (this.peek().type === TokenType.EOF) break; // Trailing semi-colon

            const right = this.parseTransition();
            left = {
                type: 'SEQUENCE',
                children: left.type === 'SEQUENCE' ? [...left.children, right] : [left, right]
            } as Sequence;
        }
        return left;
    }

    private parseTransition(): Expression {
        return this.parseDelimited(
            () => this.parseAddition(),
            [TokenType.ARROW],
            (left, op, right) => ({ type: 'BINARY_OP', operator: '->', left, right } as BinaryOp)
        );
    }

    private parseAddition(): Expression {
        return this.parseDelimited(
            () => this.parseImplicitSequence(),
            [TokenType.PLUS_PLUS, TokenType.PLUS, TokenType.MINUS],
            (left, op, right) => ({
                type: 'BINARY_OP',
                operator: op.type === TokenType.MINUS ? '-' : (op.type === TokenType.PLUS ? '+' : '++'),
                left,
                right
            } as BinaryOp)
        );
    }

    // Generic helper for left-associative binary ops
    private parseDelimited(
        nextLevel: () => Expression,
        types: TokenType[],
        builder: (left: Expression, op: Token, right: Expression) => Expression
    ): Expression {
        let left = nextLevel();
        while (this.pos < this.tokens.length && types.includes(this.peek().type)) {
            const op = this.consume();
            const right = nextLevel();
            left = builder(left, op, right);
        }
        return left;
    }

    // Implicit space concatenation (e.g. "A B" -> Sequence[A, B])
    private parseImplicitSequence(): Expression {
        const exprs: Expression[] = [];

        do {
            exprs.push(this.parseFactorWithPostfix());
        } while (this.pos < this.tokens.length && this.isStartOfFactor(this.peek()));

        if (exprs.length === 1) return exprs[0];
        return { type: 'SEQUENCE', children: exprs } as Sequence;
    }

    private isStartOfFactor(token: Token): boolean {
        return [TokenType.LPAREN, TokenType.ID, TokenType.NUMBER, TokenType.AT].includes(token.type);
    }

    private parseFactorWithPostfix(): Expression {
        let expr: Expression | undefined;

        // Handle leading @ (Implicit target)
        if (this.peek().type !== TokenType.AT) {
            expr = this.parsePrimary();
        }

        // Attach comment if present immediately after primary (e.g. Ingredient{Comment})
        if (this.pos < this.tokens.length && this.peek().type === TokenType.BRACE_CONTENT) {
            const commentToken = this.consume(TokenType.BRACE_CONTENT);
            (expr as any).comment = commentToken.value;
        }


        while (this.pos < this.tokens.length && this.peek().type === TokenType.AT) {
            this.consume(TokenType.AT); // @

            let nameValue = '';
            const next = this.peek();
            if (next.type === TokenType.ID || next.type === TokenType.NUMBER) {
                nameValue = this.consume().value;
            } else {
                throw new Error(`Expected ID or NUMBER for operation name but got ${next.type} at ${next.start}`);
            }

            // Mock token for adjacency logic
            const nameToken = { value: nameValue, start: next.start };

            const args: (string | number)[] = [];
            let lastTokenEnd = nameToken.start + nameToken.value.length;
            let opComment: string | undefined;

            // Consume adjacent args
            while (this.pos < this.tokens.length) {
                const nextArg = this.peek();
                // Check adjacency
                if (nextArg.start === lastTokenEnd) {
                    if (nextArg.type === TokenType.BRACE_CONTENT) {
                        // {沸騰させない} -> operation comment/caution, not an arg
                        const commentTok = this.consume();
                        opComment = commentTok.value;
                        lastTokenEnd = commentTok.start + commentTok.value.length + 2; // +2 for { }
                    } else if ([TokenType.ID, TokenType.NUMBER, TokenType.MINUS].includes(nextArg.type)) {
                        const argTok = this.consume();
                        args.push(argTok.value);
                        lastTokenEnd = argTok.start + argTok.value.length;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            expr = {
                type: 'OPERATION',
                name: nameToken.value,
                args,
                comment: opComment,
                target: expr
            } as Operation;
        }

        if (!expr) {
            throw new Error(`Unexpected missing expression at ${this.peek().start}`);
        }

        return expr;
    }

    private parsePrimary(): Expression {
        const token = this.peek();

        if (token.type === TokenType.LPAREN) {
            this.consume(TokenType.LPAREN);
            const expr = this.parseSequence(); // Restart hierarchy inside parens
            this.consume(TokenType.RPAREN);
            return { type: 'GROUP', content: expr } as Group;
        }


        if (token.type === TokenType.ID) {
            const nameTok = this.consume(TokenType.ID);
            let qty: number | undefined;
            let unit: string | undefined;
            let lastEnd = nameTok.start + nameTok.value.length;

            // check for attached number (Quantity)
            if (this.pos < this.tokens.length && this.peek().type === TokenType.NUMBER && this.peek().start === lastEnd) {
                const numTok = this.consume(TokenType.NUMBER);

                // Handle fraction? 1/2
                if (numTok.value.includes('/')) {
                    const [n, d] = numTok.value.split('/');
                    qty = parseFloat(n) / parseFloat(d);
                } else {
                    qty = parseFloat(numTok.value);
                }
                lastEnd = numTok.start + numTok.value.length;

                // check for attached unit (ID)
                if (this.pos < this.tokens.length && this.peek().type === TokenType.ID && this.peek().start === lastEnd) {
                    const potentialUnit = this.peek();
                    const nextNext = this.pos + 1 < this.tokens.length ? this.tokens[this.pos + 1] : null;

                    // Improved Unit Detection Logic
                    // 1. Whitelist of known units
                    const knownUnits = [
                        'g', 'mg', 'ml', 'cc', 'kg', 'l', 'cm',
                        '個', '本', '枚', '束', 'かけ', '片', '袋', '缶', 'カップ', '合', '升', '匹', '尾', '切れ', '玉', '房', '株', '腹', 'つまみ',
                        '少々', '適量', '大さじ', '小さじ'
                    ];
                    const isKnownUnit = knownUnits.includes(potentialUnit.value);

                    // 2. Heuristic: If followed by a NUMBER, it is likely a new Ingredient (Name + Qty), NOT a unit.
                    // Unless it's a known unit (e.g. "1個" "1個" -> unit is "個").
                    const followedByNumber = nextNext && nextNext.type === TokenType.NUMBER;


                    if (isKnownUnit || !followedByNumber) {
                        unit = this.consume(TokenType.ID).value;
                        lastEnd += unit.length;
                    }
                }
            }

            return { type: 'INGREDIENT', name: nameTok.value, quantity: qty, unit } as Ingredient;
        }

        if (token.type === TokenType.NUMBER) {
            // Standalone number
            const tok = this.consume(TokenType.NUMBER);
            return { type: 'INGREDIENT', name: tok.value, quantity: parseFloat(tok.value) } as Ingredient;
        }

        throw new Error(`Unexpected token ${token.type} ('${token.value}') at ${token.start}`);
    }
}

export function parseRecipe(input: string): Expression {
    const parser = new Parser(input);
    return parser.parse();
}
