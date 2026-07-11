"use client";

import { useState } from "react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Header } from "@/components/Header";
import "@/styles/my-art.css";

const artworks = [
  { title: "Moonlight Echo", date: "2026.06.17" },
  { title: "Silent Memory", date: "2026.06.14" },
  { title: "Ocean Noise", date: "2026.06.10" },
  { title: "Sunset Sound", date: "2026.06.08" },
  { title: "Night Garden", date: "2026.06.04" },
  { title: "Whisper", date: "2026.06.01" },
];

export default function MyArtPage() {
  const [selected, setSelected] = useState(artworks[0]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Header />

      <main className="gallery-page">
        <section className="gallery-header">
          <div className="gallery-title">
            <h1>My Art</h1>

            <p>6 Artworks</p>
          </div>

          <div className="gallery-tools">
            <input type="text" placeholder="Search Artwork" className="search-box" />

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
              key={artwork.title}
              title={artwork.title}
              date={artwork.date}
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
        id="view-modal"
        style={{ display: open ? "flex" : "none" }}
        onClick={(event) => {
          if (event.currentTarget === event.target) {
            setOpen(false);
          }
        }}
      >
        <div className="view-content">
          <button className="close-view" id="close-view" onClick={() => setOpen(false)}>
            <i className="fa-solid fa-xmark" />
          </button>

          <img src="/image/generated-sample.png" id="modal-image" alt="Artwork" />

          <h2 id="modal-title">{selected.title}</h2>

          <p id="modal-date">{selected.date}</p>
        </div>
      </div>
    </>
  );
}
