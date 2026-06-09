/**
 * Base API client with fetch wrapper, error handling, and auth support
 */

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const isErrorResponse = (data: unknown): data is ApiErrorResponse => {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!obj.error || typeof obj.error !== "object") return false;
  const error = obj.error as Record<string, unknown>;
  return typeof error.code === "string" && typeof error.message === "string";
};

/**
 * Base fetch wrapper with error handling and automatic JSON parsing.
 * Automatically unwraps `{ data: T }` response envelopes.
 */
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit & { baseUrl?: string }
): Promise<T> {
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        "PARSE_ERROR",
        response.status,
        `Failed to parse response: ${response.statusText}`
      );
    }
    throw new ApiError("PARSE_ERROR", 200, "Invalid JSON response");
  }

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new ApiError(data.error.code, response.status, data.error.message);
    }
    throw new ApiError(
      "UNKNOWN_ERROR",
      response.status,
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  if (isErrorResponse(data)) {
    throw new ApiError(data.error.code, 200, data.error.message);
  }

  if (data && typeof data === "object" && "data" in data) {
    const typedData = data as { data: T };
    return typedData.data;
  }
  return data as T;
}

// ============================================================================
// Auth API
// ============================================================================

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  user: User;
}

export const authApi = {
  signup: async (input: SignupInput) => {
    const user = await apiCall<User>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { user } as Session;
  },

  login: async (input: LoginInput) => {
    const user = await apiCall<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { user } as Session;
  },

  logout: () =>
    apiCall<void>("/api/auth/logout", {
      method: "POST",
    }),

  getSession: async () => {
    const user = await apiCall<User>("/api/me", { method: "GET" }).catch(() => null);
    if (!user) return null;
    return { user } as Session;
  },

  requestPasswordReset: (email: string) =>
    apiCall<void>("/api/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiCall<void>("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ token, newPassword }),
    }),
};

// ============================================================================
// User API
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface UserSettings {
  warningDay: number;
  notificationEnabled: boolean;
  theme: "light" | "dark" | "system";
}

