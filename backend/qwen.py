import torch
import json
import re

from PIL import Image
from transformers import (
    AutoProcessor,
    AutoModelForImageTextToText
)

from qwen_vl_utils import process_vision_info


# ==================================
# モデル設定
# ==================================

MODEL_NAME = "Qwen/Qwen3-VL-2B-Instruct"

model = None
processor = None


# ==================================
# モデル読み込み
# ==================================

def load_model():

    global model
    global processor

    if model is not None:
        return

    print("Qwen3-VLを読み込んでいます...")

    processor = AutoProcessor.from_pretrained(
        MODEL_NAME
    )

    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_NAME,
        torch_dtype="auto",
        device_map="auto"
    )

    model.eval()

    print("Qwen3-VLの読み込みが完了しました！")


# ==================================
# JSON抽出
# ==================================

def extract_json(text):

    # JSON部分を抽出
    match = re.search(
        r"\{[\s\S]*\}",
        text
    )

    if match is None:
        raise ValueError(
            "AIの回答からJSONを取得できませんでした。"
        )

    return json.loads(match.group())


# ==================================
# 画像解析
# ==================================

def analyze_image(image: Image.Image, x: float, y: float):

    global model
    global processor

    # モデルが未読み込みなら読み込む
    load_model()

    width, height = image.size

    # 正規化された座標を画像上の座標に変換
    pixel_x = int(x * width)
    pixel_y = int(y * height)

    print("画像解析を開始します")
    print(f"画像サイズ: {width} x {height}")
    print(f"クリック座標: ({pixel_x}, {pixel_y})")

    # ==================================
    # Qwen3-VLへの指示
    # ==================================

    prompt = f"""
あなたはコスプレ衣装制作を支援する画像解析AIです。

入力された画像はキャラクターの衣装を含む画像です。

画像全体を確認し、指定されたクリック位置に存在する衣装パーツを分析してください。

【クリック位置】
画像の左上を原点とし、
画像サイズは幅 {width} ピクセル、高さ {height} ピクセルです。

クリック座標：
x = {pixel_x}
y = {pixel_y}

【分析条件】

1. クリック位置にある衣装パーツの名称を特定してください。
2. スカート、ジャケット、コートなどの固定リストに限定せず、襟、袖口、ベルト、リボン、フリルなども認識してください。
3. クリックした位置が衣装以外の場合は、その旨を示してください。
4. パーツの色を推定してください。
5. 素材候補を最大3種類挙げてください。
6. 表面の光沢、厚み、透け感、柔らかさ、ハリなどの視覚的特徴を分析してください。
7. パーツの形状やデザイン上の特徴を説明してください。
8. コスプレ衣装として再現する場合の制作上のヒントを示してください。
9. 素材の繊維組成は画像だけでは確定できないため、候補として提示してください。
10. 画像から判断できないことを断定しないでください。

【素材候補について】

以下の素材に限定せず、画像から適切な候補を考えてください。

綿、麻、絹、ウール、ポリエステル、ナイロン、
レーヨン、サテン、ベルベット、レース、チュール、
デニム、合皮、スエード、ニット、フリース、
コーデュロイ、キャンバス、ツイード、オーガンジー、
メッシュ、ファー、フェイクファー、PVCなど。

【回答形式】

必ず以下のJSON形式で回答してください。
JSON以外の文章は出力しないでください。

{{
    "part_name": "パーツ名",
    "color": "色",
    "shape": "形状・シルエット",
    "materials": [
        {{
            "name": "素材候補1",
            "reason": "その素材を候補にした理由"
        }},
        {{
            "name": "素材候補2",
            "reason": "その素材を候補にした理由"
        }},
        {{
            "name": "素材候補3",
            "reason": "その素材を候補にした理由"
        }}
    ],
    "features": "視覚的特徴",
    "reason": "パーツや素材を推定した理由",
    "production_advice": "コスプレ衣装制作へのアドバイス"
}}
"""

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "image": image
                },
                {
                    "type": "text",
                    "text": prompt
                }
            ]
        }
    ]

    # ==================================
    # 画像・テキストの前処理
    # ==================================

    text = processor.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    image_inputs, video_inputs = process_vision_info(
        messages
    )

    inputs = processor(
        text=[text],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt"
    )

    inputs = inputs.to(model.device)

    # ==================================
    # 推論
    # ==================================

    print("Qwen3-VLが画像を解析しています...")

    with torch.inference_mode():

        generated_ids = model.generate(
            **inputs,
            max_new_tokens=700,
            do_sample=False
        )

    # 入力部分を除去
    generated_ids_trimmed = [
        output_ids[len(input_ids):]
        for input_ids, output_ids in zip(
            inputs.input_ids,
            generated_ids
        )
    ]

    output_text = processor.batch_decode(
        generated_ids_trimmed,
        skip_special_tokens=True
    )[0]

    print("Qwen3-VLの回答:")
    print(output_text)

    # ==================================
    # JSON解析
    # ==================================

    result = extract_json(output_text)

    print("画像解析が完了しました！")

    return result