/**
 * Gamification utility for DevMeter
 * XP is awarded for coding activity.
 */

// XP Constants
export const XP_PER_HEARTBEAT = 10; // Base XP for each heartbeat received (every 2 mins)
export const XP_PER_LEVEL_BASE = 1000; // XP needed for Level 2
export const XP_LEVEL_MULTIPLIER = 1.15; // Each level requires 15% more XP than the last

/**
 * Calculate the total XP required for a specific level
 * Formula: BASE * (MULTIPLIER ^ (level - 1))
 */
export function getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, level - 2));
}

/**
 * Calculate the cumulative XP required to reach a specific level
 */
export function getCumulativeXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) {
        total += getXPForLevel(i);
    }
    return total;
}

/**
 * Determine the level based on total XP
 */
export function getLevelFromXP(xp: number): number {
    let level = 1;
    let requiredXP = getXPForLevel(level + 1);

    while (xp >= requiredXP) {
        xp -= requiredXP;
        level++;
        requiredXP = getXPForLevel(level + 1);

        // Safety break to prevent infinite loops if logic fails
        if (level > 1000) break;
    }

    return level;
}

/**
 * Calculate the progress (0-100) within the current level
 */
export function getXPLvlProgress(xp: number): { currentLevelXp: number, nextLevelXp: number, progress: number } {
    const level = getLevelFromXP(xp);
    const cumulativeXpForCurrent = getCumulativeXPForLevel(level);
    const cumulativeXpForNext = getCumulativeXPForLevel(level + 1);

    const xpInThisLevel = xp - cumulativeXpForCurrent;
    const totalXpForThisLevel = cumulativeXpForNext - cumulativeXpForCurrent;

    return {
        currentLevelXp: Math.max(0, xpInThisLevel),
        nextLevelXp: totalXpForThisLevel,
        progress: Math.min(100, Math.max(0, (xpInThisLevel / totalXpForThisLevel) * 100))
    };
}