export const userApi = {
  getProfile: () =>
    apiCall<UserProfile>("/api/me", {
      method: "GET",
    }),

  updateProfile: (data: Partial<Pick<UserProfile, "name" | "email">>) =>
    apiCall<UserProfile>("/api/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProfile: (password: string) =>
    apiCall<void>("/api/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),

  getSettings: () =>
    apiCall<UserSettings>("/api/me/settings", {
      method: "GET",
    }),

  updateSettings: (data: Partial<UserSettings>) =>
    apiCall<UserSettings>("/api/me/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// Ingredients API
// ============================================================================

export interface Ingredient {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  deadline: string | null;
  source: "manual" | "receipt" | "fridge_photo";
  createdAt: string;
  updatedAt: string;
}

export interface IngredientCreate {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  deadline?: string | null;
  source: "manual" | "receipt" | "fridge_photo";
}

export interface AnalyzedIngredient {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  estimatedExpiryDate?: string | null;
  confidence?: number | null;
}

export const ingredientsApi = {
  list: (params?: {
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    expiringWithinDays?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.sort) query.append("sort", params.sort);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.expiringWithinDays !== undefined)
      query.append("expiringWithinDays", params.expiringWithinDays.toString());

    return apiCall<Ingredient[]>(
      `/api/ingredients?${query.toString()}`,
      { method: "GET" }
    );
  },

  create: (items: IngredientCreate[]) =>
    apiCall<{ insertedCount: number; ingredients: Ingredient[] }>("/api/ingredients", {
      method: "POST",
      body: JSON.stringify({ ingredients: items }),
    }),

  get: (id: string) =>
    apiCall<Ingredient>(`/api/ingredients/${id}`, {
      method: "GET",
    }),

  update: (id: string, data: Partial<Omit<IngredientCreate, "source">>) =>
    apiCall<Ingredient>(`/api/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<void>(`/api/ingredients/${id}`, {
      method: "DELETE",
    }),

  analyzeReceipt: async (file: File): Promise<{ rawText: string; ingredients: AnalyzedIngredient[] }> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/ingredients/analyze-receipt", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const message = data?.error?.message ?? `HTTP ${response.status}`;
      throw new ApiError(data?.error?.code ?? "UNKNOWN_ERROR", response.status, message);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new ApiError("PARSE_ERROR", 200, "No response body");
    const decoder = new TextDecoder();
    let buffer = "";
    let rawText = "";
    let ingredients: AnalyzedIngredient[] = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") rawText = event.rawText;
            else if (event.type === "ingredients") ingredients = event.ingredients;
            else if (event.type === "error") throw new ApiError("INTERNAL_ERROR", 500, event.message);
          } catch (e) {
            if (e instanceof ApiError) throw e;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    return { rawText, ingredients };
  },

  analyzeFridge: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiCall<{ ingredients: AnalyzedIngredient[] }>("/api/ingredients/analyze-fridge", {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
};

// ============================================================================
// Recipes API
// ============================================================================

export interface RecipeContent {
  description?: string | null;
  servings?: number | null;
  cookingTimeMinutes?: number | null;
  difficulty?: "easy" | "medium" | "hard" | null;
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
}

export interface Recipe {
  id: string;
  name: string;
  content: RecipeContent;
  cookCount: number;
  lastCookedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeCreateInput {
  name: string;
  content: RecipeContent;
}

export const recipesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.sort) query.append("sort", params.sort);

    return apiCall<Recipe[]>(
      `/api/recipes?${query.toString()}`,
      { method: "GET" }
    );
  },

  create: (data: RecipeCreateInput) =>
    apiCall<Recipe>("/api/recipes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    apiCall<Recipe>(`/api/recipes/${id}`, {
      method: "GET",
    }),

  update: (id: string, data: RecipeCreateInput) =>
    apiCall<Recipe>(`/api/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<void>(`/api/recipes/${id}`, {
      method: "DELETE",
    }),

  getHistory: (id: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    return apiCall<CookingLog[]>(`/api/recipes/${id}/history?${query.toString()}`, {
      method: "GET",
    });
  },

  aiGenerate: async (params: {
    ingredientIds: string[];
    preferences?: string;
    servings?: number;
    dishCount?: number;
    strictIngredients?: boolean;
  }): Promise<RecipeContent[]> => {
    const response = await fetch("/api/recipes/ai-generate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const data = await response.json();
      if (isErrorResponse(data)) {
        throw new ApiError(data.error.code, response.status, data.error.message);
      }
      throw new ApiError(
        "UNKNOWN_ERROR",
        response.status,
        `HTTP ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
      }
    } finally {
      reader.releaseLock();
    }

    // Parse SSE: "data: { recipes: [...] }\n\n"
    const lines = fullText.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed && Array.isArray(parsed.recipes)) {
            return parsed.recipes as RecipeContent[];
          }
        } catch {
          // continue
        }
      }
    }
    throw new ApiError("PARSE_ERROR", 200, "Failed to parse AI response");
  },
};

// ============================================================================
// Stats API
// ============================================================================

export interface Stats {
  ingredientCount: number;
  recipeCount: number;
  expiringCount: number;
}

export const statsApi = {
  get: () => apiCall<Stats>("/api/stats", { method: "GET" }),
};

// ============================================================================
// History API
// ============================================================================

export interface UsedIngredient {
  name: string;
  quantity: number | string | null;
  unit: string | null;
}

export interface CookingLog {
  id: string;
  recipeId: string | null;
  name: string;
  source: "ai_recipe" | "manual";
  usedIngredients: UsedIngredient[];
  cookedAt: string;
  createdAt: string;
}

export interface ConsumedIngredientInput {
  ingredientId: string;
  quantity: number;
}

export const historyApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    return apiCall<CookingLog[]>(
      `/api/history?${query.toString()}`,
      { method: "GET" }
    );
  },

  create: (data: { recipeId: string; consumedIngredients: ConsumedIngredientInput[] }) =>
    apiCall<CookingLog>("/api/history", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
