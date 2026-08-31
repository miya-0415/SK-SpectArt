"use client";

import { useState, useEffect } from "react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Header } from "@/components/Header";
import "@/styles/my-art.css";

type Artwork = {
  id: number;
  title: string;
  imageUrl: string;
  createdAt: string;
};

export default function MyArtPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/artworks")
      .then((res) => res.json())
      .then((data: Artwork[]) => {
        console.log("取得結果:", data);

        setArtworks(data);

        if (data.length > 0) {
          setSelected(data[0]);
        }
      })
      .catch((err) => console.error("アートワーク取得失敗", err));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);

    return `${d.getFullYear()}.${String(
      d.getMonth() + 1
    ).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <>
      <Header />

      <main className="gallery-page">
        <section className="gallery-header">
          <div className="gallery-title">
            <h1>My Art</h1>
            <p>{artworks.length} Artworks</p>
          </div>

          <div className="gallery-tools">
            <input
              type="text"
              placeholder="Search Artwork"
              className="search-box"
            />

            <select className="sort-select">
              <option>Newest</option>
              <option>Oldest</option>
              <option>Title</option>
            </select>
          </div>
        </section>

        <section className="gallery-grid">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              title={artwork.title}
              date={formatDate(artwork.createdAt)}
              imageUrl={artwork.imageUrl}
              onView={() => {
                setSelected(artwork);
                setOpen(true);
              }}
            />
          ))}
        </section>
      </main>

      <div
        className="view-modal"
        style={{ display: open ? "flex" : "none" }}
        onClick={(e) => {
          if (e.currentTarget === e.target) {
            setOpen(false);
          }
        }}
      >
        <div className="view-content">
          <button
            className="close-view"
            onClick={() => setOpen(false)}
          >
            <i className="fa-solid fa-xmark" />
          </button>

          {selected && (
            <>
              {selected.imageUrl}

              <h2 id="modal-title">{selected.title}</h2>

              <p id="modal-date">
                {formatDate(selected.createdAt)}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}