/**
 * Leitner Box System Constants
 * 
 * Box intervals define how long to wait before reviewing a card again.
 * Cards progress through 8 levels, with the final 3 levels being the "Infinity Vault"
 */

export const BOX_INTERVALS_DAYS = [
    1,    // Box 1: Daily review (new/fragile cards)
    2,    // Box 2: Every 2 days
    4,    // Box 3: Every 4 days
    8,    // Box 4: Every 8 days (weekly+)
    16,   // Box 5: Every 16 days (bi-weekly+)
    180,  // Box 6: Every 6 months (VAULT - permanent maintenance)
    365,  // Box 7: Every year (VAULT)
    730,  // Box 8: Every 2 years (VAULT - mastery)
] as const;

export const MIN_BOX_LEVEL = 1;
export const MAX_BOX_LEVEL = 8;
export const VAULT_THRESHOLD = 6; // Level 6+ cards are "vaulted"

export const SMOOTHING_THRESHOLD = 25; // Max cards to show per day
export const SMOOTHING_DELAY_HOURS = 24; // Push overflow cards by 24 hours

/**
 * XP rewards for card reviews
 */
export const XP_REWARDS = {
    SUCCESS: 10,
    HARD: 5,
    FAILURE: 1, // Small reward for trying
    VAULT_BONUS: 50, // Bonus when card reaches vault
} as const;
