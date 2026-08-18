from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import requests
import os
import json
import random
from flask_cors import CORS
import base64

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024
app.config['DEBUG'] = True
app.secret_key = "kou1118"

# Hugging Face
HF_API_URL = "https://router.huggingface.co/nscale/v1/images/generations"
HF_MODEL = "black-forest-labs/FLUX.1-schnell"
HF_TOKEN = os.getenv("HF_TOKEN")

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
        # 生の特徴量は「曲によらずほぼ同じ値」になるものが多い。
        #   max/min      … マスタリング済みの曲はほぼ必ず ±1.0
        #   avg          … 波形の平均なのでほぼ必ず 0
        #   zeroCrossings… 曲の長さに比例して数百万になる
        # これらをそのまま使うと darkness / sharpness / calmness が
        # 常に同じ分岐に落ち、曲を変えても絵がほとんど変化しなかった。
        # そこで「音量に依存しない 0〜1 の指標」に作り直す。
        def norm(value, low, high):
            """value を low〜high の範囲で 0〜1 に正規化する"""
            if high <= low:
                return 0.0
            return min(1.0, max(0.0, (value - low) / (high - low)))

        # 正規化しただけだと今度は曲ごとの振れ幅が大きすぎ、
        # 同じシリーズの作品に見えなくなる。
        # 0.5 を中心に幅を縮め、変化はさせつつ作風は揃える。
        VARIATION = 0.55  # 1.0 で振れ幅そのまま、0.0 で全曲同じ

        def temper(value):
            """0〜1 の指標を中央寄りに圧縮する"""
            return 0.5 + (value - 0.5) * VARIATION

        # 音圧（実測 rms は 0.03〜0.35 程度）
        energy = norm(rms, 0.02, 0.30)

        # 音の明るさ（ZCR は 1 サンプルあたりの比率なので曲長に依存しない）
        avg_zc     = (zc_first + zc_middle + zc_last) / 3
        brightness = norm(avg_zc, 0.02, 0.30)

        # 周波数変化（前半→後半の相対変化）
        freq_evolution = (zc_last - zc_first) / (avg_zc + 1e-9)

        # 打楽器性（クレストファクター 2〜14 が実用域）
        percussiveness = norm(crest_factor, 2.0, 14.0)

        # 衝撃性（尖度：3 が正規分布。突発音が多いほど大きい）
        impulsiveness = norm(kurtosis, 2.0, 12.0)

        # ダイナミクス（エネルギー変動を平均エネルギー＝rms^2 で割り、音量非依存にする）
        dynamics = norm(
            (energy_variance ** 0.5) / (rms ** 2 + 1e-9),
            0.3, 2.5
        )

        # 以下、プロンプトの分岐に直接使う指標。
        # temper() で中央寄りに圧縮してから使う。
        # リズム性（山の数は最大 200 フレーム中の個数）
        rhythmicity = temper(norm(energy_peaks, 5, 55) * 0.6 + dynamics * 0.4)

        # 静けさ（silenceRatio はもともと 0〜1 なのでそのまま使える）
        sparseness = temper(min(1.0, silence_ratio * 2.0))

        # 起伏の大きさ＝密度。音圧とダイナミクスの合成
        intensity = temper(min(1.0, energy * 0.6 + dynamics * 0.4))

        # 鋭さ。打楽器性・衝撃性・明るさの合成
        sharpness = temper(min(1.0, percussiveness * 0.45 + impulsiveness * 0.3 + brightness * 0.25))

        # 静けさ（アタックが緩く、変動が小さいほど穏やか）
        calmness = temper(min(1.0, max(0.0, 1.0 - (percussiveness * 0.5 + dynamics * 0.5))))

        # 色調の重さ。低音寄り・高音圧ほど重い
        darkness = temper(min(1.0, max(0.0, (1.0 - brightness) * 0.6 + energy * 0.4)))

        # パレット選択・分岐に直接使うものも同様に圧縮する
        # （合成値の計算には圧縮前の値を使うため、ここでまとめて上書きする）
        brightness     = temper(brightness)
        percussiveness = temper(percussiveness)
        impulsiveness  = temper(impulsiveness)
        dynamics       = temper(dynamics)
        energy         = temper(energy)

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
            avg * 1000000 +
            variance * 100000 +
            rms * 50000 +
            crest_factor * 1000 +
            kurtosis * 500 +
            silence_ratio * 7919 +
            avg_zc * 100000 +
            energy_peaks * 31
        ))
        random.seed(seed)

        # =====================================
        # 色（darkness × brightness の 9 通り）
        # 以前は darkness の3段階だけで、しかも darkness が
        # ほぼ常に 0.33 付近に張り付いていたため色がほぼ固定だった。
        # =====================================
        PALETTES = {
            # (重さ, 明るさ) → その象限の候補
            ("dark",  "dull"):  [
                "deep indigo and charcoal ink washes, muted plum, cold steel blue",
                "dark forest green and burnt umber, heavy sepia ink, near-black accents",
            ],
            ("dark",  "mid"):   [
                "muted teal and sage green washes, smoky blue-gray, pale olive accents",
                "desaturated cobalt and warm taupe, moody slate gray, dull ochre",
            ],
            ("dark",  "bright"):[
                "deep violet and magenta ink, electric indigo, sharp cyan highlights",
                "dark crimson and burnt orange, hot pink accents, blackened edges",
            ],
            ("mid",   "dull"):  [
                "dusty rose and warm taupe washes, muted brick red, soft clay brown",
                "olive green and mustard ochre, faded terracotta, warm gray",
            ],
            ("mid",   "mid"):   [
                "sage green and pale peach, warm amber arcs, mint highlights",
                "fresh spring green and soft turquoise, scattered warm coral dots",
            ],
            ("mid",   "bright"):[
                "vivid coral and turquoise, warm golden yellow, bright pink dots",
                "tangerine orange and emerald green, sunny yellow, punchy accents",
            ],
            ("light", "dull"):  [
                "pale silver-gray and soft dove blue, faint beige, whisper-quiet tones",
                "washed-out lavender and pale sand, barely-there gray-green",
            ],
            ("light", "mid"):   [
                "light coral pink and soft turquoise washes, warm pale gold, cheerful pastel",
                "pale pink, apricot, sky turquoise, watery coral, delicate pastel tones",
            ],
            ("light", "bright"):[
                "bright lemon yellow and sky blue, fresh mint, playful candy pink",
                "luminous aqua and sunny yellow, light magenta, airy and radiant",
            ],
        }

        weight_key = "dark" if darkness > 0.6 else ("mid" if darkness > 0.35 else "light")
        bright_key = "bright" if brightness > 0.6 else ("mid" if brightness > 0.3 else "dull")
        palette = random.choice(PALETTES[(weight_key, bright_key)])

        # =====================================
        # 構図アーキタイプ
        # プロンプト前方に置く「絵の骨格」を曲ごとに切り替える。
        # ただし骨格ごと別物にすると同じシリーズに見えなくなるため、
        # どの分岐も「中央の丸い塊」を土台に、性格づけだけを変える。
        # =====================================
        base_form = "a loose round cluster of overlapping circular brush loops in the middle of the paper"

        if sparseness > 0.62 and intensity < 0.45:
            # 静寂が多く音圧も低い → 塊がほどけて散りぎみ
            composition = (
                f"{base_form}, "
                "the outer loops breaking away into a few small separate clusters, "
                "quiet gaps of bare paper around them"
            )
        elif rhythmicity > 0.6 and percussiveness > 0.5:
            # リズムが強く立っている → 同心円の反復
            composition = (
                f"{base_form}, "
                "the loops arranged as concentric rings expanding outward like ripples, "
                "gently rhythmic spacing"
            )
        elif dynamics > 0.6 and impulsiveness > 0.55:
            # 変動も突発音も大きい → 片側に流れる勢い
            composition = (
                f"{base_form}, "
                "slightly off-center with loops flung out to one side, "
                "trailing arcs and splatter following them"
            )
        elif calmness > 0.6 and energy < 0.42:
            # 穏やかで低音圧 → 横に伸びた穏やかな塊
            composition = (
                f"{base_form}, "
                "stretched gently sideways into long sweeping horizontal curves, "
                "calm and unhurried"
            )
        elif energy > 0.62 and intensity > 0.58:
            # 高音圧で密 → 密に絡まって画面を広く占める
            composition = (
                f"{base_form}, "
                "densely tangled and spreading wide across the canvas, "
                "layers piling up into deeper saturated cores"
            )
        else:
            # 標準
            composition = f"{base_form}, asymmetric and irregular"

        # =====================================
        # 形状（sharpness）
        # =====================================
        combined_sharpness = sharpness

        if combined_sharpness > 0.7:
            structure = (
                "many overlapping circular brush loops and incomplete rings, "
                "tangled crescent arcs painted in one stroke, "
                "energetic scattered ink splatter across the paper"
            )
            line_style = (
                "loaded round brush strokes with dry-brush edges, "
                "confident hand-painted curves of uneven width"
            )
        elif combined_sharpness > 0.4:
            structure = (
                "overlapping circular brush loops and open rings, "
                "layered crescent arcs curving back on themselves, "
                "moderate tangle of hand-painted curves"
            )
            line_style = (
                "smooth wet brush strokes with varied width, "
                "graceful sweeping curved marks, soft blurred edges"
            )
        else:
            structure = (
                "a few large open circular brush loops, "
                "gentle sparse crescent arcs, "
                "minimal delicate hand-painted linework"
            )
            line_style = (
                "thin diluted brush lines, "
                "translucent pale strokes fading out"
            )

        # =====================================
        # 密度（intensity）
        # =====================================
        if intensity > 0.62:
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
                "open airy composition with room between the loops, "
                "fewer but larger sweeping curves"
            )

        # =====================================
        # 動き（エネルギーアーク）
        # =====================================
        if energy_arc == "peak":
            movement = (
                "densest tangle of loops in the middle, "
                "loops loosening and thinning toward the outer edge"
            )
        elif energy_arc == "rising":
            movement = (
                "loops drifting and growing toward the upper area, "
                "lighter marks at the bottom"
            )
        elif energy_arc == "falling":
            movement = (
                "loops settling toward the lower area, "
                "wet paint drips running down the paper"
            )
        else:
            movement = (
                "loosely round cluster of loops, "
                "irregular asymmetric arrangement, hand-made imperfection"
            )

        # =====================================
        # リズム（energyVariance × energyPeaks）
        # =====================================
        if rhythmicity > 0.6:
            rhythm = (
                "loops repeating at similar intervals, "
                "pulsating layered ring patterns"
            )
        elif rhythmicity > 0.35:
            rhythm = (
                "irregular organic clusters of loops, "
                "natural variation in curve size"
            )
        else:
            rhythm = (
                "long continuous unbroken loops, "
                "calm uninterrupted curves"
            )

        # =====================================
        # 空間（silenceRatio）
        # =====================================
        if sparseness > 0.6:
            space = (
                "wide quiet gaps of bare paper between the loops, "
                "airy and unhurried"
            )
        elif sparseness > 0.3:
            space = (
                "balanced negative space, "
                "breathing room between the curves"
            )
        else:
            space = (
                "loops crowding together and overlapping heavily, "
                "rich all-over composition"
            )

        # =====================================
        # 周波数キャラクター（ZCR + 変化方向）
        # =====================================
        if brightness > 0.6:
            if freq_evolution > 0.15:
                freq_char = (
                    "fine hairline delicate curves, "
                    "high-frequency detail brightening outward"
                )
            else:
                freq_char = (
                    "consistently fine delicate linework, "
                    "sustained high-frequency detail"
                )
        elif brightness < 0.38:
            if freq_evolution < -0.15:
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
            if abs(freq_evolution) > 0.15:
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
            texture = "flicked ink splatter clusters, spray of tiny paint droplets around the loops"
        elif sparseness > 0.6:
            texture = "soft wet-on-wet bleeding edges, diffuse pigment blooms on damp paper"
        elif rhythmicity > 0.5:
            texture = "layered translucent washes overlapping into darker tones where they cross"
        elif percussiveness > 0.6:
            texture = "decisive loaded brushstrokes with dry-brush breaks and hard edges"
        else:
            texture = random.choice([
                "scattered small ink dots and speckles",
                "soft watercolour wash accents",
                "delicate splatter particles of paint",
                "fine dot clusters and pooled pigment edges",
                "translucent watercolour bleeds",
                "granulating pigment settling into the paper grain"
            ])

        # =====================================
        # スタイル
        # =====================================
        if calmness > 0.65:
            style = "quiet meditative minimal abstract watercolour painting"
        elif sharpness > 0.65 and intensity > 0.6:
            style = "violent explosive abstract ink and watercolour painting"
        elif intensity > 0.65:
            style = "energetic expressive abstract watercolour and ink painting"
        elif sparseness > 0.6:
            style = "sparse delicate abstract watercolour study"
        else:
            style = "abstract watercolour and ink painting"

        # =====================================
        # 画面占有率
        # 疎な構図のときに「画面いっぱい」と指示すると矛盾するため、
        # intensity に応じて切り替える
        # =====================================
        if intensity > 0.58:
            scale = "large scale artwork filling the frame, not a small drawing on empty paper"
        elif intensity > 0.38:
            scale = "artwork occupying most of the frame with clear margins"
        else:
            scale = "artwork occupying the centre of the frame with generous margins"

        # =====================================
        # 最終プロンプト
        # =====================================
        # 画材・支持体を最優先で指定し、次に構図・データ由来の特徴を並べる。
        # （FLUX は前方の語ほど強く効くため）
        prompt = (
            f"{style}, "
            f"hand painted with watercolour, diluted ink and a loaded round brush "
            f"on rough cold press watercolour paper with visible paper grain, "
            f"off-white natural paper background, "
            f"{palette}, "
            f"all of these colours clearly present and mixing together, "
            f"{composition}, "
            f"{structure}, "
            f"{line_style}, "
            f"{density}, "
            f"{movement}, "
            f"{rhythm}, "
            f"{space}, "
            f"{freq_char}, "
            f"{texture}, "
            f"transparent layered washes, colours bleeding into each other, "
            f"paint drips and splatter, "
            f"rough textured watercolour paper grain visible through the washes, "
            f"traditional media, painterly, non-representational fine art, "
            f"organic and imperfect, no symmetry, no mandala, "
            f"{scale}, "
            f"not vector art, not digital illustration, no sharp radiating spikes"
        )

        # 保存
        os.makedirs("./prompts", exist_ok=True)

        number = len(os.listdir("./prompts"))

        with open(
            f"./prompts/prompt_{number}.txt",
            "w",
            encoding="utf-8"
        ) as f:
            f.write(prompt)

        print("生成プロンプト:", prompt)

        # シードはプロンプト本文ではなく API パラメータとして渡す
        return prompt, seed % (2 ** 31)

    except Exception as e:

        print("エラー:", e)

        return (
            "abstract watercolour and ink painting, "
            "hand painted on rough cold press watercolour paper, "
            "off-white paper background, "
            "loose cluster of overlapping circular brush loops, "
            "soft pastel washes, ink splatter, transparent layered colours, "
            "traditional media, painterly, non-representational fine art"
        ), random.randrange(2 ** 31)


