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

// FirestoreデータベースとAuthへの接続を準備する
const db = firebase.firestore();
const auth = firebase.auth();

// HTMLの要素を取得する
const memoInput = document.getElementById("memo-input");
const saveButton = document.getElementById("save-button");
const memoList = document.getElementById("memo-list");
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const authContainer = document.getElementById("auth-container");
const userInfo = document.getElementById("user-info");
const userName = document.getElementById("user-name");
const memoContainer = document.getElementById("memo-container");

// ★追加：編集状態を管理するための変数
let editMode = false;
let editId = null;
// ★追加：現在のユーザーを保持する変数
let currentUser = null;

// Googleログイン処理
loginButton.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    console.error("ログインに失敗しました: ", error);
  });
});

// ログアウト処理
logoutButton.addEventListener("click", () => {
  auth.signOut().catch((error) => {
    console.error("ログアウトに失敗しました: ", error);
  });
});

// 認証状態の変化を監視する
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    // ログインしている場合
    authContainer.style.display = "block";
    loginButton.style.display = "none";
    userInfo.style.display = "block";
    userName.textContent = `ようこそ, ${user.displayName} さん`;
    memoContainer.style.display = "block";
    // ログインユーザーのメモを表示
    loadMemos();
  } else {
    // ログアウトしている場合
    authContainer.style.display = "block";
    loginButton.style.display = "block";
    userInfo.style.display = "none";
    memoContainer.style.display = "none";
    memoList.innerHTML = ""; // メモリストをクリア
  }
});

// メモを保存または更新する機能
saveButton.addEventListener("click", () => {
  const memoText = memoInput.value;

  if (memoText && currentUser) {
    if (editMode) {
      // 更新処理
      db.collection("memos").doc(editId).update({
        text: memoText
      }).then(() => {
        console.log("メモを更新しました！");
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
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: currentUser.uid // ★追加：ユーザーIDを保存
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
  
  if (target.className === 'delete-button') {
    if (confirm("本当にこのメモを削除しますか？")) {
      db.collection("memos").doc(id).delete().then(() => {
        console.log("メモを削除しました！");
      }).catch((error) => {
        console.error("削除に失敗しました: ", error);
      });
    }
  }

  if (target.className === 'edit-button') {
    const memoText = target.closest('.memo-item').querySelector('.memo-text').textContent;
    memoInput.value = memoText;
    
    editMode = true;
    editId = id;
    saveButton.textContent = "更新";
    
    memoInput.focus();
  }
});

// メモをリアルタイムで表示する機能
function loadMemos() {
  if (currentUser) {
    db.collection("memos")
      .where("uid", "==", currentUser.uid) // ★変更：ログインユーザーのメモのみ取得
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
      });
  }
}
