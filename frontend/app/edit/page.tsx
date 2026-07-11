"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButtons } from "@/components/ActionButtons";
import { Header } from "@/components/Header";
import { PreviewPanel } from "@/components/PreviewPanel";
import { saveArtwork } from "@/lib/api";
import "@/styles/edit.css";


const presetClasses: Record<string, string> = {
  "Wallpaper (PC)": "preset-pc",
  "Phone Wallpaper": "preset-phone",
  "Instagram Post": "preset-square",
  "Instagram Story": "preset-phone",
  Square: "preset-square",
  "A4 Print": "preset-a4",
  "A3 Print": "preset-a3",
};

const layoutClasses: Record<string, string> = {
  "Full Bleed": "",
  "White Border": "layout-border",
  "Museum Frame": "layout-frame",
};

const colors: Record<string, string> = {
  ivory: "#F5F1EB",
  charcoal: "#3B3B3B",
  gold: "#A89609",
  navy: "#233D4D",
  sage: "#73877B",
  rose: "#B68B8B",
};

const sizes: Record<string, { title: string; text: string }> = {
  S: { title: "1.8rem", text: "0.8rem" },
  M: { title: "2.4rem", text: "1rem" },
  L: { title: "3rem", text: "1.2rem" },
  XL: { title: "4rem", text: "1.4rem" },
};

