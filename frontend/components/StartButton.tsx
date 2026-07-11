"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function StartButton() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/studio");
  }, [router]);

  return (
    <button
      className="start-btn"
      onClick={() => router.push("/studio")}
      onPointerEnter={() => router.prefetch("/studio")}
      onFocus={() => router.prefetch("/studio")}
    >
      GET STARTED
    </button>
  );
}
