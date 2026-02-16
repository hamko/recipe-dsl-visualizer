
export enum TokenType {
    ID = 'ID',
    NUMBER = 'NUMBER',
    AT = 'AT', // @
    PLUS_PLUS = 'PLUS_PLUS', // ++
    PLUS = 'PLUS', // +
    MINUS = 'MINUS', // -
    ARROW = 'ARROW', // ->
    SEMI = 'SEMI', // ;
    LPAREN = 'LPAREN', // (
    RPAREN = 'RPAREN', // )
    BRACE_CONTENT = 'BRACE_CONTENT', // {content}
    EOF = 'EOF'
}

export interface Token {
    type: TokenType;
    value: string;
    start: number;
}

const RULES: { type: TokenType | null; regex: RegExp }[] = [
    { type: null, regex: /^\s+/ }, // Skip whitespace
    { type: TokenType.BRACE_CONTENT, regex: /^\{.*?\}/ }, // Non-greedy match for {}
    { type: TokenType.LPAREN, regex: /^\(/ },
    { type: TokenType.RPAREN, regex: /^\)/ },
    { type: TokenType.AT, regex: /^@/ },
    { type: TokenType.PLUS_PLUS, regex: /^\+\+/ },
    { type: TokenType.ARROW, regex: /^->/ },
    { type: TokenType.PLUS, regex: /^\+/ }, // Single +
    { type: TokenType.MINUS, regex: /^-/ },
    { type: TokenType.SEMI, regex: /^;/ },
    // Update: Support fractions like 1/2
    { type: TokenType.NUMBER, regex: /^\d+(\.\d+)?(\/\d+)?/ },
    // ID: consume until special char or digit
    // Note: we exclude digits to separate IngredientName from Quantity
    { type: TokenType.ID, regex: /^[^@\+\->;(){}\s\d]+/ },
];

export function tokenize(input: string): Token[] {
    let pos = 0;
    const tokens: Token[] = [];

    while (pos < input.length) {
        let matched = false;
        const currentStr = input.slice(pos);

        for (const rule of RULES) {
            const match = currentStr.match(rule.regex);
            if (match) {
                if (rule.type !== null) {
                    let value = match[0];
                    // Strip braces for BRACE_CONTENT
                    if (rule.type === TokenType.BRACE_CONTENT) {
                        value = value.slice(1, -1);
                    }
                    tokens.push({ type: rule.type, value, start: pos });
                }
                pos += match[0].length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            console.warn(`Unexpected character at ${pos}: ${input[pos]}`);
            pos++;
        }
    }

    tokens.push({ type: TokenType.EOF, value: '', start: pos });
    return tokens;
}
