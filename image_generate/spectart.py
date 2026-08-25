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

# fal.ai（FLUX.2 [dev]）
# FLUX.1-schnell は4ステップの蒸留モデルで、長いプロンプトの後半が
# ほとんど効かなかった。追従力を上げるため FLUX.2 [dev] に移行する。
FAL_API_URL = "https://fal.run/fal-ai/flux-2"
FAL_KEY = os.getenv("FAL_KEY")

# 推論パラメータは明示的に固定する。
# 省略するとプロバイダ側の既定値に依存し、既定値が変わると
# 同じプロンプトでも絵柄が変わってしまうため。
FAL_STEPS = int(os.getenv("FAL_STEPS", "28"))
FAL_GUIDANCE = float(os.getenv("FAL_GUIDANCE", "2.5"))



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

        # 指標のレンジは手元の音声データの実測分布に合わせてある。
        # 広すぎるレンジだと brightness / dynamics / sparseness / rhythmicity が
        # 低い側に張り付き、曲を変えても同じ分岐にしか落ちなかった。
        ZC_RANGE   = (0.015, 0.085)   # 実測 avg_zc ≒ 0.015〜0.08
        DYN_RANGE  = (0.35, 0.90)     # 実測 ≒ 0.37〜0.83
        SIL_RANGE  = (0.04, 0.12)     # 実測 silenceRatio ≒ 0.047〜0.104
        PEAK_RANGE = (8, 34)          # 実測 energyPeaks ≒ 10〜31
        ARC_RATIO  = 1.08             # 1.3 では全曲 flat になる

        # 音圧（実測 rms は 0.03〜0.35 程度）
        energy = norm(rms, 0.02, 0.30)

        # 音の明るさ（ZCR は 1 サンプルあたりの比率なので曲長に依存しない）
        avg_zc     = (zc_first + zc_middle + zc_last) / 3
        brightness = norm(avg_zc, *ZC_RANGE)

        # 周波数変化（前半→後半の相対変化）
        freq_evolution = (zc_last - zc_first) / (avg_zc + 1e-9)

        # 打楽器性（クレストファクター 2〜14 が実用域）
        percussiveness = norm(crest_factor, 2.0, 14.0)

        # 衝撃性（尖度：3 が正規分布。突発音が多いほど大きい）
        impulsiveness = norm(kurtosis, 2.0, 12.0)

        # ダイナミクス（エネルギー変動を平均エネルギー＝rms^2 で割り、音量非依存にする）
        dynamics = norm(
            (energy_variance ** 0.5) / (rms ** 2 + 1e-9),
            *DYN_RANGE
        )

        # 以下、プロンプトの分岐に直接使う指標。
        # temper() で中央寄りに圧縮してから使う。
        # リズム性（山の数は最大 200 フレーム中の個数）
        rhythmicity = temper(norm(energy_peaks, *PEAK_RANGE) * 0.6 + dynamics * 0.4)

        # 静けさ（silenceRatio はもともと 0〜1 なのでそのまま使える）
        sparseness = temper(norm(silence_ratio, *SIL_RANGE))

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
        if rms_middle > rms_first * ARC_RATIO and rms_middle > rms_last * ARC_RATIO:
            energy_arc = "peak"
        elif rms_last > rms_first * ARC_RATIO:
            energy_arc = "rising"
        elif rms_first > rms_last * ARC_RATIO:
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
        # 色（曲の激しさで色相を決める）
        # =====================================
        # 以前は darkness × brightness の9象限だったが、
        # 「暗さ」を軸にしたため黒〜セピアばかりが選ばれていた。
        # 激しい曲＝赤・橙・黄、静かな曲＝青・モノクロ、
        # 中間＝緑、という対応に作り直す。
        # 濃淡は brightness で振り、同じ群でも単調にならないようにする。
        PALETTES = {
            # 激しい：暖色
            ("hot",  "vivid"): [
                "vivid scarlet and burning orange, cadmium yellow, hot crimson accents",
                "blazing orange and golden yellow, deep red bursts, warm ember tones",
            ],
            ("hot",  "deep"): [
                "deep rust red and burnt orange, dark amber, smouldering brick tones",
                "brick red and ochre, muted terracotta, dull gold accents",
            ],
            # 中間：緑
            ("mid",  "vivid"): [
                "fresh emerald and lime green, bright chartreuse, soft mint highlights",
                "spring green and clear teal, warm yellow-green, fresh leaf tones",
            ],
            ("mid",  "deep"): [
                "deep forest green and olive, muted sage, quiet moss tones",
                "dark jade and moss green, dusty olive, soft grey-green",
            ],
            # 静か：寒色・モノクロ
            ("cold", "vivid"): [
                "clear cobalt blue and pale ice blue, soft cyan, cool open white",
                "luminous azure and pale turquoise, silver-grey, cool light tones",
            ],
            ("cold", "deep"): [
                "black and white monochrome, soft charcoal greys, pale silver",
                "quiet indigo and slate grey, near monochrome, muted blue-black",
            ],
        }

        # 激しさの軸。手元データで intensity は 0.31〜0.72 に散るため、
        # 0.40 / 0.55 で三分割すると各群にきちんと曲が入る。
        if intensity > 0.55:
            heat_key = "hot"
        elif intensity < 0.40:
            heat_key = "cold"
        else:
            heat_key = "mid"

        tone_key = "vivid" if brightness > 0.45 else "deep"
        palette = random.choice(PALETTES[(heat_key, tone_key)])

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
            sharp_key = "high"
        elif combined_sharpness > 0.4:
            sharp_key = "mid"
        else:
            sharp_key = "low"

        STRUCTURES = {
            "high": (
                "many overlapping circular brush loops and incomplete rings, "
                "tangled crescent arcs painted in one stroke, "
                "energetic scattered ink splatter across the paper"
            ),
            "mid": (
                "overlapping circular brush loops and open rings, "
                "layered crescent arcs curving back on themselves, "
                "moderate tangle of hand-painted curves"
            ),
            "low": (
                "a few large open circular brush loops, "
                "gentle sparse crescent arcs, "
                "minimal delicate hand-painted linework"
            ),
        }
        structure = STRUCTURES[sharp_key]

        LINE_STYLES = {
            "high": (
                "loaded round brush strokes with dry-brush edges, "
                "confident hand-painted curves of uneven width"
            ),
            "mid": (
                "smooth wet brush strokes with varied width, "
                "graceful sweeping curved marks, soft blurred edges"
            ),
            "low": (
                "thin crisp brush lines, "
                "pale strokes with clean ends"
            ),
        }
        line_style = LINE_STYLES[sharp_key]

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
                "strokes stacking up along the lower edge"
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
            texture = "clean tapered stroke ends"
        elif rhythmicity > 0.5:
            texture = "strokes overlapping into solid darker tones where they cross"
        elif percussiveness > 0.6:
            texture = "decisive loaded brushstrokes with dry-brush breaks and hard edges"
        else:
            texture = random.choice([
                "scattered small ink dots and speckles",
                "flat blocks of muted colour",
                "delicate splatter particles of paint",
                "fine crisp dot clusters",
                "flat overlapping colour",
                "dry-brush texture breaking up the stroke"
            ])

        # =====================================
        # スタイル
        # =====================================
        if calmness > 0.65:
            style_key = "calm"
        elif sharpness > 0.65 and intensity > 0.6:
            style_key = "violent"
        elif intensity > 0.65:
            style_key = "energetic"
        elif sparseness > 0.6:
            style_key = "sparse"
        else:
            style_key = "default"

        # プロンプト先頭に置かれる語。FLUX は前方ほど強く効くため、
        # ここが作風を決定づける。
        STYLES = {
            "calm":      "quiet meditative minimal abstract painting",
            "violent":   "violent explosive abstract painting in ink and opaque matte paint",
            "energetic": "energetic expressive abstract painting in opaque matte paint and ink",
            "sparse":    "sparse delicate abstract painted study",
            "default":   "abstract painting in opaque matte paint and ink",
        }
        style = STYLES[style_key]

        # =====================================
        # 画面占有率
        # 疎な構図のときに「画面いっぱい」と指示すると矛盾するため、
        # intensity に応じて切り替える
        # =====================================
        if intensity > 0.58:
            scale_key = "large"
        elif intensity > 0.38:
            scale_key = "medium"
        else:
            scale_key = "small"

        SCALES = {
            "large":  "large scale artwork filling the frame, not a small drawing on empty paper",
            "medium": "artwork occupying most of the frame with clear margins",
            "small":  "artwork occupying the centre of the frame with generous margins",
        }
        scale = SCALES[scale_key]

        # =====================================
        # 最終プロンプト
        # =====================================
        # 画材・支持体を最優先で指定し、次に構図・データ由来の特徴を並べる。
        # （FLUX は前方の語ほど強く効くため）
        medium = (
            "hand painted with opaque matte paint and solid ink using a loaded round brush "
            "on a smooth flat ground, "
            "plain off-white background, "
        )
        colour_note = "these colours kept distinct and unblended"
        finish = (
            "layered flat colour with clean hard edges, "
            "sharp flicked splatter, "
            "flat bare ground visible between the strokes, "
            "matte opaque paint, graphic and painterly, non-representational fine art, "
        )
        # 水彩寄りに振れないよう明示的に否定する
        negative = (
            "not vector art, not digital illustration, no sharp radiating spikes, "
            "not watercolour, no colour washes, no wet bleeding, "
            "no soft blurred edges, no visible paper texture"
        )

        prompt = (
            f"{style}, "
            f"{medium}"
            f"{palette}, "
            f"{colour_note}, "
            f"{composition}, "
            f"{structure}, "
            f"{line_style}, "
            f"{density}, "
            f"{movement}, "
            f"{rhythm}, "
            f"{space}, "
            f"{freq_char}, "
            f"{texture}, "
            f"{finish}"
            f"organic and imperfect, no symmetry, no mandala, "
            f"{scale}, "
            f"{negative}"
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
            "abstract painting in opaque matte paint and ink, "
            "hand painted on a smooth flat ground, "
            "off-white paper background, "
            "loose cluster of overlapping circular brush loops, "
            "ink splatter, layered flat colour, "
            "matte opaque paint, graphic and painterly, non-representational fine art"
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

        if not FAL_KEY:
            print("FAL_KEY が設定されていません（image_generate/.env を確認）")
            return jsonify({"error": "FAL_KEY is not configured"}), 500

        # 画像生成
        response = requests.post(
            FAL_API_URL,
            headers={
                "Authorization": f"Key {FAL_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "prompt": image_prompt,
                "image_size": "square_hd",   # 1024x1024
                "num_images": 1,
                "seed": image_seed,
                "num_inference_steps": FAL_STEPS,
                "guidance_scale": FAL_GUIDANCE,
                "output_format": "png",
                # 自前で組み立てたプロンプトを勝手に書き換えられないようにする
                "enable_prompt_expansion": False,
                # 画像をURLではなくデータURIで直接返してもらう
                "sync_mode": True,
            },
            timeout=180
        )

        if response.status_code != 200:
            print(f"fal.ai error: {response.status_code} {response.text[:500]}")
            return jsonify({"error": f"Image generation failed (HTTP {response.status_code})"}), 500

        # レスポンスは {"images": [{"url": ...}], "seed": ...} 形式。
        # url は sync_mode ならデータURI、そうでなければ配信URLになる。
        images = response.json().get("images") or []
        if not images:
            print(f"fal.ai returned no images: {response.text[:500]}")
            return jsonify({"error": "Image generation returned no images"}), 500

        image_url = images[0]["url"]
        if image_url.startswith("data:"):
            image_bytes = base64.b64decode(image_url.split(",", 1)[1])
        else:
            image_res = requests.get(image_url, timeout=60)
            if image_res.status_code != 200:
                print(f"image download failed: {image_res.status_code}")
                return jsonify({"error": "Failed to download generated image"}), 500
            image_bytes = image_res.content

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        # 画像を保存
        os.makedirs("./static/images", exist_ok=True)
        number = len(os.listdir("./static/images"))
        path = f"./static/images/generated_image_{number}.png"
        with open(path, "wb") as f:
            f.write(image_bytes)

        return jsonify({"status": "success", "image_base64": image_b64})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, use_reloader=False)
