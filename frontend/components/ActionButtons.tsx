type ActionButtonsProps = {
  onReset: () => void;
  onSave: () => void;
};

export function ActionButtons({ onReset, onSave }: ActionButtonsProps) {
  return (
    <div className="action-area">
      <button className="reset-btn" onClick={onReset}>
        Reset
      </button>

      <button className="save-btn" onClick={onSave}>
        Save to My Art
      </button>

      <button className="download-png-btn">Download PNG</button>

      <button className="download-jpg-btn">Download JPG</button>

      <button className="download-pdf-btn">Download PDF</button>
    </div>
  );
}
