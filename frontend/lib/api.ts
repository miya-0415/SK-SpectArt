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

export type AudioUploadResult = { uploadId: string };
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
  return { uploadId };
}

export async function generateArtwork(uploadId: string): Promise<ArtworkResult> {
  const analysisJson = analysisStore.get(uploadId);
  if (!analysisJson) throw new Error("uploadId not found");

  const blob     = new Blob([analysisJson], { type: "text/plain" });
  const formData = new FormData();
  formData.append("audio_data", blob);

  const res  = await fetch(`${PYTHON_API}/generating`, { method: "POST", body: formData });
  const data = await res.json();

  if (data.status !== "success") throw new Error(data.error ?? "生成失敗");

  analysisStore.delete(uploadId);
  return {
    artworkId: crypto.randomUUID(),
    imageUrl:  `data:image/png;base64,${data.image_base64}`,
  };
}

export async function login(_email: string, _password: string): Promise<LoginResult> {
  return { userId: "mock-user-id" };
}

export async function saveArtwork(_artworkId: string): Promise<{ saved: true }> {
  return { saved: true };
}
