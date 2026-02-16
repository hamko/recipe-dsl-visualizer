
import React, { useState } from 'react';

interface Props {
    onGenerate: (dsl: string) => void;
}

const SYSTEM_PROMPT = `あなたは自然言語の料理レシピをDSL（ドメイン固有言語）に変換するアシスタントです。
以下のDSLフォーマットに従ってください：

1. 材料: 名前 + 数量（例: 豚バラ500, 水1.5合分）
2. 操作: @操作名 + 引数（例: @SauteL5 = 弱火で5分炒める, @Oven180-5 = 180度5分オーブン, @Cut = 切る）
3. グループ化: ( ... ) で複数の材料に操作を適用
4. 投入: ++ はAを作ってからBを投入する（時間的順序）
5. 遷移: -> は次の工程へ
6. 並列: スペース区切りは同時に使う材料
7. コメント: {コメント} を付随情報に使う

操作一覧:
- @Saute/@SauteL/@SauteH = 炒める（弱火/強火）
- @Boil/@BoilL/@BoilH = 茹でる/煮る
- @Cut = 切る, @Chop = みじん切り, @Slice = スライス
- @Grind = すりおろす, @Mix = 混ぜる
- @Oven = オーブン, @Microwave = 電子レンジ
- @Wait = 置く/寝かせる, @RiceCook = 炊飯
- @Fry/@DeepFry = 揚げる, @Steam = 蒸す
- @Pressure = 圧力鍋, @Refridgerator = 冷蔵庫

例:
入力: 「豚バラ500gを一口大に切って弱火で5分炒め、そこに玉ねぎ1個をスライスして加える」
出力: 豚バラ500@Cut@SauteL5 ++ 玉ねぎ1個@Slice

入力: 「卵3個と塩を混ぜて焼く」
出力: (卵3個 塩)@Mix@Fry

DSL文字列のみ出力してください。マークダウンのコードブロックは使わないでください。`;

export const AIGenerator: React.FC<Props> = ({ onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!apiKey) {
            setError('Gemini API Keyを入力してください');
            return;
        }

        setLoading(true);
        setError(null);
        localStorage.setItem('gemini_api_key', apiKey);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{ text: SYSTEM_PROMPT }]
                        },
                        contents: [
                            {
                                parts: [{ text: prompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.2
                        }
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || '生成に失敗しました');
            }

            const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (content) {
                onGenerate(content);
            } else {
                throw new Error('レスポンスが空でした');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1rem', backgroundColor: '#1a1b26', borderBottom: '1px solid #414868' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>AI レシピDSLジェネレーター</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                    type="password"
                    placeholder="Gemini API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #414868', backgroundColor: '#24283b', color: '#c0caf5' }}
                />
                <textarea
                    placeholder="レシピテキストをここに貼り付けてください（例：豚バラ500gを弱火で5分炒めて、そこに玉ねぎを加える）"
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
                        cursor: loading ? 'wait' : 'pointer',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? '生成中...' : 'DSLを生成'}
                </button>
            </div>
        </div>
    );
};
