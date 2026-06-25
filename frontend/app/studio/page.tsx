"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BackgroundLayers } from "@/components/BackgroundLayers";
import { Header } from "@/components/Header";
import { LoginModal } from "@/components/LoginModal";
import { PageStyle } from "@/components/PageStyle";
import { SignupModal } from "@/components/SignupModal";
import { SvgFilters } from "@/components/SvgFilters";
import { generateArtwork, login, uploadAudio } from "@/lib/api";

export default function StudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [generated, setGenerated] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const router = useRouter();

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const onGenerate = async () => {
    if (file) {
      const uploaded = await uploadAudio(file);
      await generateArtwork(uploaded.uploadId);
    }
    setGenerated(true);
  };

  const onLogin = async () => {
    await login("", "");
    setLoginOpen(false);
    setLoggedIn(true);
  };

  return (
    <>
      <PageStyle href="/styles/studio.css" />
      <Header />

      <main>
        <section className="hero-section">
          <BackgroundLayers />

          <div className="hero-content">
            <div className="left-text">
              <h1>
                音源をアップロードして
                <br />
                ビジュアルアートを生成
              </h1>
            </div>

            <div className="upload-area">
              <div className="circle-wrap">
                <div className="upload-wrap" style={{ display: file ? "none" : undefined }}>
                  <p className="upload-title">Drag & Drop to Upload File</p>

                  <p className="or">or</p>

                  <label className="browse-btn">
                    Browse file

                    <input
                      type="file"
                      id="audio-file"
                      style={{ display: "none" }}
                      accept=".mp3,.wav,.m4a"
                      onChange={onFileChange}
                    />
                  </label>

                  <p className="file-info">MP3 / WAV / M4A (最大 50MB)</p>
                </div>

                <div id="state-after" style={{ display: file ? "flex" : "none" }}>
                  <p className="display-file-name" id="file-name">
                    {file?.name ?? "File Name.mp3"}
                  </p>

                  <div className="play-icon">
                    <i className="fa-solid fa-play" />
                  </div>

                  <button className="generate-btn" onClick={onGenerate}>
                    Start Generating
                  </button>

                  <button className="delete-btn" id="delate-btn" onClick={() => setFile(null)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="artwork-preview-section">
          <div className="artwork-placeholder" id="placeholder-state" style={{ display: generated ? "none" : undefined }}>
            <img src="/image/palette-icon.png" className="palette-icon" alt="Palette Icon" />

            <p className="placeholder-text">Your generated artwork will appear here</p>
          </div>

          <div className="generated-state" id="generated-state" style={{ display: generated ? "block" : undefined }}>
            <img src="/image/generated-sample.png" alt="Generated Artwork" className="generated-artwork" />

            <h2 className="artwork-ready">Your artwork is ready</h2>

            <div id="guest-actions" style={{ display: loggedIn ? "none" : undefined }}>
              <p className="login-message">作品を保存・編集するにはログインが必要です</p>

              <button className="login-btn" id="open-login" onClick={() => setLoginOpen(true)}>
                Login
              </button>
            </div>

            <div className="member-actions" id="member-actions" style={{ display: loggedIn ? "flex" : undefined }}>
              <button className="action-btn">Download</button>

              <button className="action-btn edit-btn" onClick={() => router.push("/edit")}>
                Edit/Export
              </button>
            </div>

            <div className="related-container">
              <h3 className="related-title">Also created from this track</h3>

              <div className="related-grid">
                <div className="related-card" />
                <div className="related-card" />
                <div className="related-card" />
              </div>
            </div>
          </div>

          <div className="divider-wrap">
            <img src="/image/frame01.png" className="divider-line" alt="Decorative Divider" />
          </div>

          <div className="samples-container">
            <h2 className="samples-title">Samples</h2>

            <div className="slider-outer">
              <button className="slider-arrow prev-arrow">
                <i className="fa-solid fa-arrow-left-long" />
              </button>

              <div className="slider-inner">
                <div className="sample-card">
                  <div className="card-img-placeholder" />
                </div>

                <div className="sample-card">
                  <div className="card-img-placeholder" />
                </div>

                <div className="sample-card">
                  <div className="card-img-placeholder" />
                </div>
              </div>

              <button className="slider-arrow next-arrow">
                <i className="fa-solid fa-arrow-right-long" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={onLogin}
        onOpenSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
      <SvgFilters />
    </>
  );
}
