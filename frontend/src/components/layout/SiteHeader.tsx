import { TopBar } from "./TopBar";
import { HeaderMain } from "./HeaderMain";
import { Navbar } from "./Navbar";
import type { Category } from "@/types/api";

type Props = { categories: Category[] };

/** 3-layer header — middle layer (HeaderMain) is sticky */
export function SiteHeader({ categories }: Props) {
  return (
    <header className="w-full">
      <TopBar />
      <HeaderMain />
      <Navbar categories={categories} />
    </header>
  );
}
