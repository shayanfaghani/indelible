import { SMOOTHING_THRESHOLD, SMOOTHING_DELAY_HOURS } from "./constants";

export interface Card {
    id: string;
    box_level: number;
    next_review_at: string;
    front: string;
    back: string;
    is_vaulted: boolean;
}

/**
 * Smoothing algorithm to prevent user burnout
 * 
 * If total due cards > 25:
 * 1. Prioritize Box 1 (new/fragile cards)
 * 2. Prioritize Box 6-8 (Vault maintenance)
 * 3. Push remaining middle cards (Box 2-5) by 24 hours
 * 
 * Returns: { cardsToShow, cardsToPush }
 */
export function applySmoothingAlgorithm(dueCards: Card[]): {
    cardsToShow: Card[];
    cardsToPush: Card[];
} {
    // If under threshold, show all cards
    if (dueCards.length <= SMOOTHING_THRESHOLD) {
        return {
            cardsToShow: dueCards,
            cardsToPush: [],
        };
    }

    // Separate cards by priority
    const box1Cards = dueCards.filter((c) => c.box_level === 1);
    const vaultCards = dueCards.filter((c) => c.box_level >= 6);
    const middleCards = dueCards.filter(
        (c) => c.box_level >= 2 && c.box_level <= 5
    );

    // Priority 1: All Box 1 cards (fragile, need attention)
    const cardsToShow: Card[] = [...box1Cards];

    // Priority 2: Vault cards (permanent maintenance)
    cardsToShow.push(...vaultCards);

    // Fill remaining slots with middle cards
    const remainingSlots = SMOOTHING_THRESHOLD - cardsToShow.length;
    if (remainingSlots > 0) {
        cardsToShow.push(...middleCards.slice(0, remainingSlots));
    }

    // Cards to push by 24 hours
    const cardsToPush = middleCards.slice(remainingSlots > 0 ? remainingSlots : 0);

    return { cardsToShow, cardsToPush };
}

/**
 * Calculate new review time after pushing a card
 */
export function pushCardReview(currentReviewTime: string): Date {
    const newReviewTime = new Date(currentReviewTime);
    newReviewTime.setHours(newReviewTime.getHours() + SMOOTHING_DELAY_HOURS);
    return newReviewTime;
}

/**
 * Get cards that are due for review (before or at current time)
 */
export function getDueCards(allCards: Card[]): Card[] {
    const now = new Date();
    return allCards.filter((card) => new Date(card.next_review_at) <= now);
}
