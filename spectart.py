from flask import Flask, request, jsonify, render_template
import requests
import urllib.parse
import os
import json
import random

app = Flask(__name__)
# 最大アップロードサイズを200MBに設定
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024
app.config['DEBUG'] = True
app.secret_key = "kou1118"

# Pollinations.ai
POLLINATIONS_URL = "https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024&nologo=true&model=flux"

# プロンプト生成関数
def create_prompt(output):
    try:

        data = json.loads(output)

        avg             = float(data['avg'])
        max_val         = float(data['max'])
        min_val         = float(data['min'])
        variance        = float(data['variance'])
        avg_first       = float(data['avgFirst'])
        avg_middle      = float(data['avgMiddle'])
        avg_last        = float(data['avgLast'])
        zero_crossings  = int(data['zeroCrossings'])
        rms             = float(data['rms'])
        rms_first       = float(data['rmsFirst'])
        rms_middle      = float(data['rmsMiddle'])
        rms_last        = float(data['rmsLast'])
        crest_factor    = float(data['crestFactor'])
        silence_ratio   = float(data['silenceRatio'])
        kurtosis        = float(data['kurtosis'])
        energy_variance = float(data['energyVariance'])
        energy_peaks    = int(data['energyPeaks'])
        zc_first        = float(data['zcRateFirst'])
        zc_middle       = float(data['zcRateMiddle'])
        zc_last         = float(data['zcRateLast'])

        # =====================================
        # 基本派生値
        # =====================================
        amplitude = max_val - min_val
        diff      = avg_last - avg_first

        calmness  = max(0.0, 1.0 - abs(diff) * 5)
        intensity = variance * amplitude

        sharpness = (
            (zero_crossings / 1000) * 0.4 +
            variance * 0.3 +
            amplitude * 0.3
        ) * (1 - calmness * 0.5)

        darkness = (abs(min_val) + variance + abs(avg)) / 3

        # 音の明るさ（ZCR平均：高いほど高音・明るい周波数帯域）
        avg_zc         = (zc_first + zc_middle + zc_last) / 3
        brightness     = min(1.0, avg_zc * 5)

        # 周波数変化（前半→後半で音域がどう変わったか）
        freq_evolution = zc_last - zc_first

        # 打楽器性（クレストファクター：高いほど鋭いアタック）
        percussiveness = min(1.0, max(0.0, (crest_factor - 1.4) / 15))

        # 衝撃性（尖度：突発的な音の多さ）
        impulsiveness  = min(1.0, max(0.0, (kurtosis - 3) / 20))

        # リズム性（エネルギー変動 × ピーク数）
        rhythmicity    = min(1.0, energy_variance * 500 + energy_peaks / 60)

        # エネルギーアーク（RMS推移から音量の時間的パターンを判定）
        if rms_middle > rms_first * 1.3 and rms_middle > rms_last * 1.3:
            energy_arc = "peak"
        elif rms_last > rms_first * 1.3:
            energy_arc = "rising"
        elif rms_first > rms_last * 1.3:
            energy_arc = "falling"
        else:
            energy_arc = "flat"

        # =====================================
        # ランダムシード（先に計算して乱数を固定）
        # =====================================
        seed = abs(int(
            avg * 100000 +
            variance * 10000 +
            zero_crossings +
            rms * 50000 +
            crest_factor * 1000
        ))
        random.seed(seed)

        # =====================================
        # 色（darkness の3段階：すべて白背景前提の水彩系）
        # =====================================
        if darkness > 0.6:
            # 音が重く・分散が大きい → クールで落ち着いたトーン
            palette = random.choice([
                "muted teal and sage green ink, smoky blue-gray, olive accents",
                "cool dusty lavender and slate blue, pale silver-green",
                "desaturated cobalt and warm taupe, soft gray-blue lines",
                "dusty turquoise and dull gold, muted slate gray"
            ])
        elif darkness > 0.3:
            # 中間 → 温冷のバランス
            palette = random.choice([
                "lime green and warm golden yellow, soft pink dot accents",
                "sage green and peach, warm amber curves, mint highlights",
                "fresh green and soft turquoise, scattered warm coral dots",
                "yellow-green and dusty rose, pale teal, warm cream"
            ])
        else:
            # 音が軽く・静か → 鮮やかで明るいトーン
            palette = random.choice([
                "bright coral and hot pink, vivid turquoise, warm gold",
                "vivid orange and crimson, electric cyan, golden yellow",
                "bright pink, tangerine, turquoise blue, warm coral",
                "hot pink and electric turquoise, warm amber, bright coral"
            ])

        # =====================================
        # 形状（sharpness + percussiveness + impulsiveness）
        # =====================================
        combined_sharpness = (
            sharpness * 0.5 +
            percussiveness * 0.35 +
            impulsiveness * 0.15
        )

        if combined_sharpness > 0.7:
            structure = (
                "explosive dense arc burst radiating from center, "
                "many overlapping jagged arcing curves, "
                "scattered ink splatter"
            )
            line_style = (
                "energetic fine ink strokes with sharp tension, "
                "bold confident lines"
            )
        elif combined_sharpness > 0.4:
            structure = (
                "flowing arcing ribbons radiating from center, "
                "layered organic curve clusters, "
                "moderate arc density"
            )
            line_style = (
                "smooth flowing ink lines with varied weight, "
                "graceful sweeping strokes"
            )
        else:
            structure = (
                "few long sweeping elegant curves from center, "
                "gentle spiral arcs, "
                "minimal delicate linework"
            )
            line_style = (
                "delicate hairline curves, "
                "gossamer thin ink strokes"
            )

        # =====================================
        # 密度（intensity）
        # =====================================
        if intensity > 0.8:
            density = (
                "densely layered intricate curves, "
                "rich complex overlapping composition"
            )
        elif intensity > 0.3:
            density = (
                "moderately layered curves, "
                "balanced visual weight"
            )
        else:
            density = (
                "sparse open composition, "
                "generous white space, "
                "few minimal marks"
            )

        # =====================================
        # 動き（エネルギーアーク）
        # =====================================
        if energy_arc == "peak":
            movement = (
                "radial explosion symmetry, "
                "curves bursting outward from center equally"
            )
        elif energy_arc == "rising":
            movement = (
                "upward sweeping curves, "
                "ascending spiral energy lifting outward"
            )
        elif energy_arc == "falling":
            movement = (
                "drooping curves spiraling inward, "
                "converging toward center"
            )
        else:
            movement = (
                "balanced circular arrangement, "
                "even radial distribution of curves"
            )

        # =====================================
        # リズム（energyVariance × energyPeaks）
        # =====================================
        if rhythmicity > 0.6 and energy_peaks > 25:
            rhythm = (
                "rhythmic repeating arc intervals, "
                "pulsating regular curve patterns"
            )
        elif rhythmicity > 0.35:
            rhythm = (
                "irregular organic bursts, "
                "natural rhythmic variation in curves"
            )
        else:
            rhythm = (
                "continuous uninterrupted flowing curves, "
                "no rhythmic repetition"
            )

        # =====================================
        # 空間（silenceRatio）
        # =====================================
        if silence_ratio > 0.5:
            space = (
                "vast white space dominant, "
                "isolated sparse marks floating"
            )
        elif silence_ratio > 0.25:
            space = (
                "balanced negative space, "
                "breathing room around curves"
            )
        else:
            space = (
                "marks filling the canvas, "
                "rich all-over composition"
            )

        # =====================================
        # 周波数キャラクター（ZCR + 変化方向）
        # =====================================
        if brightness > 0.6:
            if freq_evolution > 0.01:
                freq_char = (
                    "fine hairline delicate curves, "
                    "high-frequency detail brightening outward"
                )
            else:
                freq_char = (
                    "consistently fine delicate linework, "
                    "sustained high-frequency detail"
                )
        elif brightness < 0.2:
            if freq_evolution < -0.01:
                freq_char = (
                    "thicker bolder ink strokes deepening inward, "
                    "heavy graceful lines"
                )
            else:
                freq_char = (
                    "thick bold ink strokes throughout, "
                    "heavy expressive lines"
                )
        else:
            if abs(freq_evolution) > 0.01:
                freq_char = (
                    "varying line weights shifting across composition, "
                    "evolving stroke character"
                )
            else:
                freq_char = (
                    "uniform medium-weight curves, "
                    "consistent stroke character"
                )

        # =====================================
        # テクスチャ（データ連動）
        # =====================================
        if impulsiveness > 0.5:
            texture = "ink splatter clusters, explosive dot bursts around curves"
        elif silence_ratio > 0.5:
            texture = "soft watercolor bleeding edges, diffuse wash effects"
        elif rhythmicity > 0.5:
            texture = "repetitive layered brush accents, rhythmic stroke texture"
        elif percussiveness > 0.6:
            texture = "bold confident brushstroke accents, decisive ink marks"
        else:
            texture = random.choice([
                "scattered small ink dots",
                "soft watercolor wash accents",
                "delicate ink splatter particles",
                "fine dot clusters and washes",
                "translucent watercolor bleeds",
                "subtle ink texture variation"
            ])

        # =====================================
        # スタイル
        # =====================================
        if calmness > 0.7:
            style = "meditative abstract botanical ink illustration"
        elif intensity > 0.7:
            style = "explosive abstract generative ink art"
        else:
            style = "abstract generative ink illustration"

        # =====================================
        # 最終プロンプト
        # =====================================
        prompt = (
            f"{style}, "
            f"white background, "
            f"{palette}, "
            f"thin flowing curves radiating from center, "
            f"{structure}, "
            f"{line_style}, "
            f"{density}, "
            f"{movement}, "
            f"{rhythm}, "
            f"{space}, "
            f"{freq_char}, "
            f"{texture}, "
            f"scattered ink dot particles, "
            f"organic abstract botanical pattern, "
            f"watercolor wash, "
            f"non-representational fine art, "
            f"high detail, "
            f"seed {seed}"
        )

        # 保存
        os.makedirs("./prompts", exist_ok=True)

        number = len(os.listdir("./prompts")) + 1

        with open(
            f"./prompts/prompt_{number}.txt",
            "w",
            encoding="utf-8"
        ) as f:
            f.write(prompt)

        print("生成プロンプト:", prompt)

        return prompt

    except Exception as e:

        print("エラー:", e)

        return (
            "cinematic abstract artwork, "
            "flowing energy ribbons, "
            "dynamic glowing particles, "
            "high detail"
        )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start():
    try:
        # 音声データの受け取り
        file = request.files.get('audio_data')
        if not file:
            return jsonify({"error": "No file"}), 400

        path = "./upload_audio/audio_"
        number = len(os.listdir("./upload_audio")) + 1
        path += str(number) + ".txt"
        raw_data = file.read().decode('utf-8')
        with open(path, "w", encoding='utf-8') as f:
            f.write(raw_data)

        # プロンプト作成
        image_prompt = create_prompt(raw_data)

        # 画像生成
        url = POLLINATIONS_URL.format(prompt=urllib.parse.quote(image_prompt))
        response = requests.get(url, timeout=60)

        # 画像を保存
        if response.status_code != 200:
            return jsonify({"error": "Image generation failed"}), 500
        else:
            if not(os.path.isdir("./static/images")):
                os.makedirs("./static/images")
            number = len(os.listdir("./static/images")) + 1
            path = f"./static/images/generated_image_{number}.png"
            with open(path, "wb") as f:
                f.write(response.content)

        return jsonify({"status": "success"})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
