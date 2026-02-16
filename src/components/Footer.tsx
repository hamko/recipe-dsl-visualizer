
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <div style={{
            padding: '1rem',
            borderTop: '1px solid #414868',
            color: '#565f89',
            fontSize: '0.8rem',
            textAlign: 'center',
            backgroundColor: '#16161e'
        }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>It is a Recipe DSL Visualizer.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <a href="https://github.com/hamko/recipe-dsl-visualizer" target="_blank" rel="noopener noreferrer" style={{ color: '#7aa2f7' }}>GitHub</a>
                <a href="https://x.com/hamko_intel" target="_blank" rel="noopener noreferrer" style={{ color: '#7aa2f7' }}>X (Twitter)</a>
                <a href="https://home.wakatabe.com/ryo/wiki/index.php?%E3%83%AC%E3%82%B7%E3%83%94" target="_blank" rel="noopener noreferrer" style={{ color: '#7aa2f7' }}>Recipe Wiki</a>
            </div>
        </div>
    );
};
