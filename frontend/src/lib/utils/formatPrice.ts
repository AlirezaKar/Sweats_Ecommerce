import { LOCALE } from "@/lib/constants/locale";

/**
 * Format price for Persian UI (Iran locale).
 * Backend stores integers (Toman/Rial) — pass unit in labels if needed.
 */
export function formatPrice(
  value: number | string,
  options?: Intl.NumberFormatOptions,
): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";

  const formatted = new Intl.NumberFormat(LOCALE, {
    style: "decimal",
    maximumFractionDigits: 0,
    ...options,
  }).format(num);

  return `${formatted} تومان`;
}
