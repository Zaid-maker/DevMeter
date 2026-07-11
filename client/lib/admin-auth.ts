import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.DEV_ADMIN_SECRET;

/**
 * Gets the active admin secret, with fallback for development
 * @throws {Error} If secret is not configured in production
 */
export function getAdminSecret(): string {
    const isDev = process.env.NODE_ENV === "development";

    if (!ADMIN_SECRET) {
        if (isDev) {
            console.warn("[admin-auth] DEV_ADMIN_SECRET not set; using default dev secret");
            return "dev-secret-123";
        }
        throw new Error("DEV_ADMIN_SECRET is not configured in production environment.");
    }

    return ADMIN_SECRET;
}

/**
 * Validates admin authentication from request header
 * @param req - The incoming request
 * @returns Null if authenticated, NextResponse with error if not
 */
export function validateAdminAuth(req: NextRequest): NextResponse | null {
    const secret = req.headers.get("x-admin-secret");
    const activeSecret = getAdminSecret();

    if (secret !== activeSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
}

/**
 * Validates a number parameter is within acceptable bounds
 */
export function validateNumber(
    value: unknown,
    fieldName: string,
    options: { min?: number; max?: number; required?: boolean } = {}
): number | null {
    if (value === null || value === undefined) {
        if (options.required) {
            throw new Error(`${fieldName} is required`);
        }
        return null;
    }

    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }

    if (options.min !== undefined && num < options.min) {
        throw new Error(`${fieldName} must be at least ${options.min}`);
    }

    if (options.max !== undefined && num > options.max) {
        throw new Error(`${fieldName} must be at most ${options.max}`);
    }

    return num;
}
