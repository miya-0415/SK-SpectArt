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
  titlePos: { x: number; y: number };
  datePos: { x: number; y: number };
  messagePos: { x: number; y: number };
  onTitleDragStart: (event: React.MouseEvent) => void;
  onDateDragStart: (event: React.MouseEvent) => void;
  onMessageDragStart: (event: React.MouseEvent) => void;
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
  titlePos,
  datePos,
  messagePos,
  onTitleDragStart,
  onDateDragStart,
  onMessageDragStart,
}: PreviewPanelProps) {
  return (
    <section className="preview-panel">
      <div className="preview-container">
        <div className={`artwork-preview ${presetClass} ${layoutClass}`} id="artwork-stage">
          <img src="/image/generated-sample.png" alt="Generated Artwork" id="preview-image" />

          <div className="print-guide" id="print-guide" style={{ display: showPrintGuide ? "block" : "none" }} />

          <h2
            id="preview-title"
            className={fontClass}
            style={{
              color,
              fontSize: titleSize,
              transform: `translate(${titlePos.x}px, ${titlePos.y}px)`,
              cursor: "grab",
            }}
            onMouseDown={onTitleDragStart}
          >
            {title}
          </h2>

          <p
            id="preview-date"
            className={fontClass}
            style={{
              color,
              fontSize: textSize,
              transform: `translate(${datePos.x}px, ${datePos.y}px)`,
              cursor: "grab",
            }}
            onMouseDown={onDateDragStart}
          >
            {date}
          </p>

          <p
            id="preview-message"
            className={fontClass}
            style={{
              color,
              fontSize: textSize,
              transform: `translate(${messagePos.x}px, ${messagePos.y}px)`,
              cursor: "grab",
            }}
            onMouseDown={onMessageDragStart}
          >
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}