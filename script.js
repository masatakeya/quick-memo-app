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
const userInfo = document.getElementById("user-info");
const userName = document.getElementById("user-name");
const appArea = document.getElementById("app-area");
const memoInput = document.getElementById("memo-input");
const saveButton = document.getElementById("save-button");
const memoList = document.getElementById("memo-list");

let editMode = false;
let editId = null;
let currentUid = null;
let unsubscribe = null;

// Googleログイン処理
loginButton.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => { console.error("ログインエラー", error); });
});

// ログアウト処理
logoutButton.addEventListener("click", () => { auth.signOut(); });

// 認証状態の監視
auth.onAuthStateChanged(user => {
  if (user) {
    currentUid = user.uid;
    userName.textContent = `${user.displayName} さん`;
    appArea.style.display = 'block';
    userInfo.style.display = 'flex';
    loginButton.style.display = 'none';
    subscribeToMemos(currentUid);
  } else {
    currentUid = null;
    appArea.style.display = 'none';
    userInfo.style.display = 'none';
    loginButton.style.display = 'block';
    if (unsubscribe) unsubscribe();
    memoList.innerHTML = "";
  }
});

// メモを保存/更新
saveButton.addEventListener("click", () => {
  const memoText = memoInput.value;
  if (!memoText || !currentUid) return;

  if (editMode) {
    db.collection("memos").doc(editId).update({ text: memoText })
    .then(() => {
      console.log("更新しました");
      editMode = false; editId = null;
      saveButton.textContent = "保存";
      memoInput.value = "";
    }).catch(err => console.error("更新エラー", err));
  } else {
    db.collection("memos").add({
      text: memoText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUid
    }).then(() => {
      console.log("保存しました");
      memoInput.value = "";
    }).catch(err => console.error("保存エラー", err));
  }
});

// ★★ここが修正された部分です★★
// メモリストのクリックイベント（削除と編集）
memoList.addEventListener("click", (e) => {
  const target = e.target;
  const id = target.dataset.id;

  // 削除ボタンが押されたときの処理
  if (target.className === 'delete-button') {
    if (confirm("本当にこのメモを削除しますか？")) {
      db.collection("memos").doc(id).delete().catch(err => console.error("削除エラー", err));
    }
  }

  // 編集ボタンが押されたときの処理
  if (target.className === 'edit-button') {
    const memoText = target.closest('.memo-item').querySelector('.memo-text').textContent;
    memoInput.value = memoText;
    editMode = true;
    editId = id;
    saveButton.textContent = "更新";
    memoInput.focus();
  }
});

// メモのリアルタイム表示関数
function subscribeToMemos(uid) {
  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection("memos")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .onSnapshot((querySnapshot) => {
      memoList.innerHTML = "";
      querySnapshot.forEach((doc) => {
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
    }, (error) => {
        console.error("データの購読に失敗しました: ", error);
    });
}