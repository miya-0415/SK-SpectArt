import { BackgroundLayers } from "@/components/BackgroundLayers";
import { StartButton } from "@/components/StartButton";
import { SvgFilters } from "@/components/SvgFilters";
import "@/styles/index.css";

export default function HomePage() {
  return (
    <>
      <BackgroundLayers />

      <main className="main-wrap">
        <div className="center-wrap">
          <img src="/logo/Spectart-Web-Logo.svg" className="h1" alt="logo" />
          <p>Visualize Your Sound</p>
          <img src="/image/frame01.png" className="frame01" alt="frame" />
          <StartButton />
        </div>
      </main>

      <SvgFilters />
    </>
  );
}
