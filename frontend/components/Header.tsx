"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "./Navigation";

export function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <nav>
        <a
          href="/"
          className="logo"
          onClick={(event) => {
            event.preventDefault();
            router.push("/");
          }}
        >
          <img src="/logo/Spectart-Web-Logo.svg" alt="SpectArt" width="180" />
        </a>

        <button className={`hamburger${open ? " active" : ""}`} onClick={() => setOpen((value) => !value)}>
          <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect className="bar-top" width="30" height="2" rx="1" fill="currentColor" />

            <rect className="bar-mid" y="11" width="30" height="2" rx="1" fill="currentColor" />

            <rect className="bar-bot" y="22" width="30" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      </nav>

      <Navigation open={open} onClose={() => setOpen(false)} />
    </>
  );
}
