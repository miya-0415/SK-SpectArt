"use client";

import { ChangeEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackgroundLayers } from "@/components/BackgroundLayers";
import { GenerationOverlay } from "@/components/GenerationOverlay";
import { Header } from "@/components/Header";
import { LoginModal } from "@/components/LoginModal";
import { SignupModal } from "@/components/SignupModal";
import { SvgFilters } from "@/components/SvgFilters";
import { useAuth } from "@/context/AuthContext";
import { generateArtwork, saveArtwork, uploadAudio } from "@/lib/api";
import "@/styles/studio.css";

const previewWaveform = Array.from({ length: 84 }, (_, index) => {
  const primaryWave = Math.abs(Math.sin(index * 0.43));
  const secondaryWave = Math.abs(Math.sin(index * 0.13 + 1.4));
  return 0.16 + primaryWave * 0.58 + secondaryWave * 0.24;
});

function StudioPageContent() {
  const [file, setFile] = useState<File | null>(null);
  const [generated, setGenerated] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<"idle" | "loading" | "complete" | "error">("idle");
  const [waveform, setWaveform] = useState<number[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoadingPreview = searchParams.get("preview") === "loading";

  // 画像URL
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [artworkId, setArtworkId] = useState<string | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setGenerated(false);
    setImageUrl(null);
    setArtworkId(null);
    setWaveform([]);
  };

const onGenerate = async () => {
    if (!file || generationPhase === "loading" || generationPhase === "complete") {
      return;
    }

    setGenerationPhase("loading");
    setGenerated(false);
    setImageUrl(null);

    try {
      const uploaded = await uploadAudio(file);
      setWaveform(uploaded.waveform);
      const result = await generateArtwork(uploaded.uploadId);
      setGenerationPhase("complete");
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      setImageUrl(result.imageUrl);
      setArtworkId(result.artworkId);
      setGenerated(true);
      setGenerationPhase("idle");

      // ↓ ここから追加
      if (user) {
        const title = file.name.replace(/\.[^/.]+$/, "");
        try {
          await saveArtwork(title, result.imageUrl);
        } catch (err) {
          console.error("アートワークの保存に失敗しました", err);
        }
      }
      // ↑ ここまで追加

    } catch (error) {
      console.error("Artwork generation failed", error);
      setGenerationPhase("error");
    }
  };

  
  const overlay = isLoadingPreview
    ? { phase: "loading" as const, waveform: previewWaveform }
    : generationPhase !== "idle" && file
      ? { phase: generationPhase, waveform }
      : null;

  return (
    <>
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

                  <button className="generate-btn" onClick={onGenerate} disabled={generationPhase !== "idle"}>
                    Start Generating
                  </button>

                  <button className="delete-btn" id="delate-btn" onClick={() => { setFile(null); setArtworkId(null); }}>
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
            <img src={imageUrl ?? "/image/generated-sample.png"} alt="Generated Artwork" className="generated-artwork" />

            <h2 className="artwork-ready">Your artwork is ready</h2>

            <div id="guest-actions" style={{ display: user || loading ? "none" : undefined }}>
              <p className="login-message">作品を保存・編集するにはログインが必要です</p>

              <button className="login-btn" id="open-login" onClick={() => setLoginOpen(true)}>
                Login
              </button>
            </div>

            <div className="member-actions" id="member-actions" style={{ display: user ? "flex" : "none" }}>
              <button className="action-btn">Download</button>

              <button className="action-btn edit-btn" onClick={() => {
                if (imageUrl) {
                  try {
                    sessionStorage.setItem("generated_artwork_image", imageUrl);
                  } catch (e) {
                    console.error("sessionStorage setItem failed", e);
                  }
                }
                router.push(`/edit/${artworkId || "draft"}`);
              }}>
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
        onLoginSuccess={() => setLoginOpen(false)}
        onOpenSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSignupSuccess={() => setSignupOpen(false)}
      />
      <SvgFilters />

      {overlay && (
        <GenerationOverlay
          phase={overlay.phase}
          waveform={overlay.waveform}
          onRetry={onGenerate}
        />
      )}
    </>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioPageContent />
    </Suspense>
  );
}
