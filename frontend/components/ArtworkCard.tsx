"use client";
import { useRouter } from "next/navigation";

type ArtworkCardProps = {
  title: string;
  date: string;
  imageUrl: string;
  onView: () => void;
};

export function ArtworkCard({
  title,
  date,
  imageUrl,
  onView,
}: ArtworkCardProps) {
  const router = useRouter();


  return (
    <article className="art-card">
      <img src={imageUrl} alt={title} />

        <div className="overlay-buttons">
          <button
            className="view-btn"
            onClick={onView}
          >
            View
          </button>

          <button
            className="edit-btn"
            onClick={() =>
              router.push(`/edit/${encodeURIComponent(title)}`)
            }
          >
            Edit
          </button>
        </div>
    </article>
  );
}