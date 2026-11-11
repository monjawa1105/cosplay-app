// ==================================
// パーツ情報
// ==================================

const partData = {

    skirt: {
        name: "スカート",
        materials: [
            {
                name: "ポリエステル",
                reason: "シワになりにくく、形状を維持しやすいため、衣装制作に適しています。"
            },
            {
                name: "ツイル",
                reason: "適度な厚みとハリがあり、スカートのシルエットを作りやすい素材です。"
            },
            {
                name: "サテン",
                reason: "光沢感があり、華やかな見た目を再現したい場合に適しています。"
            }
        ]
    },

    jacket: {
        name: "ジャケット",
        materials: [
            {
                name: "ツイル",
                reason: "適度な厚みとハリがあり、ジャケットの形状を維持しやすい素材です。"
            },
            {
                name: "ポリエステル",
                reason: "耐久性があり、比較的シワになりにくい素材です。"
            },
            {
                name: "ウール",
                reason: "厚みと質感があり、落ち着いた印象のジャケットに適しています。"
            }
        ]
    },

    coat: {
        name: "羽織・コート",
        materials: [
            {
                name: "メルトン",
                reason: "厚みとハリがあり、コート特有の立体的なシルエットを作りやすい素材です。"
            },
            {
                name: "ウール",
                reason: "保温性と厚みがあり、重厚感のある衣装に適しています。"
            },
            {
                name: "ポリエステル",
                reason: "軽量で扱いやすく、比較的シワになりにくい素材です。"
            }
        ]
    },

    inner: {
        name: "インナー",
        materials: [
            {
                name: "ポリエステル",
                reason: "軽量で乾きやすく、衣装制作でも扱いやすい素材です。"
            },
            {
                name: "綿",
                reason: "肌触りがよく、自然な質感を再現しやすい素材です。"
            },
            {
                name: "ニット",
                reason: "伸縮性があり、身体にフィットするデザインに適しています。"
            }
        ]
    },

    sleeve: {
        name: "袖",
        materials: [
            {
                name: "シフォン",
                reason: "薄くて軽く、柔らかいドレープを表現できます。"
            },
            {
                name: "サテン",
                reason: "光沢感があり、装飾的な袖の再現に適しています。"
            },
            {
                name: "ポリエステル",
                reason: "形状を維持しやすく、比較的扱いやすい素材です。"
            }
        ]
    },

    decoration: {
        name: "装飾",
        materials: [
            {
                name: "レース",
                reason: "透け感や細かな模様を表現でき、装飾部分に適しています。"
            },
            {
                name: "チュール",
                reason: "軽く透け感があり、ボリュームや立体感を出せます。"
            },
            {
                name: "合皮",
                reason: "革のような質感を再現でき、装飾パーツに使用できます。"
            }
        ]
    }

};


// ==================================
// DOM要素
// ==================================

const imageUpload = document.getElementById("imageUpload");
const characterImage = document.getElementById("characterImage");
const imageContainer = document.getElementById("imageContainer");
const emptyMessage = document.getElementById("emptyMessage");
const markerLayer = document.getElementById("markerLayer");

const selectedPartName = document.getElementById("selectedPartName");
const materialResults = document.getElementById("materialResults");
const markerList = document.getElementById("markerList");

const partButtons = document.querySelectorAll(".part-button");


// ==================================
// 状態管理
// ==================================

let selectedPart = "skirt";
let markers = [];


// ==================================
// 画像アップロード
// ==================================

imageUpload.addEventListener("change", function(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください。");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {

        characterImage.src = e.target.result;

        characterImage.hidden = false;
        emptyMessage.style.display = "none";

        markers = [];

        renderMarkers();
        renderMarkerList();

    };

    reader.readAsDataURL(file);

});


// ==================================
// パーツ選択
// ==================================

partButtons.forEach(button => {

    button.addEventListener("click", function() {

        partButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        selectedPart = this.dataset.part;

        updateSelectedPart();
        updateMaterials();

    });

});


// ==================================
// 選択中パーツの表示
// ==================================

function updateSelectedPart() {

    selectedPartName.textContent =
        partData[selectedPart].name;

}


// ==================================
// 素材候補の表示
// ==================================

function updateMaterials() {

    const materials = partData[selectedPart].materials;

    materialResults.innerHTML = "";

    materials.forEach(material => {

        const card = document.createElement("div");

        card.className = "material-card";

        const name = document.createElement("div");
        name.className = "material-name";
        name.textContent = material.name;

        const reason = document.createElement("p");
        reason.textContent = material.reason;

        card.appendChild(name);
        card.appendChild(reason);

        materialResults.appendChild(card);

    });

}


// ==================================
// 画像クリックで目印を追加
// ==================================

imageContainer.addEventListener("click", function(event) {

    if (characterImage.hidden) {
        return;
    }

    if (event.target.classList.contains("marker")) {
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

    const marker = {

        id: Date.now() + Math.random(),

        part: selectedPart,

        x: (x / rect.width) * 100,

        y: (y / rect.height) * 100

    };

    markers.push(marker);

    renderMarkers();
    renderMarkerList();

});


// ==================================
// 目印の描画
// ==================================

function renderMarkers() {

    markerLayer.innerHTML = "";

    markers.forEach((marker, index) => {

        const element = document.createElement("button");

        element.className = "marker";

        element.textContent = index + 1;

        element.style.left = marker.x + "%";
        element.style.top = marker.y + "%";

        element.title = partData[marker.part].name;

        element.addEventListener("click", function(event) {

            event.stopPropagation();

            deleteMarker(marker.id);

        });

        markerLayer.appendChild(element);

    });

}


// ==================================
// 目印の削除
// ==================================

function deleteMarker(id) {

    markers = markers.filter(marker => {
        return marker.id !== id;
    });

    renderMarkers();
    renderMarkerList();

}


// ==================================
// 登録パーツ一覧の表示
// ==================================

function renderMarkerList() {

    markerList.innerHTML = "";

    if (markers.length === 0) {

        const empty = document.createElement("li");

        empty.className = "no-marker";

        empty.textContent =
            "まだパーツが登録されていません。";

        markerList.appendChild(empty);

        return;

    }

    markers.forEach((marker, index) => {

        const item = document.createElement("li");

        const name = document.createElement("span");

        name.textContent =
            `${index + 1}. ${partData[marker.part].name}`;

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-button";

        deleteButton.textContent = "削除";

        deleteButton.addEventListener("click", function() {

            deleteMarker(marker.id);

        });

        item.appendChild(name);
        item.appendChild(deleteButton);

        markerList.appendChild(item);

    });

}


// ==================================
// 初期表示
// ==================================

updateSelectedPart();
updateMaterials();
renderMarkerList();