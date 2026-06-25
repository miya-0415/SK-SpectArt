import { BackgroundLayers } from "./BackgroundLayers";
import { StartButton } from "./StartButton";
import { SvgFilters } from "./SvgFilters";

type LeftFixedPanelProps = {
  compact?: boolean;
};

export function LeftFixedPanel({
  compact = false,
}: LeftFixedPanelProps) {
  return (
    <>
      <BackgroundLayers />

      <div className={`main-wrap${compact ? " compact" : ""}`}>
        <div className="center-wrap">
          <img src="/logo/Spectart-Web-Logo.svg" className="h1" alt="logo" />
          <p>Visualize Your Sound</p>
          <img src="/image/frame01.png" className="frame01" alt="frame" />
          <StartButton />
        </div>
      </div>

      <SvgFilters />
    </>
  );
}
