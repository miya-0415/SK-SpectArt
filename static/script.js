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

        const third = Math.floor(data.length / 3);

        const avgFirst =
            data.slice(0, third).reduce((a, b) => a + b, 0) / third;

        const avgMiddle =
            data.slice(third, third * 2).reduce((a, b) => a + b, 0) / third;

        const avgLast =
            data.slice(third * 2).reduce((a, b) => a + b, 0) / (data.length - third * 2);

        let zeroCrossings = 0;

        for (let i = 1; i < data.length; i++) {
            if (
                (data[i - 1] >= 0 && data[i] < 0) ||
                (data[i - 1] < 0 && data[i] >= 0)
            ) {
                zeroCrossings++;
            }
        }

        processedDataString = JSON.stringify({
            avg: avg,
            max: max,
            min: min,
            variance: variance,
            avgFirst: avgFirst,
            avgMiddle: avgMiddle,
            avgLast: avgLast,
            zeroCrossings: zeroCrossings
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
                // アップロード成功後、トップページへ移動
                window.location.href = "/";
            }
        })
        .catch(error => {
            console.error("エラー:", error);
            alert("送信に失敗しました。サーバーの設定を確認してください。");
        });
    });
});