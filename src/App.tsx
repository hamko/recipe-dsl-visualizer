
import React, { useState, useEffect } from 'react';
import './App.css';
import { rawRecipesMarkdown } from './data/rawRecipes';
import { parseMarkdownTable, RecipeRow } from './utils/mdParser';
import { parseRecipe } from './dsl/parser';
import { Expression } from './dsl/types';
import RecipeVisualizer from './components/RecipeVisualizer';

import { IngredientsView } from './components/IngredientsView';
import { OperationsView } from './components/OperationsView';

import { AIGenerator } from './components/AIGenerator';

function App() {
    const [recipes, setRecipes] = useState<RecipeRow[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeRow | null>(null);
    const [inputText, setInputText] = useState('');
    const [ast, setAst] = useState<Expression | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'visualizer' | 'ingredients' | 'operations'>('visualizer');
    const [showAI, setShowAI] = useState(false);


    const [filterText, setFilterText] = useState('');
    const [minRating, setMinRating] = useState(0);

    // Heuristic rating
    const getRating = (comment: string): number => {
        if (comment.includes('つまぴが好き')) return 5;
        if (comment.includes('おいしい') || comment.includes('美味しい')) return 4;
        if (comment.includes('おいしくない') || comment.includes('美味しくない') || comment.includes('微妙')) return 2;
        return 3;
    };

    useEffect(() => {
        const list = parseMarkdownTable(rawRecipesMarkdown);
        setRecipes(list);
        if (list.length > 0) {
            handleSelectRecipe(list[0]);
        }
    }, []);

    const filteredRecipes = recipes.filter(r => {
        if (minRating > 0) {
            const rating = getRating(r.comment);
            if (rating < minRating) return false;
        }

        if (!filterText) return true;
        // Partial fuzzy search: "みしラ" matches "みたらし豚バラ"
        const chars = filterText.split('');
        let lastIndex = -1;
        const target = r.title;
        for (const char of chars) {
            const index = target.indexOf(char, lastIndex + 1);
            if (index === -1) return false;
            lastIndex = index;
        }
        return true;
    });

    useEffect(() => {
        if (!inputText.trim()) {
            setAst(null);
            setError(null);
            return;
        }

        // Simple debounce or immediate? Immediate for now.
        try {
            const result = parseRecipe(inputText);
            setAst(result);
            setError(null);
        } catch (e: any) {
            setError(e.message);
            // setAst(null); // Keep previous AST if possible? No, confusing.
        }
    }, [inputText]);

    const handleSelectRecipe = (row: RecipeRow) => {
        setSelectedRecipe(row);
        setInputText(row.recipe);
    };

    return (
        <div className="app-container">
            <div className="sidebar">
                <h2 className="title" style={{ paddingLeft: '0.5rem' }}>Recipe DSL</h2>
                <input
                    type="text"
                    placeholder="Search..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{
                        margin: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#16161e',
                        border: '1px solid #414868',
                        color: '#c0caf5',
                        borderRadius: '4px'
                    }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', margin: '0 0.5rem' }}>
                    {[0, 3, 4, 5].map(r => (
                        <button
                            key={r}
                            onClick={() => setMinRating(r)}
                            style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                backgroundColor: minRating === r ? '#7aa2f7' : '#24283b',
                                color: minRating === r ? '#1a1b26' : '#a9b1d6',
                                border: '1px solid #414868'
                            }}
                        >
                            {r === 0 ? 'All' : `★${r}+`}
                        </button>
                    ))}
                </div>


                <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem', color: '#565f89', fontSize: '0.8rem' }}>
                    {filteredRecipes.length} recipes found
                </div>
                <ul>
                    {filteredRecipes.slice(0, 25).map((r, i) => (
                        <li
                            key={i}
                            className={selectedRecipe === r ? 'active' : ''}
                            onClick={() => handleSelectRecipe(r)}
                            title={r.title}
                        >
                            {r.title}
                        </li>
                    ))}
                    {filteredRecipes.length > 25 && (
                        <li style={{ fontStyle: 'italic', opacity: 0.7, cursor: 'default', color: '#565f89', padding: '0.5rem' }}>
                            (あと {filteredRecipes.length - 25} 件省略されています)
                        </li>
                    )}
                </ul>
            </div>
            <div className="main-content">
                <div className="editor-section">
                    <h2>
                        {selectedRecipe?.title || 'Editor'}
                        {selectedRecipe?.comment && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '1rem', color: '#9ece6a' }}>{selectedRecipe.comment}</span>}
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <button
                            onClick={() => setShowAI(!showAI)}
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#414868', color: '#c0caf5' }}
                        >
                            {showAI ? 'Hide AI Generator' : 'Show AI Generator'}
                        </button>
                        {showAI && <AIGenerator onGenerate={(dsl: string) => setInputText(dsl)} />}
                    </div>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter recipe DSL..."
                        spellCheck={false}
                    />
                    {error && <div className="error-message">Error: {error}</div>}
                </div>

                <div className="tab-header" style={{ display: 'flex', borderBottom: '1px solid #414868', marginBottom: '1rem' }}>
                    {['visualizer', 'ingredients', 'operations'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            style={{
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab ? 'bold' : 'normal',
                                color: activeTab === tab ? '#7aa2f7' : '#565f89',
                                borderBottom: activeTab === tab ? '2px solid #7aa2f7' : 'none'
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </div>
                    ))}
                </div>

                <div className="visualizer-content" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                    {activeTab === 'visualizer' && (
                        ast ? <RecipeVisualizer data={ast} /> : <div style={{ color: '#565f89' }}>Visualizer output will appear here...</div>
                    )}
                    {activeTab === 'ingredients' && ast && <IngredientsView ast={ast} />}
                    {activeTab === 'operations' && ast && <OperationsView ast={ast} />}
                </div>
            </div>
        </div>
    );
}

export default App;
