
import React, { useState } from 'react';

interface Props {
    onGenerate: (dsl: string) => void;
}

const SYSTEM_PROMPT = `
You are a helper that converts natural language cooking recipes into a specific DSL.
The DSL format rules:
1. Ingredients: Name + Quantity (e.g., 豚バラ500, 水1.5合分).
2. Operations: @OperationName + Args (e.g., @SauteL5, @Cut-1-1).
3. Grouping: ( ... ) for applying operations to multiple items.
4. Combination: ++ to combine streams.
5. Transition: -> is implicit or can be explicit.
6. Sequence: separated by space or semicolon.
7. Comments: {Comment} attached to items or descriptions in the recipe table |Title|DSL|Description|.

Examples:
Input: "Cut 500g pork belly into chunks. Saute with weak fire for 5 mins."
Output: 豚バラ500@Cut@SauteL5

Input: "Mix 3 eggs and salt, then fry."
Output: (卵3個 塩)@Mix@Fry

Output ONLY the DSL string. No markdown code blocks.
`;

export const AIGenerator: React.FC<Props> = ({ onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!apiKey) {
            setError('API Key is required');
            return;
        }

        setLoading(true);
        setError(null);
        localStorage.setItem('openai_api_key', apiKey);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to generate');
            }

            const content = data.choices[0]?.message?.content?.trim();
            if (content) {
                onGenerate(content);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1rem', backgroundColor: '#1a1b26', borderBottom: '1px solid #414868' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>AI Recipe Generator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                    type="password"
                    placeholder="OpenAI API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #414868', backgroundColor: '#24283b', color: '#c0caf5' }}
                />
                <textarea
                    placeholder="Paste recipe text here (e.g. 'Boil pasta for 10 mins, then mix with sauce')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #414868', backgroundColor: '#24283b', color: '#c0caf5', resize: 'vertical' }}
                />
                {error && <div style={{ color: '#f7768e', fontSize: '0.9rem' }}>{error}</div>}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    style={{
                        backgroundColor: loading ? '#414868' : '#7aa2f7',
                        color: '#1a1b26',
                        cursor: loading ? 'wait' : 'pointer'
                    }}
                >
                    {loading ? 'Generating...' : 'Generate DSL'}
                </button>
            </div>
        </div>
    );
};
