// =================================================
// あなたのFirebaseプロジェクトの設定情報に置き換えてください
// =================================================
 const firebaseConfig = {
    apiKey: "AIzaSyD4EgxaZv12TE5NvERG-LxFTIFh8Ha50TY",
    authDomain: "quick-memo-app.firebaseapp.com",
    projectId: "quick-memo-app",
    storageBucket: "quick-memo-app.firebasestorage.app",
    messagingSenderId: "9597456554",
    appId: "1:9597456554:web:b47c88da4fecca3a8880d3"
  };
// =================================================

// Firebaseを初期化する
firebase.initializeApp(firebaseConfig);

// Firestoreデータベースへの接続を準備する
const db = firebase.firestore();

// HTMLの要素を取得する
const memoInput = document.getElementById("memo-input");
const saveButton = document.getElementById("save-button");
const memoList = document.getElementById("memo-list");

// ★追加：編集状態を管理するための変数
let editMode = false;
let editId = null;

// メモを保存または更新する機能
saveButton.addEventListener("click", () => {
  const memoText = memoInput.value;

  if (memoText) {
    // ★変更：編集モードか、新規保存モードかで処理を分ける
    if (editMode) {
      // 更新処理
      db.collection("memos").doc(editId).update({
        text: memoText
      }).then(() => {
        console.log("メモを更新しました！");
        // 編集モードを解除
        editMode = false;
        editId = null;
        saveButton.textContent = "保存";
        memoInput.value = "";
      }).catch((error) => {
        console.error("更新に失敗しました: ", error);
      });
    } else {
      // 新規保存処理
      db.collection("memos").add({
        text: memoText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        console.log("メモを保存しました！");
        memoInput.value = "";
      }).catch((error) => {
        console.error("保存に失敗しました: ", error);
      });
    }
  }
});

// メモリストのクリックイベント（削除と編集）
memoList.addEventListener("click", (e) => {
  const target = e.target;
  const id = target.dataset.id;
  
  // ★追加：削除ボタンが押されたときの処理
  if (target.className === 'delete-button') {
    if (confirm("本当にこのメモを削除しますか？")) {
      db.collection("memos").doc(id).delete().then(() => {
        console.log("メモを削除しました！");
      }).catch((error) => {
        console.error("削除に失敗しました: ", error);
      });
    }
  }

  // ★追加：編集ボタンが押されたときの処理
  if (target.className === 'edit-button') {
    // 該当のメモのテキストを取得して入力欄に表示
    const memoText = target.closest('.memo-item').querySelector('.memo-text').textContent;
    memoInput.value = memoText;
    
    // 編集モードに切り替え
    editMode = true;
    editId = id;
    saveButton.textContent = "更新";
    
    // 入力欄にフォーカスを当てる
    memoInput.focus();
  }
});


// メモをリアルタイムで表示する機能
db.collection("memos").orderBy("createdAt", "desc").onSnapshot((querySnapshot) => {
  memoList.innerHTML = "";
  querySnapshot.forEach((doc) => {
    const memo = doc.data();
    const formattedDate = memo.createdAt ? new Date(memo.createdAt.seconds * 1000).toLocaleString('ja-JP') : '';

    const memoItem = document.createElement("div");
    memoItem.classList.add("memo-item");
    // ★変更：編集ボタンと削除ボタンを追加
    memoItem.innerHTML = `
      <div class="memo-content">
        <p class="memo-text">${memo.text}</p>
        <p class="memo-date">${formattedDate}</p>
      </div>
      <div class="memo-buttons">
        <button class="edit-button" data-id="${doc.id}">編集</button>
        <button class="delete-button" data-id="${doc.id}">削除</button>
      </div>
    `;
    memoList.appendChild(memoItem);
  });
});