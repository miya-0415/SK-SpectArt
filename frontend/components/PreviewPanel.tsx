type PreviewPanelProps = {
  presetClass: string;
  layoutClass: string;
  title: string;
  date: string;
  message: string;
  fontClass: string;
  color: string;
  titleSize: string;
  textSize: string;
  showPrintGuide: boolean;
};

export function PreviewPanel({
  presetClass,
  layoutClass,
  title,
  date,
  message,
  fontClass,
  color,
  titleSize,
  textSize,
  showPrintGuide,
}: PreviewPanelProps) {
  return (
    <section className="preview-panel">
      <div className="preview-container">
        <div className={`artwork-preview ${presetClass} ${layoutClass}`} id="artwork-stage">
          <img src="/image/generated-sample.png" alt="Generated Artwork" id="preview-image" />

          <div className="print-guide" id="print-guide" style={{ display: showPrintGuide ? "block" : "none" }} />

          <h2 id="preview-title" className={fontClass} style={{ color, fontSize: titleSize }}>
            {title}
          </h2>

          <p id="preview-date" className={fontClass} style={{ color, fontSize: textSize }}>
            {date}
          </p>

          <p id="preview-message" className={fontClass} style={{ color, fontSize: textSize }}>
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
