import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";

type Props = { className?: string };

export function SearchForm({ className = "" }: Props) {
  return (
    <form className={className} action={routes.products} role="search">
      <input
        type="search"
        name="q"
        placeholder={fa.header.searchPlaceholder}
        className="w-full min-w-0 rounded-full border-0 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50 sm:px-5"
      />
    </form>
  );
}
