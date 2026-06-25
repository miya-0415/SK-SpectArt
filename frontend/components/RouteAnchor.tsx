"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type RouteAnchorProps = {
  href: string;
  children: ReactNode;
};

export function RouteAnchor({ href, children }: RouteAnchorProps) {
  const router = useRouter();

  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        router.push(href);
      }}
    >
      {children}
    </a>
  );
}
