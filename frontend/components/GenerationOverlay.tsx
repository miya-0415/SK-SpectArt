"use client";

import type { CSSProperties } from "react";

type GenerationPhase = "loading" | "complete" | "error";

type GenerationOverlayProps = {
  fileName: string;
  phase: GenerationPhase;
  waveform: number[];
  onRetry: () => void;
};

export function GenerationOverlay({ fileName, phase, waveform, onRetry }: GenerationOverlayProps) {
  const hasWaveform = waveform.length > 0;
  const isError = phase === "error";
  const progressFillCount = Math.floor(waveform.length * 0.94);

  return (
    <div className={`generation-overlay generation-overlay--${phase}`} role="status" aria-live="polite">
      <div className="generation-overlay__surface">
        <p className="generation-overlay__eyebrow">
          {isError ? "Generation paused" : "Sound to visual"}
        </p>

        <h2 className="generation-overlay__title">
          {isError ? "We could not finish this artwork." : "Translating your sound into color"}
        </h2>

        <p className="generation-overlay__filename">{fileName}</p>

        <div className={`generation-wave${hasWaveform ? "" : " generation-wave--preparing"}`} aria-hidden="true">
          {hasWaveform ? (
            waveform.map((amplitude, index) => {
              const height = `${Math.round(18 + amplitude * 82)}%`;
              const progressRatio = progressFillCount > 1 ? index / (progressFillCount - 1) : 0;
              const isAccumulating = phase === "loading" && index < progressFillCount;
              const isFilled = phase === "complete" && index < progressFillCount;
              const isCompleting = phase === "complete" && index >= progressFillCount;
              const isFrontier = phase === "loading" && index >= progressFillCount - 3 && index < progressFillCount;
              const style = {
                "--bar-index": index,
                "--completion-index": index - progressFillCount,
                "--loading-delay": `${Math.round(140 + 6500 * progressRatio ** 1.65)}ms`,
                "--frontier-delay": "7340ms",
                height,
              } as CSSProperties;

              return (
                <span
                  className={[
                    "generation-wave__bar",
                    isAccumulating && "generation-wave__bar--accumulating",
                    isFilled && "generation-wave__bar--filled",
                    isCompleting && "generation-wave__bar--completing",
                    isFrontier && "generation-wave__bar--frontier",
                  ].filter(Boolean).join(" ")}
                  key={index}
                  style={style}
                />
              );
            })
          ) : (
            <span className="generation-wave__preparing-line" />
          )}
        </div>

        <p className="generation-overlay__message">
          {isError ? "Please check the connection and try again." : "Listening for the shape hidden in this track"}
        </p>

        {isError && (
          <button className="generation-overlay__retry" type="button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
