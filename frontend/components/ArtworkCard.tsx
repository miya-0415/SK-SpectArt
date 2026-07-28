"use client";

import { useRouter } from "next/navigation";

type ArtworkCardProps = {
  title: string;
  date: string;
  onView: () => void;
};

export function ArtworkCard({ title, date, onView }: ArtworkCardProps) {
  const router = useRouter();

  return (
    <article className="art-card">
      <img src="/image/generated-sample.png" alt="Artwork" />

      <div className="art-overlay">
        <h2>{title}</h2>

        <p>{date}</p>

        <div className="overlay-buttons">
          <button className="view-btn" onClick={onView}>
            View
          </button>

          <button className="edit-btn" onClick={() => router.push(`/edit/${encodeURIComponent(title)}`)}>
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}
