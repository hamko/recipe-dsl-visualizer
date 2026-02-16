#!/usr/bin/env python3
"""Extract recipes from initial.txt wiki table format into rawRecipes.ts"""
import re
import sys
import os

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(script_dir)
    input_path = os.path.join(root, 'initial.txt')
    output_path = os.path.join(root, 'src', 'data', 'rawRecipes.ts')

    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    skip_titles = {'名前', '調理', '料理', 'h', '表すもの', '省略', '備考'}
    # Titles from abbreviation/grammar reference tables
    abbreviation_titles = {
        '豚肉', '牛肉', '肉', '魚', 'マグロ', '鯛', 'きのこ', '小麦粉', '片栗粉',
        '砂糖', '酢', '塩', '醤油', 'みりん', '日本酒', '昆布', 'かつお節',
        '干し椎茸', 'わさび', '生姜', 'レモン', 'ゆず', '胡椒', '玉ねぎ',
        'にんじん', 'にんにく', 'セロリ', 'トマト', 'じゃがいも', 'ワイン',
        '牛乳', 'バター', '味噌', 'ローリエ', 'バジル', '卵', '油', '水',
        'ソテー', '圧力鍋', '切る', '漉す', '電子レンジにかける',
    }
    recipes = []
    seen = set()

    for line in lines:
        line = line.rstrip('\n')
        # Match wiki table: |title|recipe|comment|
        m = re.match(r'^\|([^|]+)\|([^|]*)\|([^|]*)\|?$', line)
        if not m:
            continue
        title = m.group(1).strip()
        recipe = m.group(2).strip()
        comment = m.group(3).strip()

        if title in skip_titles:
            continue
        if title in abbreviation_titles:
            continue
        if not recipe:
            continue
        # Skip pure URLs
        if recipe.startswith('http'):
            continue
        # Skip if title starts with [[  (wiki links as title)
        if title.startswith('[['):
            # extract title from [[title>url]]
            link_m = re.match(r'\[\[([^>]+)>', title)
            if link_m:
                title = link_m.group(1)
            else:
                continue

        recipes.append((title, recipe, comment))

    # Build TS content
    lines_out = ['export const rawRecipesMarkdown = `']
    for title, recipe, comment in recipes:
        # Escape backticks in recipe/comment
        recipe_esc = recipe.replace('`', '\\`').replace('${', '\\${')
        comment_esc = comment.replace('`', '\\`').replace('${', '\\${')
        title_esc = title.replace('`', '\\`').replace('${', '\\${')
        lines_out.append(f'|{title_esc}|{recipe_esc}|{comment_esc}|')
    lines_out.append('`;')
    lines_out.append('')

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines_out))

    print(f'Extracted {len(recipes)} recipes to {output_path}')

if __name__ == '__main__':
    main()
