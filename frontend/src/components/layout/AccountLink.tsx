"use client";

import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/context/AuthContext";

type Props = {
  className?: string;
  textClassName?: string;
  showIconOnMobile?: boolean;
};

export function AccountLink({
  className = "rounded-lg p-2 hover:bg-white/10 sm:px-3 sm:py-1.5",
  textClassName = "hidden text-sm sm:inline",
  showIconOnMobile = true,
}: Props) {
  const { user, loading } = useAuth();

  if (!loading && user) {
    const label = fa.header.welcomeUser(user.username);
    return (
      <Link
        href={routes.profile}
        className={className}
        aria-label={label}
        title={label}
      >
        {showIconOnMobile ? <UserIcon className="sm:hidden" /> : null}
        <span className={`${textClassName} max-w-[10rem] truncate sm:max-w-[14rem]`}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={routes.login}
      className={className}
      aria-label={fa.header.loginRegister}
      title={fa.header.loginRegister}
    >
      {showIconOnMobile ? <UserIcon className="sm:hidden" /> : null}
      <span className={textClassName}>{fa.header.loginRegister}</span>
    </Link>
  );
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
