from flask import Flask, request, jsonify, render_template
import requests
import os
import json
import hashlib
import random

app = Flask(__name__)
# 最大アップロードサイズを200MBに設定
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024
app.config['DEBUG'] = True
app.secret_key = "kou1118"

# Hugging Face
HF_TOKEN = "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"
API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
hf_headers = {"Authorization": f"Bearer {HF_TOKEN}"}

# プロンプト生成関数
def create_prompt(output):
    try:

        data = json.loads(output)

        avg = float(data['avg'])
        max_val = float(data['max'])
        min_val = float(data['min'])
        variance = float(data['variance'])
        avg_first = float(data['avgFirst'])
        avg_middle = float(data['avgMiddle'])
        avg_last = float(data['avgLast'])
        zero_crossings = int(data['zeroCrossings'])

        # =====================================
        # 基本値
        # =====================================
        amplitude = max_val - min_val
        diff = avg_last - avg_first

        calmness = max(0, 1 - abs(diff) * 5)

        intensity = variance * amplitude

        sharpness = (
            (zero_crossings / 1000) * 0.4 +
            variance * 0.3 +
            amplitude * 0.3
        )

        sharpness *= (1 - calmness * 0.5)

        darkness = (
            abs(min_val) +
            variance +
            abs(avg)
        ) / 3

        # =====================================
        # 色
        # =====================================
        if darkness > 0.6:
            palette = random.choice([
                "deep black, cobalt blue, electric cyan glow",
                "midnight navy, dark indigo, violet highlights",
                "cold blue gradients, black shadows, neon cyan accents",
                "dark cinematic blue atmosphere"
            ])

        elif darkness > 0.3:
            palette = random.choice([
                "muted teal, deep navy, soft purple glow",
                "cool cyan gradients with blue highlights",
                "desaturated blue and violet atmosphere",
                "soft dark turquoise and indigo"
            ])

        else:
            palette = random.choice([
                "bright orange, pink, cyan energy glow",
                "vivid turquoise and coral highlights",
                "warm yellow, magenta, electric cyan",
                "bright cinematic pastel lighting"
            ])

        # =====================================
        # 形状
        # =====================================
        if sharpness > 0.8:

            structure = (
                "complex fractured energy structures, "
                "dynamic angular motion, "
                "layered sharp motion trails"
            )

            line_style = (
                "high contrast glowing edges, "
                "energetic sharp accents"
            )

        elif sharpness > 0.5:

            structure = (
                "interwoven flowing ribbons, "
                "layered dynamic curves, "
                "subtle angular accents"
            )

            line_style = (
                "smooth energetic strokes "
                "with flowing motion"
            )

        else:

            structure = (
                "soft fluid motion, "
                "floating layered ribbons, "
                "atmospheric flowing curves"
            )

            line_style = (
                "smooth elegant flowing structures"
            )

        # =====================================
        # 密度
        # =====================================
        if intensity > 0.8:

            density = (
                "extremely dense layered composition, "
                "immersive energy field"
            )

        elif intensity > 0.3:

            density = (
                "rich layered composition, "
                "dynamic overlapping motion"
            )

        else:

            density = (
                "open atmospheric composition, "
                "gentle spatial balance"
            )

        # =====================================
        # 動き
        # =====================================
        if diff > 0.1:

            movement = (
                "expanding outward energy flow, "
                "rising motion dynamics"
            )

        elif diff < -0.1:

            movement = (
                "collapsing inward atmosphere, "
                "fragmented drifting motion"
            )

        else:

            movement = (
                "balanced floating energy motion"
            )

        # =====================================
        # テクスチャ
        # =====================================
        textures = [
            "layered translucent particles",
            "volumetric light diffusion",
            "cinematic glowing atmosphere",
            "flowing energy textures",
            "misty particle fields",
            "soft illuminated gradients",
            "dynamic light streaks",
            "immersive translucent layers"
        ]

        texture = random.choice(textures)

        # =====================================
        # スタイル
        # =====================================
        if calmness > 0.7:

            style = (
                "cinematic abstract ambient artwork"
            )

        elif intensity > 0.7:

            style = (
                "experimental high energy audio visualization"
            )

        else:

            style = (
                "cinematic audio reactive abstract artwork"
            )

        # =====================================
        # ランダムシード
        # =====================================
        seed = abs(
            int(
                avg * 100000 +
                variance * 10000 +
                zero_crossings
            )
        )

        # =====================================
        # 最終プロンプト
        # =====================================
        prompt = (
            f"{style}, "
            f"experimental electronic album cover art, "
            f"{palette}, "
            f"{structure}, "
            f"{line_style}, "
            f"{density}, "
            f"{movement}, "
            # f"{texture}, "
            f"complex energy flow, "
            f"depth and atmosphere, "
            f"dynamic composition, "
            f"audio reactive visual form, "
            f"volumetric lighting, "
            f"immersive cinematic abstract scene, "
            f"high detail, "
            f"non representational, "
            f"unique composition seed {seed}"
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
        response = requests.post(
            API_URL,
            headers=hf_headers,
            json={"inputs": image_prompt}
            )
        
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