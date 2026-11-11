// ==================================
// API設定
// ==================================

const API_BASE = "http://localhost:8000";


// ==================================
// DOM要素
// ==================================

const imageUpload = document.getElementById("imageUpload");
const characterImage = document.getElementById("characterImage");
const imageContainer = document.getElementById("imageContainer");
const emptyMessage = document.getElementById("emptyMessage");
const markerLayer = document.getElementById("markerLayer");

const analysisStatus = document.getElementById("analysisStatus");
const analysisResults = document.getElementById("analysisResults");


// ==================================
// 画像アップロード
// ==================================

let uploadedFile = null;
let isAnalyzing = false;

imageUpload.addEventListener("change", function(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください。");
        return;
    }

    uploadedFile = file;

    const reader = new FileReader();

    reader.onload = function(e) {

        characterImage.onload = function() {

            characterImage.hidden = false;
            emptyMessage.style.display = "none";

            markerLayer.innerHTML = "";

            analysisResults.hidden = true;

            analysisStatus.textContent =
                "解析したい衣装の部分をクリックしてください。";

        };

        characterImage.src = e.target.result;

    };

    reader.readAsDataURL(file);

});


// ==================================
// 画像クリック
// ==================================

imageContainer.addEventListener("click", async function(event) {

    if (!uploadedFile || characterImage.hidden || isAnalyzing) {
        return;
    }

    if (event.target.closest(".marker")) {
        return;
    }

    const rect = characterImage.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (
        x < 0 ||
        y < 0 ||
        x > rect.width ||
        y > rect.height
    ) {
        return;
    }

    // 画像内のクリック位置を0～1に正規化
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    // クリック位置に目印を表示
    markerLayer.innerHTML = "";

    const marker = document.createElement("div");

    marker.className = "marker";

    marker.style.left = normalizedX * 100 + "%";
    marker.style.top = normalizedY * 100 + "%";

    markerLayer.appendChild(marker);

    // AI解析を実行
    await analyzeImage(normalizedX, normalizedY);

});


// ==================================
// Qwen3-VLによる画像解析
// ==================================

async function analyzeImage(x, y) {

    if (!uploadedFile) return;

    isAnalyzing = true;

    analysisResults.hidden = true;

    analysisStatus.textContent =
        "AIが衣装パーツを解析しています...";

    try {

        const formData = new FormData();

        formData.append("file", uploadedFile);

        formData.append("x", x);
        formData.append("y", y);

        const response = await fetch(
            `${API_BASE}/analyze`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(errorText);

        }

        const result = await response.json();

        displayResults(result);

    } catch (error) {

        console.error("解析エラー:", error);

        analysisStatus.textContent =
            "解析に失敗しました。バックエンドの起動状態やAPIの設定を確認してください。";

    } finally {

        isAnalyzing = false;

    }

}


// ==================================
// 解析結果の表示
// ==================================

function displayResults(result) {

    analysisStatus.textContent =
        "AIによる解析が完了しました。";

    analysisResults.hidden = false;

    document.getElementById("partName").textContent =
        result.part_name || "不明";

    document.getElementById("partColor").textContent =
        result.color || "不明";

    document.getElementById("partShape").textContent =
        result.shape || "不明";

    document.getElementById("partFeatures").textContent =
        result.features || "情報なし";

    document.getElementById("analysisReason").textContent =
        result.reason || "情報なし";

    document.getElementById("productionAdvice").textContent =
        result.production_advice || "情報なし";


    // 素材候補
    const materialResults =
        document.getElementById("materialResults");

    materialResults.innerHTML = "";

    if (
        Array.isArray(result.materials) &&
        result.materials.length > 0
    ) {

        result.materials.forEach(material => {

            const card = document.createElement("div");

            card.className = "material-card";

            const name = document.createElement("h4");

            name.textContent =
                typeof material === "string"
                    ? material
                    : material.name || "不明";

            const reason = document.createElement("p");

            reason.textContent =
                typeof material === "string"
                    ? ""
                    : material.reason || "";

            card.appendChild(name);
            card.appendChild(reason);

            materialResults.appendChild(card);

        });

    } else {

        materialResults.textContent =
            "素材候補を取得できませんでした。";

    }

}