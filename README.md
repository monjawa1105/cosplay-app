# Cosplay Costume Assistant + Qwen3-VL

## 動作
1. ブラウザで画像をアップロード
2. 調べたい衣装パーツを1回クリック
3. 画像とクリック座標をPython APIへ送信
4. Qwen3-VLがパーツ名・Bounding Box・素材候補を推定
5. 結果と推定領域を画面に表示

## 実行環境
Qwen3-VLはGPUのあるUbuntu PCで実行します。既存のConda環境 `qwen3vl_gpu` を使用し、新しい環境は作りません。

### Ubuntu側
```bash
conda activate qwen3vl_gpu
cd cosplay_costume_assistant_qwen3/backend
pip install fastapi "uvicorn[standard]" python-multipart pillow accelerate qwen-vl-utils==0.0.14
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0))"
uvicorn main:app --host 0.0.0.0 --port 8000
```
GPU確認でTrueとGPU名が出ることを確認してください。既存のGPU版PyTorchは再インストールしないでください。Transformersが4.57.0未満の場合のみ、既存環境との互換性を確認して更新してください。

初回解析時に `Qwen/Qwen3-VL-2B-Instruct` がHugging Faceからダウンロードされます。

### フロントエンド
プロジェクトのルートで:
```bash
python -m http.server 5500
```
ブラウザで `http://localhost:5500` を開きます。

### MacBookからUbuntuのGPUを使う場合
`script.js` の先頭:
```js
const API_BASE = "http://localhost:8000";
```
をUbuntu PCのLAN内IPに変更します（例 `http://192.168.1.20:8000`。このIPは例です）。Ubuntu側のファイアウォール設定も確認してください。

## 構成
```text
cosplay_costume_assistant_qwen3/
├── index.html
├── style.css
├── script.js
├── backend/
│   ├── main.py
│   ├── qwen.py
│   └── requirements.txt
└── README.md
```

## 注意
これはQwen3-VL単体でクリック位置のパーツ名・領域・素材候補を同時推定する初期実験版です。Bounding Boxや素材推定の正確さは保証されません。画像から実際の繊維組成を断定できないため、素材は見た目に基づく候補として扱います。公開運用時はCORS制限、認証、画像サイズ制限などを追加してください。
