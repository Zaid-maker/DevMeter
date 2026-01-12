import { differenceInDays, format, startOfDay, subDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

/**
 * Constants for duration calculation
 */
const SESSION_GAP_MS = 15 * 60 * 1000; // 15 minutes
const HEARTBEAT_CREDIT_MS = 2 * 60 * 1000; // 2 minutes credit per session/individual heartbeat
const MAX_HEARTBEAT_DIFF_MS = 5 * 60 * 1000; // Cap consecutive heartbeat differences at 5 mins

/**
 * Calculates total duration in hours from a list of heartbeats.
 * Uses a gap-based algorithm to group heartbeats into sessions.
 */
export function calculateDuration(heartbeats: { timestamp: Date }[]): number {
    if (heartbeats.length === 0) return 0;

    // Ensure heartbeats are sorted by time
    const sorted = [...heartbeats].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let totalMs = 0;
    let lastTime = new Date(sorted[0].timestamp).getTime();

    // First heartbeat always gets the base credit
    totalMs += HEARTBEAT_CREDIT_MS;

    for (let i = 1; i < sorted.length; i++) {
        const currentTime = new Date(sorted[i].timestamp).getTime();
        const diff = currentTime - lastTime;

        if (diff <= 0) continue; // Skip duplicates or out-of-order errors

        if (diff < SESSION_GAP_MS) {
            // Part of the same session
            // Cap the added time to avoid overcounting if user steps away
            totalMs += Math.min(diff, MAX_HEARTBEAT_DIFF_MS);
        } else {
            // New session starts
            totalMs += HEARTBEAT_CREDIT_MS;
        }
        lastTime = currentTime;
    }

    return totalMs / (1000 * 60 * 60);
}

/**
 * Calculates current and longest streaks from a set of active days.
 */
export function calculateStreaks(activeDaysSet: Set<string>, timezone: string = "UTC") {
    const sortedDays = Array.from(activeDaysSet).sort();
    if (sortedDays.length === 0) {
        return { current: 0, longest: 0 };
    }

    let longest = 0;
    let temp = 0;

    // Calculate Longest Streak
    for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
            temp = 1;
        } else {
            const prevDate = new Date(sortedDays[i - 1]);
            const currDate = new Date(sortedDays[i]);
            // Use differenceInDays for more robust day-diff check
            if (differenceInDays(currDate, prevDate) === 1) {
                temp++;
            } else {
                temp = 1;
            }
        }
        longest = Math.max(longest, temp);
    }

    // Calculate Current Streak
    let current = 0;
    const now = new Date();
    const todayStr = format(new TZDate(now, timezone), "yyyy-MM-dd");
    const yesterdayStr = format(new TZDate(subDays(now, 1), timezone), "yyyy-MM-dd");

    if (activeDaysSet.has(todayStr) || activeDaysSet.has(yesterdayStr)) {
        let checkDate = activeDaysSet.has(todayStr) ? now : subDays(now, 1);
        let checkDateZoned = new TZDate(checkDate, timezone);

        while (activeDaysSet.has(format(checkDateZoned, "yyyy-MM-dd"))) {
            current++;
            checkDateZoned = new TZDate(subDays(checkDateZoned, 1), timezone);
        }
    }

    return { current, longest };
}
