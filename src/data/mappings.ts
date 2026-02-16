
export const ingredientMap: { [key: string]: { name: string, image?: string } } = {
    "豚バラ": { name: "豚バラ肉", image: "https://example.com/pork_belly.jpg" },
    "卵": { name: "鶏卵", image: "" },
    // Add more mappings as needed or use a fallback
};

export const operationMap: { [key: string]: { label: string, unit?: string } } = {
    "Saute": { label: "炒める", unit: "分" },
    "SauteL": { label: "弱火で炒める", unit: "分" },
    "SauteH": { label: "強火で炒める", unit: "分" },
    "Boil": { label: "茹でる", unit: "分" },
    "BoilL": { label: "弱火で煮る", unit: "分" },
    "BoilH": { label: "強火で煮る", unit: "分" },
    "Grind": { label: "挽く/すりおろす" },
    "Chop": { label: "みじん切り" },
    "Cut": { label: "切る" },
    "Microwave": { label: "電子レンジ", unit: "分" },
    "Oven": { label: "オーブン", unit: "分" }, // Usually Temp-Time e.g. 180-20
    "Wait": { label: "置く", unit: "分" },
    "Mix": { label: "混ぜる" },
    "Peel": { label: "皮をむく" },
    "Process": { label: "フードプロセッサー" },
    "RiceCook": { label: "炊飯" },
    "Kneed": { label: "こねる" }, // Typo in source often "Kneed" -> Knead
    "Proof": { label: "発酵" },
    "Bake": { label: "焼く" },
    "Fry": { label: "揚げる" },
    "DeepFry": { label: "揚げる" },
    "Toast": { label: "焼く" },
    "Steam": { label: "蒸す" },
    "Pressure": { label: "圧力鍋", unit: "分" },
    "Refridgerator": { label: "冷蔵庫" },
};


export function formatOperation(name: string, args: (string | number)[]): string {
    const op = operationMap[name] || { label: name, unit: "" };
    let label = op.label;

    if (args.length === 0) return label;

    const argsStr = args.join('');

    // Pattern: "Temp-Time" (e.g. 180-20) for Oven/Bake/DeepFry
    if ((name.includes('Oven') || name.includes('Bake') || name.includes('DeepFry') || name.includes('Fry') || name.includes('Saute')) && argsStr.includes('-')) {
        const parts = argsStr.split('-');
        if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            // Assuming Temp-Time. But for Saute, it might be range? Or Time-Time?
            // User said "Oven180-5 -> 180度5分".
            return `${label} ${parts[0]}度 ${parts[1]}分`;
        }
    }

    // Pattern: Just a number => Time/Unit
    if (args.length === 1 && !isNaN(Number(args[0]))) {
        return `${label} ${args[0]}${op.unit || ''}`;
    }

    // Join adjacent number and unit (User said "1" "day" -> "1day")
    const formattedArgs: string[] = [];
    for (let i = 0; i < args.length; i++) {
        const current = String(args[i]);
        const next = i + 1 < args.length ? String(args[i + 1]) : null;

        const isNum = !isNaN(Number(current));
        // Heuristic: next is likely a unit if it's short alpha string, OR if it is "-", handle range or ratio?
        // Wait, "-" handling is complex in loop.

        if (current === '-') {
            formattedArgs.push('-'); // Space around dash?
            continue;
        }

        const nextIsUnit = next && /^[a-zA-Z%]+$/.test(next) && next.length < 10;

        if (isNum) {
            if (nextIsUnit) {
                formattedArgs.push(`${current}${next}`);
                i++; // Skip next
            } else if (op.unit && (i === args.length - 1 || args[i + 1] === '-')) {
                // Apply default unit if last arg, or if followed by dash? No, user says "SauteL5" -> "5分".
                formattedArgs.push(`${current}${op.unit}`);
            } else {
                formattedArgs.push(current);
            }
        } else {
            formattedArgs.push(current);
        }
    }

    return `${label} ${formattedArgs.join(' ')}`;
}

export function formatIngredient(name: string, qty?: number, unit?: string): string {
    // User request: "5とあるが具材は5g(全部gで統一)"
    const formattedQty = qty !== undefined ? qty : '';
    // If unit is missing and qty exists, default to 'g'
    const formattedUnit = unit ? unit : (qty !== undefined ? 'g' : '');

    // Check ingredient mapping for display name?
    const mapped = ingredientMap[name];
    const displayName = mapped ? mapped.name : name;

    return `${displayName} ${formattedQty}${formattedUnit}`.trim();
}

export function getIngredientImage(name: string): string | undefined {
    return ingredientMap[name]?.image;
}
