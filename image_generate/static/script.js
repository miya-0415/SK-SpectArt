document.addEventListener("DOMContentLoaded", () => {
    const audioCtx = new AudioContext();
    const fileInput = document.getElementById("file");
    const startButton = document.getElementById("start_button");
    
    let processedDataString = ""; // サーバーに送るためのテキストデータを保持

    fileInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const output = document.getElementById("output");
        const outputHeader = document.getElementById("output-header");
        if (!file) {
            outputHeader.innerHTML = "解析失敗";
            return;
        } else {
            outputHeader.innerHTML = "解析中...";
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const rawData = audioBuffer.getChannelData(0); // Float32Array
        
        const data = Array.from(rawData);

        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        let max = data[0];
        let min = data[0];

        for (let i = 1; i < data.length; i++) {
            if (data[i] > max) max = data[i];
            if (data[i] < min) min = data[i];
        }

        const variance = data.reduce((sum, x) => {
            return sum + Math.pow(x - avg, 2);
        }, 0) / data.length;

        // セクション分割
        const third       = Math.floor(data.length / 3);
        const firstSlice  = data.slice(0, third);
        const middleSlice = data.slice(third, third * 2);
        const lastSlice   = data.slice(third * 2);

        // 平均（セクション別）
        const avgFirst  = firstSlice.reduce((a, b) => a + b, 0) / firstSlice.length;
        const avgMiddle = middleSlice.reduce((a, b) => a + b, 0) / middleSlice.length;
        const avgLast   = lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length;

        // RMS（実効値：ラウドネスの正確な指標）
        const rms       = Math.sqrt(data.reduce((s, x) => s + x * x, 0) / data.length);
        const rmsFirst  = Math.sqrt(firstSlice.reduce((s, x) => s + x * x, 0) / firstSlice.length);
        const rmsMiddle = Math.sqrt(middleSlice.reduce((s, x) => s + x * x, 0) / middleSlice.length);
        const rmsLast   = Math.sqrt(lastSlice.reduce((s, x) => s + x * x, 0) / lastSlice.length);

        // クレストファクター（ピーク÷RMS：打楽器性・アタック感の指標）
        const crestFactor = rms > 0.0001 ? Math.abs(max) / rms : 1;

        // 無音率（|x| < 0.01 のサンプルの割合）
        let silentCount = 0;
        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i]) < 0.01) silentCount++;
        }
        const silenceRatio = silentCount / data.length;

        // 尖度（Kurtosis：分布の鋭さ、突発的な音の多さ）
        const kurtosis = variance > 0
            ? data.reduce((s, x) => s + Math.pow(x - avg, 4), 0) / data.length / (variance * variance)
            : 3;

        // エネルギーフレーム（音量の時間変化を200フレームで追跡）
        const frameSize = Math.max(1, Math.floor(data.length / 200));
        const energyFrames = [];
        for (let i = 0; i < data.length; i += frameSize) {
            const end = Math.min(i + frameSize, data.length);
            let esum = 0;
            for (let j = i; j < end; j++) esum += data[j] * data[j];
            energyFrames.push(esum / (end - i));
        }
        const energyMean = energyFrames.reduce((a, b) => a + b, 0) / energyFrames.length;
        const energyVariance = energyFrames.reduce((s, e) => s + Math.pow(e - energyMean, 2), 0) / energyFrames.length;

        // エネルギーピーク数（ビート・アタック数の近似）
        let energyPeaks = 0;
        for (let i = 1; i < energyFrames.length - 1; i++) {
            if (energyFrames[i] > energyFrames[i - 1] &&
                energyFrames[i] > energyFrames[i + 1] &&
                energyFrames[i] > energyMean * 1.5) {
                energyPeaks++;
            }
        }

        // ゼロクロッシング数（全体）
        let zeroCrossings = 0;
        for (let i = 1; i < data.length; i++) {
            if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) {
                zeroCrossings++;
            }
        }

        // ゼロクロッシング率（各セクション：周波数成分の時間変化）
        function zcRate(arr) {
            let count = 0;
            for (let i = 1; i < arr.length; i++) {
                if ((arr[i - 1] >= 0 && arr[i] < 0) || (arr[i - 1] < 0 && arr[i] >= 0)) count++;
            }
            return arr.length > 1 ? count / arr.length : 0;
        }
        const zcRateFirst  = zcRate(firstSlice);
        const zcRateMiddle = zcRate(middleSlice);
        const zcRateLast   = zcRate(lastSlice);

        processedDataString = JSON.stringify({
            avg, max, min, variance,
            avgFirst, avgMiddle, avgLast,
            zeroCrossings,
            rms, rmsFirst, rmsMiddle, rmsLast,
            crestFactor,
            silenceRatio,
            kurtosis,
            energyVariance,
            energyPeaks,
            zcRateFirst, zcRateMiddle, zcRateLast
        });

        // 結果を画面に表示
        outputHeader.innerHTML = "解析完了";
        output.innerHTML = `
            <p>ファイル: ${file.name}</p>
            <p>サンプル数: ${rawData.length}</p>
        `;
        
        console.log("解析完了。サイズ:", (new Blob([processedDataString]).size / 1024).toFixed(2), "KB");
    });

    // サーバーへデータ送信
    startButton.addEventListener("click", () => {
        const outputHeader = document.getElementById("output-header");

        if (!processedDataString) {
            alert("先にファイルを選択して解析を完了させてください");
            return;
        }

        // テキストとして送信
        const blob = new Blob([processedDataString], { type: "text/plain" });
        const formData = new FormData();
        formData.append("audio_data", blob);

        outputHeader.innerHTML = "送信中...";
        console.log("送信を開始");

        fetch("/start", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            console.log("成功:", result);
            if (result.status === "success") {
                outputHeader.innerHTML = "画像生成完了";
                const container = document.getElementById("image-container");
                const img = document.createElement("img");
                img.src = result.image_url;
                img.style.maxWidth = "100%";
                container.innerHTML = "";
                container.appendChild(img);
            } else {
                outputHeader.innerHTML = "画像生成失敗";
                alert("画像生成に失敗しました: " + (result.error || "不明なエラー"));
            }
        })
        .catch(error => {
            console.error("エラー:", error);
            alert("送信に失敗しました。サーバーの設定を確認してください。");
        });
    });
});