export default function EditPage() {
  const [artworkName, setArtworkName] = useState("");
  const [artworkDate, setArtworkDate] = useState("");
  const [artworkMessage, setArtworkMessage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("Moonlight Echo");
  const [previewDate, setPreviewDate] = useState("2026.06.17");
  const [previewMessage, setPreviewMessage] = useState("A memory preserved through sound.");
  const [preset, setPreset] = useState("Wallpaper (PC)");
  const [layout, setLayout] = useState("Full Bleed");
  const [fontClass, setFontClass] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [size, setSize] = useState("M");
  const [showPrintGuide, setShowPrintGuide] = useState(false);
  type Pos = { x: number; y: number };
  type DragKey = "title" | "date" | "message";
  
  const [titlePos, setTitlePos] = useState<Pos>({ x: 0, y: 0 });
  const [datePos, setDatePos] = useState<Pos>({ x: 0, y: 0 });
  const [messagePos, setMessagePos] = useState<Pos>({ x: 0, y: 0 });
  
  const dragState = useRef<{
    key: DragKey;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);
  
  const positions: Record<DragKey, Pos> = { title: titlePos, date: datePos, message: messagePos };
  const setPositions: Record<DragKey, (pos: Pos) => void> = {
    title: setTitlePos,
    date: setDatePos,
    message: setMessagePos,
  };
  
  const router = useRouter();

  const reset = () => {
    setArtworkName("");
    setArtworkDate("");
    setArtworkMessage("");
    setPreviewTitle("");
    setPreviewDate("");
    setPreviewMessage("");
  };

  const handleDragMove = (event: MouseEvent) => {
    if (!dragState.current) return;
    const { key, startX, startY, origX, origY, minX, maxX, minY, maxY } = dragState.current;

    const rawX = origX + (event.clientX - startX);
    const rawY = origY + (event.clientY - startY);

    setPositions[key]({
      x: Math.min(Math.max(rawX, minX), maxX),
      y: Math.min(Math.max(rawY, minY), maxY),
    });
  };

  const handleDragEnd = () => {
    dragState.current = null;
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  };

  const handleDragStart = (key: DragKey) => (event: React.MouseEvent) => {
    const origin = positions[key];
    const element = event.currentTarget as HTMLElement;
    const stage = element.closest<HTMLElement>("#artwork-stage");
    if (!stage) return;

    event.preventDefault();

    const stageRect = stage.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();

    const naturalLeft = elemRect.left - origin.x;
    const naturalTop = elemRect.top - origin.y;

    const minX = stageRect.left - naturalLeft;
    const maxX = stageRect.right - naturalLeft - elemRect.width;
    const minY = stageRect.top - naturalTop;
    const maxY = stageRect.bottom - naturalTop - elemRect.height;

    dragState.current = {
      key,
      startX: event.clientX,
      startY: event.clientY,
      origX: origin.x,
      origY: origin.y,
      minX,
      maxX,
      minY,
      maxY,
    };
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const save = async () => {
    await saveArtwork("mock-artwork-id");
    router.push("/my-art");
  };

  return (
    <>
      <Header />

      <main className="edit-layout">
        <PreviewPanel
          presetClass={presetClasses[preset]}
          layoutClass={layoutClasses[layout]}
          title={previewTitle}
          date={previewDate}
          message={previewMessage}
          fontClass={fontClass}
          color={textColor}
          titleSize={sizes[size].title}
          textSize={sizes[size].text}
          showPrintGuide={showPrintGuide}
          titlePos={titlePos}
          datePos={datePos}
          messagePos={messagePos}
          onTitleDragStart={handleDragStart("title")}
          onDateDragStart={handleDragStart("date")}
          onMessageDragStart={handleDragStart("message")}
        />

        <section className="control-panel">
          <div className="control-group">
            <h3 className="group-title">Preset</h3>

            <select id="preset-select" value={preset} onChange={(event) => setPreset(event.target.value)}>
              {Object.keys(presetClasses).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <h3 className="group-title">Layout</h3>

            <select id="layout-select" value={layout} onChange={(event) => setLayout(event.target.value)}>
              {Object.keys(layoutClasses).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <h3 className="group-title">Artwork Name</h3>

            <input
              type="text"
              id="artwork-name"
              placeholder="Artwork Name"
              value={artworkName}
              onChange={(event) => {
                setArtworkName(event.target.value);
                setPreviewTitle(event.target.value.trim() === "" ? "" : event.target.value);
              }}
            />
          </div>

          <div className="control-group">
            <h3 className="group-title">Date</h3>

            <input
              type="text"
              id="artwork-date"
              placeholder="2026.06.17"
              value={artworkDate}
              onChange={(event) => {
                setArtworkDate(event.target.value);
                setPreviewDate(event.target.value.trim() === "" ? "" : event.target.value);
              }}
            />
          </div>

          <div className="control-group">
            <h3 className="group-title">Message</h3>

            <textarea
              id="artwork-message"
              placeholder="Add a message"
              value={artworkMessage}
              onChange={(event) => {
                setArtworkMessage(event.target.value);
                setPreviewMessage(event.target.value.trim() === "" ? "" : event.target.value);
              }}
            />
          </div>

          <div className="control-group">
            <h3 className="group-title">Font</h3>

            <div className="font-options">
              <button className="font-btn font-serif" onClick={() => setFontClass("font-serif")}>
                A
              </button>
              <button className="font-btn font-modern" onClick={() => setFontClass("font-modern")}>
                A
              </button>
              <button className="font-btn font-script" onClick={() => setFontClass("font-script")}>
                A
              </button>
              <button className="font-btn font-signature" onClick={() => setFontClass("font-signature")}>
                A
              </button>
            </div>
          </div>

          <div className="control-group">
            <h3 className="group-title">Font Size</h3>

            <div className="size-options">
              {Object.keys(sizes).map((item) => (
                <button key={item} onClick={() => setSize(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <h3 className="group-title">Color</h3>

            <div className="color-options">
              {Object.entries(colors).map(([name, value]) => (
                <button key={name} className={`color-chip ${name}`} onClick={() => setTextColor(value)} />
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="checkbox-wrap">
              <input type="checkbox" checked={showPrintGuide} onChange={(event) => setShowPrintGuide(event.target.checked)} />
              Show Print Guide
            </label>
          </div>

          <ActionButtons onReset={reset} onSave={save} />
        </section>
      </main>
    </>
  );
}
