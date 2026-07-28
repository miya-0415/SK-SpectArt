const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:5000";

// script.js の解析ロジック
function analyzeAudio(rawData: Float32Array) {
  const data = Array.from(rawData);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  let max = data[0], min = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] > max) max = data[i];
    if (data[i] < min) min = data[i];
  }
  const variance = data.reduce((s, x) => s + (x - avg) ** 2, 0) / data.length;
  const third = Math.floor(data.length / 3);
  const firstSlice  = data.slice(0, third);
  const middleSlice = data.slice(third, third * 2);
  const lastSlice   = data.slice(third * 2);
  const avgFirst  = firstSlice.reduce((a, b)  => a + b, 0) / firstSlice.length;
  const avgMiddle = middleSlice.reduce((a, b) => a + b, 0) / middleSlice.length;
  const avgLast   = lastSlice.reduce((a, b)   => a + b, 0) / lastSlice.length;
  const rms       = Math.sqrt(data.reduce((s, x)        => s + x * x, 0) / data.length);
  const rmsFirst  = Math.sqrt(firstSlice.reduce((s, x)  => s + x * x, 0) / firstSlice.length);
  const rmsMiddle = Math.sqrt(middleSlice.reduce((s, x) => s + x * x, 0) / middleSlice.length);
  const rmsLast   = Math.sqrt(lastSlice.reduce((s, x)   => s + x * x, 0) / lastSlice.length);
  const crestFactor  = rms > 0.0001 ? Math.abs(max) / rms : 1;
  const silenceRatio = data.filter(x => Math.abs(x) < 0.01).length / data.length;
  const kurtosis     = variance > 0
    ? data.reduce((s, x) => s + (x - avg) ** 4, 0) / data.length / (variance ** 2)
    : 3;
  const frameSize = Math.max(1, Math.floor(data.length / 200));
  const energyFrames: number[] = [];
  for (let i = 0; i < data.length; i += frameSize) {
    const end = Math.min(i + frameSize, data.length);
    let esum = 0;
    for (let j = i; j < end; j++) esum += data[j] * data[j];
    energyFrames.push(esum / (end - i));
  }
  const energyMean     = energyFrames.reduce((a, b) => a + b, 0) / energyFrames.length;
  const energyVariance = energyFrames.reduce((s, e) => s + (e - energyMean) ** 2, 0) / energyFrames.length;
  let energyPeaks = 0;
  for (let i = 1; i < energyFrames.length - 1; i++) {
    if (energyFrames[i] > energyFrames[i - 1] &&
        energyFrames[i] > energyFrames[i + 1] &&
        energyFrames[i] > energyMean * 1.5) energyPeaks++;
  }
  let zeroCrossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) zeroCrossings++;
  }
  function zcRate(arr: number[]) {
    let count = 0;
    for (let i = 1; i < arr.length; i++) {
      if ((arr[i - 1] >= 0 && arr[i] < 0) || (arr[i - 1] < 0 && arr[i] >= 0)) count++;
    }
    return arr.length > 1 ? count / arr.length : 0;
  }
  return {
    avg, max, min, variance,
    avgFirst, avgMiddle, avgLast,
    zeroCrossings,
    rms, rmsFirst, rmsMiddle, rmsLast,
    crestFactor, silenceRatio, kurtosis,
    energyVariance, energyPeaks,
    zcRateFirst: zcRate(firstSlice), zcRateMiddle: zcRate(middleSlice), zcRateLast: zcRate(lastSlice),
  };
}

function createWaveformSamples(rawData: Float32Array, sampleCount = 84) {
  const samples: number[] = [];
  const bucketSize = Math.max(1, Math.floor(rawData.length / sampleCount));

  for (let index = 0; index < sampleCount; index++) {
    const start = index * bucketSize;
    const end = Math.min(rawData.length, start + bucketSize);
    let peak = 0;

    for (let cursor = start; cursor < end; cursor++) {
      peak = Math.max(peak, Math.abs(rawData[cursor]));
    }

    samples.push(peak);
  }

  const highestPeak = Math.max(...samples, 0.01);
  return samples.map((sample) => Math.min(1, sample / highestPeak));
}

