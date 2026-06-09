import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export type Theme = "light" | "dark" | "system";
export type IngredientSource = "manual" | "receipt" | "fridge_photo";
export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeSource = "manual" | "ai_recipe";

export type StoredUser = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
};

export type StoredUserSettings = {
    warningDay: number;
    notificationEnabled: boolean;
    theme: Theme;
};

export type StoredIngredient = {
    id: string;
    userId: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    deadline: string | null;
    source: IngredientSource;
    createdAt: string;
    updatedAt: string;
};

export type RecipeContent = {
    description?: string | null;
    servings?: number | null;
    cookingTimeMinutes?: number | null;
    difficulty?: RecipeDifficulty | null;
    ingredients: Array<{
        name: string;
        quantity?: number | string | null;
        unit?: string | null;
        note?: string | null;
    }>;
    steps: Array<{
        order: number;
        description: string;
        tip?: string | null;
    }>;
    tags?: string[] | null;
};

export type StoredRecipe = {
    id: string;
    userId: string;
    name: string;
    content: RecipeContent;
    source: RecipeSource;
    createdAt: string;
    updatedAt: string;
};

export type UsedIngredient = {
    name: string;
    quantity: number | string | null;
    unit: string | null;
};

export type StoredCookingLog = {
    id: string;
    userId: string;
    recipeId: string | null;
    name: string;
    source: RecipeSource;
    usedIngredients: UsedIngredient[];
    cookedAt: string;
    createdAt: string;
};

export type PasswordResetToken = {
    token: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    usedAt: string | null;
};

export const DEFAULT_SETTINGS: StoredUserSettings = {
    warningDay: 3,
    notificationEnabled: true,
    theme: "system",
};

export const SESSION_COOKIE_NAME = "next-auth.session-token";
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_RATE_LIMIT_MS = 5 * 60 * 1000;

export function createId(): string {
    return randomUUID();
}

export function nowIso(): string {
    return new Date().toISOString();
}

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function rowToUser(row: Record<string, unknown>): StoredUser {
    return {
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        passwordHash: row.password as string,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
    };
}

export function rowToIngredient(row: Record<string, unknown>): StoredIngredient {
    const deadline = row.deadline as Date | string | null;
    return {
        id: row.id as string,
        userId: row.user_id as string,
        name: row.name as string,
        quantity: row.quantity !== null ? Number(row.quantity) : null,
        unit: row.unit as string | null,
        deadline: deadline
            ? typeof deadline === "string"
                ? deadline.slice(0, 10)
                : [
                    deadline.getFullYear(),
                    String(deadline.getMonth() + 1).padStart(2, "0"),
                    String(deadline.getDate()).padStart(2, "0"),
                  ].join("-")
            : null,
        source: row.source as IngredientSource,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
    };
}

export function rowToRecipe(row: Record<string, unknown>): StoredRecipe {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        name: row.name as string,
        content: row.content as RecipeContent,
        source: "manual",
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
    };
}

export function rowToCookingLog(row: Record<string, unknown>): StoredCookingLog {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        recipeId: row.recepi_id as string | null,
        name: row.name as string,
        source: "manual",
        usedIngredients: row.used_ingredients as UsedIngredient[],
        cookedAt: (row.created_at as Date).toISOString(),
        createdAt: (row.created_at as Date).toISOString(),
    };
}
