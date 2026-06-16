interface Card {
    id: string;
    front: string;
    box_level: number;
}

export interface DuplicateGroup {
    front: string;
    keepId: string;
    deleteIds: string[];
}

export function findDuplicates(cards: Card[]): {
    groups: DuplicateGroup[];
    allDeleteIds: string[];
} {
    const grouped = new Map<string, Card[]>();

    for (const card of cards) {
        const key = card.front.toLowerCase().trim();
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(card);
    }

    const groups: DuplicateGroup[] = [];

    for (const group of Array.from(grouped.values())) {
        if (group.length <= 1) continue;
        // Keep highest box_level (most learned); order within ties is stable
        const sorted = [...group].sort((a, b) => b.box_level - a.box_level);
        groups.push({
            front: sorted[0].front,
            keepId: sorted[0].id,
            deleteIds: sorted.slice(1).map((c) => c.id),
        });
    }

    return { groups, allDeleteIds: groups.flatMap((g) => g.deleteIds) };
}
