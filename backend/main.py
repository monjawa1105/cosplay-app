from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from io import BytesIO

from qwen import analyze_image


app = FastAPI(
    title="Cosplay Costume Assistant API"
)


# ==================================
# CORS設定
# ==================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================
# ヘルスチェック
# ==================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "model_loaded": False
    }


# ==================================
# 画像解析
# ==================================

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    x: float = Form(...),
    y: float = Form(...)
):

    try:

        # 画像ファイルの確認
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="画像ファイルを送信してください。"
            )

        # 画像を読み込む
        contents = await file.read()

        image = Image.open(
            BytesIO(contents)
        ).convert("RGB")

        # 座標の確認
        if not (0 <= x <= 1 and 0 <= y <= 1):
            raise HTTPException(
                status_code=400,
                detail="クリック座標が不正です。"
            )

        # Qwen3-VLによる解析
        result = analyze_image(
            image=image,
            x=x,
            y=y
        )

        return result

    except HTTPException:
        raise

    except Exception as e:

        print("解析エラー:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )