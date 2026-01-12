import { differenceInDays, format, startOfDay, subDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

/**
 * Constants for duration calculation
 */
const SESSION_GAP_MS = 15 * 60 * 1000; // 15 minutes
const HEARTBEAT_CREDIT_MS = 2 * 60 * 1000; // 2 minutes credit per session/individual heartbeat
const MAX_HEARTBEAT_DIFF_MS = 5 * 60 * 1000; // Cap consecutive heartbeat differences at 5 mins

/**
 * Compute total active duration in hours from a sequence of heartbeat timestamps.
 *
 * @param heartbeats - Array of heartbeat records where each item has a `timestamp` Date
 * @returns Total duration in hours computed from the provided heartbeats
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
 * Compute the current and longest consecutive-day activity streaks from a set of active day strings.
 *
 * @param activeDaysSet - Set of dates formatted as "yyyy-MM-dd" representing days with activity.
 * @param timezone - IANA timezone name used to determine "today" for the current streak calculation (default: "UTC").
 * @returns An object with `current` and `longest`:
 *   - `current`: length of the ongoing consecutive-day streak ending on today (or yesterday) in the given timezone.
 *   - `longest`: length of the longest consecutive-day streak present in `activeDaysSet`.
 */
export function calculateStreaks(activeDaysSet: Set<string>, timezone: string = "UTC") {
    const sortedDays = Array.from(activeDaysSet).sort();
    if (sortedDays.length === 0) {
        return { current: 0, longest: 0 };
    }

    const dayToUtcDayNumber = (day: string) => {
        // day is "yyyy-MM-dd"
        const [y, m, d] = day.split("-").map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
    };

    let longest = 0;
    let temp = 0;

    // Calculate Longest Streak
    for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
            temp = 1;
        } else {
            const prev = dayToUtcDayNumber(sortedDays[i - 1]);
            const curr = dayToUtcDayNumber(sortedDays[i]);
            if (curr - prev === 1) {
                temp++;
            } else {
                temp = 1;
            }
        }
        longest = Math.max(longest, temp);
    }

    // Calculate Current Streak
    let current = 0;
    const zonedNow = new TZDate(new Date(), timezone);
    const todayStr = format(zonedNow, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(zonedNow, 1), "yyyy-MM-dd");

    if (activeDaysSet.has(todayStr) || activeDaysSet.has(yesterdayStr)) {
        let checkDateZoned = activeDaysSet.has(todayStr) ? zonedNow : subDays(zonedNow, 1);

        while (activeDaysSet.has(format(checkDateZoned, "yyyy-MM-dd"))) {
            current++;
            checkDateZoned = subDays(checkDateZoned, 1);
        }
    }

    return { current, longest };
}