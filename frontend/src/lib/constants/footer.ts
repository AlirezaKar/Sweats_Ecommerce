/** Trust / legal badge images — drop files into `public/trust/` */
export const footerTrustBadges = [
  {
    src: "/trust/enamad.svg",
    alt: "نماد اعتماد الکترونیکی",
    href: "#",
  },
  {
    src: "/trust/samandehi.svg",
    alt: "ساماندهی",
    href: "#",
  },
] as const;

export const footerLegalLinks = [
  { labelKey: "warranty" as const, href: "#" },
  { labelKey: "shipping" as const, href: "#" },
  { labelKey: "authenticity" as const, href: "#" },
] as const;
