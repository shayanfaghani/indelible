import {
    BOX_INTERVALS_DAYS,
    MIN_BOX_LEVEL,
    MAX_BOX_LEVEL,
    VAULT_THRESHOLD,
} from "./constants";

/**
 * Calculate the next review timestamp based on box level
 */
export function calculateNextReview(boxLevel: number): Date {
    const clampedLevel = Math.max(MIN_BOX_LEVEL, Math.min(MAX_BOX_LEVEL, boxLevel));
    const daysToAdd = BOX_INTERVALS_DAYS[clampedLevel - 1];

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    return nextReview;
}

/**
 * Handle successful card review
 * Increases box level by 1 (max 8)
 */
export function handleSuccess(currentLevel: number): number {
    return Math.min(currentLevel + 1, MAX_BOX_LEVEL);
}

/**
 * Handle failed card review
 * Decreases box level by 2 (min 1) - soft landing
 */
export function handleFailure(currentLevel: number): number {
    return Math.max(currentLevel - 2, MIN_BOX_LEVEL);
}

/**
 * Handle "hard" card review
 * Keeps the card at the same level for reinforcement
 */
export function handleHard(currentLevel: number): number {
    return currentLevel;
}

/**
 * Check if a card should be marked as "vaulted"
 */
export function shouldVault(boxLevel: number): boolean {
    return boxLevel >= VAULT_THRESHOLD;
}

/**
 * Check if a card is newly vaulted (just reached level 6)
 */
export function isNewlyVaulted(oldLevel: number, newLevel: number): boolean {
    return oldLevel < VAULT_THRESHOLD && newLevel >= VAULT_THRESHOLD;
}

/**
 * Calculate XP gain based on review result
 */
export function calculateXP(
    result: "success" | "hard" | "failure",
    isVaulting: boolean
): number {
    const baseXP = {
        success: 10,
        hard: 5,
        failure: 1,
    }[result];

    const vaultBonus = isVaulting ? 50 : 0;

    return baseXP + vaultBonus;
}
