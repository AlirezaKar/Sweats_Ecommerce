import { fa } from "@/lib/i18n/fa";

export function TopBar() {
  return (
    <div className="bg-header-top px-4 py-2 text-center text-xs text-muted-foreground sm:text-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 sm:flex-row sm:gap-0">
        <span className="leading-snug">{fa.header.location}</span>
        <span className="hidden sm:inline sm:mx-2">|</span>
        <a
          href={`tel:${fa.header.phoneHref}`}
          className="hover:text-foreground sm:inline"
          dir="ltr"
        >
          {fa.header.phone}
        </a>
      </div>
    </div>
  );
}
