"use client";

import { useRouter } from "next/navigation";

export function StartButton() {
  const router = useRouter();

  return (
    <button className="start-btn" onClick={() => router.push("/studio")}>
      GET STARTED
    </button>
  );
}
