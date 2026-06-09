type ConvertedUnit = { quantity: number; unit: string };

const VOLUME_TO_ML: Record<string, number> = {
  大さじ: 15,
  小さじ: 5,
  カップ: 200,
  cup: 200,
  L: 1000,
  リットル: 1000,
  dl: 100,
  デシリットル: 100,
  cc: 1,
  ml: 1,
  mL: 1,
};

/** 大さじ/小さじ/カップ等を ml に変換。変換不要/不能なら null を返す */
export function toMl(quantity: number, unit: string): ConvertedUnit | null {
  const factor = VOLUME_TO_ML[unit.trim()];
  if (factor === undefined || factor === 1) return null;
  return { quantity: Math.round(quantity * factor * 10) / 10, unit: "ml" };
}

const WEIGHT_UNITS = new Set(["g", "グラム", "kg", "キログラム", "mg"]);
const VOLUME_UNITS = new Set([...Object.keys(VOLUME_TO_ML)]);

/**
 * レシピの量(recipeQty, recipeUnit)を在庫のunit(storedUnit)に合わせて換算する。
 * 換算できない場合は元の値をそのまま返す。
 */
export function convertToStoredUnit(
  recipeQty: number,
  recipeUnit: string,
  storedUnit: string,
): ConvertedUnit {
  const ru = recipeUnit.trim();
  const su = storedUnit.trim();

  if (ru === su) return { quantity: recipeQty, unit: su };

  // 大さじ等 → ml
  if (VOLUME_UNITS.has(ru) && (su === "ml" || su === "mL" || su === "cc")) {
    const factor = VOLUME_TO_ML[ru] ?? 1;
    return { quantity: Math.round(recipeQty * factor * 10) / 10, unit: su };
  }

  // 大さじ等 → g（液体は ml ≈ g で近似）
  if (VOLUME_UNITS.has(ru) && WEIGHT_UNITS.has(su)) {
    const factor = VOLUME_TO_ML[ru] ?? 1;
    return { quantity: Math.round(recipeQty * factor * 10) / 10, unit: su };
  }

  return { quantity: recipeQty, unit: ru };
}
