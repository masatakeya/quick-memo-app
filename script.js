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

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// HTML要素の取得
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const authArea = document.getElementById("auth-area");
const appArea = document.getElementById("app-area");
const userInfo = document.getElementById("user-info");
const userName = document.getElementById("user-name");
const memoInput = document.getElementById("memo-input");
const saveButton = document.getElementById("save-button");
const memoList = document.getElementById("memo-list");

let editMode = false;
let editId = null;
let currentUid = null; // ★追加：現在のユーザーIDを保持する変数
let unsubscribe = null; // ★追加：Firestoreのリスナーを停止するための変数

// ★追加：Googleログイン処理
loginButton.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => {
    console.error("ログインエラー", error);
  });
});

// ★追加：ログアウト処理
logoutButton.addEventListener("click", () => {
  auth.signOut();
});

// ★変更：認証状態の監視
auth.onAuthStateChanged(user => {
  if (user) {
    // ログインしている場合
    currentUid = user.uid;
    userName.textContent = `${user.displayName} さん`;
    appArea.style.display = 'block';
    userInfo.style.display = 'flex';
    loginButton.style.display = 'none';
    
    // ★自分のメモだけを購読開始
    subscribeToMemos(currentUid);
    
  } else {
    // ログアウトしている場合
    currentUid = null;
    appArea.style.display = 'none';
    userInfo.style.display = 'none';
    loginButton.style.display = 'block';

    // ★メモの購読を停止
    if (unsubscribe) {
      unsubscribe();
    }
    memoList.innerHTML = ""; // メモリストをクリア
  }
});

// ★変更：メモを保存/更新
saveButton.addEventListener("click", () => {
  const memoText = memoInput.value;
  if (!memoText || !currentUid) return;

  if (editMode) {
    // 更新
    db.collection("memos").doc(editId).update({ text: memoText })
    .then(() => {
      console.log("更新しました");
      editMode = false; editId = null;
      saveButton.textContent = "保存";
      memoInput.value = "";
    });
  } else {
    // ★変更：新規保存時にuserIdを追加
    db.collection("memos").add({
      text: memoText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUid // ユーザーIDを保存
    }).then(() => {
      console.log("保存しました");
      memoInput.value = "";
    });
  }
});

// ★変更：リストのクリックイベント
memoList.addEventListener("click", (e) => { /* 変更なし */ });

// ★変更：メモのリアルタイム表示関数
function subscribeToMemos(uid) {
  // 以前の購読があれば停止
  if (unsubscribe) unsubscribe();

  // ★自分のuserIdを持つメモだけをクエリ
  unsubscribe = db.collection("memos")
    .where("userId", "==", uid) // この行が重要！
    .orderBy("createdAt", "desc")
    .onSnapshot((querySnapshot) => {
      memoList.innerHTML = "";
      querySnapshot.forEach((doc) => {
        // 表示処理は以前と同じ
        const memo = doc.data();
        const formattedDate = memo.createdAt ? new Date(memo.createdAt.seconds * 1000).toLocaleString('ja-JP') : '';
        const memoItem = document.createElement("div");
        memoItem.classList.add("memo-item");
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
}