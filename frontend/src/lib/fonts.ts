import localFont from "next/font/local";

/** Self-hosted Persian UI font — preloaded at build time via next/font (no runtime CSS @font-face). */
export const vazirmatn = localFont({
  src: [
    {
      path: "../assets/fonts/vazirmatn-arabic-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/vazirmatn-arabic-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/vazirmatn-arabic-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "block",
  preload: true,
  fallback: ["Tahoma", "Arial", "sans-serif"],
});