export type AudioUploadResult = { uploadId: string; waveform: number[] };
export type ArtworkResult    = { artworkId: string; imageUrl: string };
export type LoginResult      = { userId: string };

// analysisJson を一時保持（uploadId の代わり）
const analysisStore = new Map<string, string>();

export async function uploadAudio(file: File): Promise<AudioUploadResult> {
  const audioCtx   = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const rawData     = audioBuffer.getChannelData(0);

  const analysisJson = JSON.stringify(analyzeAudio(rawData));
  const uploadId     = crypto.randomUUID();
  analysisStore.set(uploadId, analysisJson);
  return { uploadId, waveform: createWaveformSamples(rawData) };
}

function generateDynamicCanvas(analysis: any): string {
  console.log("[SpectArt] generateDynamicCanvas called with analysis:", analysis);
  if (typeof window === "undefined") {
    console.warn("[SpectArt] window is undefined, returning default sample");
    return "/image/generated-sample.png";
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("[SpectArt] Failed to get canvas 2d context");
    return "/image/generated-sample.png";
  }

  const seed = Math.abs(
    Math.floor(
      (analysis.avg * 100000) +
      (analysis.variance * 10000) +
      (analysis.zeroCrossings || 0) +
      (analysis.rms * 50000) +
      (analysis.crestFactor * 1000)
    )
  ) || 1;

  console.log("[SpectArt] Derived seed for PRNG:", seed);

  let s = seed;
  const random = () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };

  const variance = analysis.variance || 0.05;
  const rms = analysis.rms || 0.1;
  const maxVal = analysis.max || 0.5;
  const minVal = analysis.min || -0.5;
  const amplitude = maxVal - minVal;
  const zeroCrossings = analysis.zeroCrossings || 100;
  const crestFactor = analysis.crestFactor || 2.0;

  // 1. Draw Background Gradient
  const gradBg = ctx.createLinearGradient(0, 0, 1000, 1000);
  gradBg.addColorStop(0, "#FAF8F5");
  gradBg.addColorStop(1, "#F3EFE9");
  ctx.fillStyle = gradBg;
  ctx.fillRect(0, 0, 1000, 1000);

  // Curated premium palettes
  const palettes = [
    ["#2C4A3E", "#729B79", "#BACDB0", "#D0C197", "#EAD8C0"], // Sage & Gold
    ["#1A3038", "#2F6B7E", "#83B2C3", "#D9A05B", "#F7D6C8"], // Deep Ocean & Amber
    ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"], // Rose & Charcoal
    ["#3D348B", "#7678ED", "#F7B801", "#F18701", "#F35B04"], // Soft Sunset
    ["#1E3F20", "#3E6F40", "#A3C9A8", "#84B59F", "#FAF3DD"]  // Forest Dream
  ];
  const paletteIndex = Math.floor(random() * palettes.length);
  const palette = palettes[paletteIndex];

  // 2. Draw soft watercolor background washes
  const washCount = 6 + Math.floor(random() * 4);
  for (let i = 0; i < washCount; i++) {
    const x = 500 + (random() - 0.5) * 500;
    const y = 500 + (random() - 0.5) * 500;
    const r = 150 + random() * 250;
    const color = palette[Math.floor(random() * palette.length)];

    ctx.save();
    ctx.globalAlpha = 0.12 + random() * 0.08;
    const radial = ctx.createRadialGradient(x, y, 10, x, y, r);
    radial.addColorStop(0, color);
    radial.addColorStop(0.8, color);
    radial.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Draw central geometric spirograph based on sound features
  ctx.save();
  ctx.translate(500, 500);

  const numRings = 4 + Math.floor(rms * 15);
  const maxRadius = 350 * (0.6 + rms * 1.5);

  for (let r = 0; r < numRings; r++) {
    const ringRadius = maxRadius * ((r + 1) / numRings);
    ctx.beginPath();

    const strokeColor = palette[r % palette.length];
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2 + (r * 0.4) + (variance * 4);
    ctx.globalAlpha = 0.55 - (r * 0.05);

    const numPoints = 200 + Math.floor(zeroCrossings / 5);
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const freq1 = 2 + (r * 1.5) + Math.floor(crestFactor * 2);
      const freq2 = 5 + (r * 2);
      const waveVal = Math.sin(theta * freq1) * Math.cos(theta * freq2);
      const displacement = waveVal * (15 + rms * 80 + variance * 100);
      const currentRadius = ringRadius + displacement;

      const px = Math.cos(theta) * currentRadius;
      const py = Math.sin(theta) * currentRadius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  // 4. Draw radiating particle lines
  ctx.save();
  ctx.translate(500, 500);
  const rayCount = 16 + Math.floor(rms * 40);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + (random() - 0.5) * 0.15;
    const startR = 50 + random() * 80;
    const endR = 250 + random() * 200;

    ctx.strokeStyle = palette[Math.floor(random() * palette.length)];
    ctx.lineWidth = 0.5 + random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
    ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Draw ink splatter dots
  ctx.save();
  const particleCount = 40 + Math.floor(zeroCrossings / 8);
  for (let i = 0; i < particleCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = 50 + random() * 400;
    const x = 500 + Math.cos(angle) * dist;
    const y = 500 + Math.sin(angle) * dist;
    const size = 1.2 + random() * (3 + crestFactor * 1.5);

    ctx.fillStyle = palette[Math.floor(random() * palette.length)];
    ctx.globalAlpha = 0.4 + random() * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (random() > 0.7) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(x + (random() - 0.5) * 12, y + (random() - 0.5) * 12, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // PNGから圧縮されたJPEG (品質 0.8) に変更してデータ量を大幅削減 (数MBから約100KB以下へ)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  console.log("[SpectArt] Dynamic canvas generation success, data URL length:", dataUrl.length);
  return dataUrl;
}

export async function generateArtwork(uploadId: string): Promise<ArtworkResult> {
  console.log("[SpectArt] generateArtwork called with uploadId:", uploadId);
  const analysisJson = analysisStore.get(uploadId);
  if (!analysisJson) {
    console.error("[SpectArt] uploadId not found in analysisStore");
    throw new Error("uploadId not found");
  }

  const blob     = new Blob([analysisJson], { type: "text/plain" });
  const formData = new FormData();
  formData.append("audio_data", blob);

  try {
    console.log("[SpectArt] Sending request to Python API:", `${PYTHON_API}/generating`);
    const res  = await fetch(`${PYTHON_API}/generating`, { method: "POST", body: formData });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();

    if (data.status !== "success") {
      throw new Error(data.error ?? "生成失敗");
    }

    console.log("[SpectArt] Backend image generation succeeded");
    analysisStore.delete(uploadId);
    return {
      artworkId: crypto.randomUUID(),
      imageUrl:  `data:image/png;base64,${data.image_base64}`,
    };
  } catch (error) {
    console.warn("[SpectArt] Backend image generation failed. Generating unique client-side artwork based on audio features.", error);
    
    let imageUrl = "/image/generated-sample.png";
    try {
      if (analysisJson) {
        const analysis = JSON.parse(analysisJson);
        imageUrl = generateDynamicCanvas(analysis);
      }
    } catch (fallbackError) {
      console.error("[SpectArt] Failed to generate dynamic canvas fallback", fallbackError);
    }

    analysisStore.delete(uploadId);
    return {
      artworkId: crypto.randomUUID(),
      imageUrl: imageUrl,
    };
  }
}

export async function login(_email: string, _password: string): Promise<LoginResult> {
  return { userId: "mock-user-id" };
}

export async function saveArtwork(_artworkId: string): Promise<{ saved: true }> {
  return { saved: true };
}