@app.route('/generating', methods=['POST'])
def generating():
    try:
        # 音声データの受け取り
        file = request.files.get('audio_data')
        if not file:
            return jsonify({"error": "No file"}), 400

        os.makedirs("./upload_audio", exist_ok=True)
        path = "./upload_audio/audio_"
        number = len(os.listdir("./upload_audio"))
        path += str(number) + ".txt"
        raw_data = file.read().decode('utf-8')
        with open(path, "w", encoding='utf-8') as f:
            f.write(raw_data)

        # プロンプト作成
        image_prompt, image_seed = create_prompt(raw_data)

        # 画像生成
        response = requests.post(
            HF_API_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={
                "model": HF_MODEL,
                "prompt": image_prompt,
                "n": 1,
                "size": "1024x1024",
                "seed": image_seed,
                "response_format": "b64_json"
            },
            timeout=120
        )

        if response.status_code != 200:
            print(f"HuggingFace error: {response.status_code} {response.text[:500]}")
            return jsonify({"error": f"Image generation failed (HTTP {response.status_code})"}), 500

        # レスポンスは {"data": [{"b64_json": "..."}]} 形式
        image_b64 = response.json()["data"][0]["b64_json"]

        # 画像を保存
        os.makedirs("./static/images", exist_ok=True)
        number = len(os.listdir("./static/images"))
        path = f"./static/images/generated_image_{number}.png"
        with open(path, "wb") as f:
            f.write(base64.b64decode(image_b64))

        return jsonify({"status": "success", "image_base64": image_b64})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, use_reloader=False)
