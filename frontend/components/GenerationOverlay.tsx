"use client";

import { useEffect, useState, type CSSProperties } from "react";

type GenerationPhase = "loading" | "complete" | "error";

type GenerationOverlayProps = {
  phase: GenerationPhase;
  waveform: number[];
  onRetry: () => void;
};

const DISPLAY_PROGRESS_MAX = 94;
const PROGRESS_START_DELAY = 160;
const PROGRESS_DURATION = 7600;
const PROGRESS_CURVE = 1.25;

export function GenerationOverlay({ phase, waveform, onRetry }: GenerationOverlayProps) {
  const hasWaveform = waveform.length > 0;
  const isError = phase === "error";
  const [displayProgress, setDisplayProgress] = useState(0);
  const progressFillCount = Math.floor(waveform.length * (DISPLAY_PROGRESS_MAX / 100));

  useEffect(() => {
    if (phase === "complete") {
      const completionTimer = window.setTimeout(() => setDisplayProgress(100), 520);
      return () => window.clearTimeout(completionTimer);
    }

    if (phase !== "loading" || !hasWaveform) {
      setDisplayProgress(0);
      return;
    }

    const startedAt = performance.now();
    let frameId = 0;

    const updateProgress = (now: number) => {
      const elapsed = Math.max(0, now - startedAt - PROGRESS_START_DELAY);
      const timelineProgress = Math.min(1, elapsed / PROGRESS_DURATION);
      const nextProgress = Math.round(
        DISPLAY_PROGRESS_MAX * Math.pow(timelineProgress, 1 / PROGRESS_CURVE),
      );

      setDisplayProgress(nextProgress);

      if (timelineProgress < 1) {
        frameId = window.requestAnimationFrame(updateProgress);
      }
    };

    frameId = window.requestAnimationFrame(updateProgress);
    return () => window.cancelAnimationFrame(frameId);
  }, [hasWaveform, phase]);

  return (
    <div className={`generation-overlay generation-overlay--${phase}`} role="status" aria-live="polite">
      <div className="generation-overlay__surface">
        {isError && (
          <>
            <p className="generation-overlay__eyebrow">Generation paused</p>
            <h2 className="generation-overlay__title">We could not finish this artwork.</h2>
          </>
        )}

        {!isError && (
          <p className="generation-overlay__progress" aria-label={`Generation progress: ${displayProgress}%`}>
            <span>Generating</span>
            <strong>{displayProgress}%</strong>
          </p>
        )}

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
                "--loading-delay": `${Math.round(PROGRESS_START_DELAY + PROGRESS_DURATION * progressRatio ** PROGRESS_CURVE)}ms`,
                "--frontier-delay": "8460ms",
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

        {isError && (
          <>
            <p className="generation-overlay__message">Please check the connection and try again.</p>
            <button className="generation-overlay__retry" type="button" onClick={onRetry}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
