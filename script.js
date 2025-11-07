// read obfuscated word from fragment: index.html#p=BASE64_OF_REVERSED_WORD
function getWordFromFragment(){
  const hash = window.location.hash || '';
  const m = hash.match(/p=([^&]+)/);
  if (!m) return null;
  try {
    const token = decodeURIComponent(m[1]);
    const rev = atob(token); // base64 decode
    const word = rev.split('').reverse().join('').toUpperCase();
    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) return null;
    return word;
  } catch (e) {
    console.error(e);
    return null;
  }
}

const ANSWER = getWordFromFragment();
const MAX_GUESSES = 6;
let currentRow = 0;
let currentCol = 0;
let board = [];

const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const keyboardEl = document.getElementById("keyboard");

if (!ANSWER) {
  messageEl.textContent = "No puzzle found in the link. Make sure it ends with #p=...";
} else {
  buildBoard();
  buildKeyboard();
  showMessage("");
  console.log("Loaded puzzle:", ANSWER); // for you
}

function buildBoard() {
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement("div");
    row.className = "row";
    board[r] = [];
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      row.appendChild(tile);
      board[r][c] = tile;
    }
    boardEl.appendChild(row);
  }
}

function showMessage(msg) {
  messageEl.textContent = msg;
}

function handleKey(letter) {
  if (!ANSWER) return;
  if (currentCol < 5) {
    board[currentRow][currentCol].textContent = letter;
    currentCol++;
  }
}

function handleDelete() {
  if (!ANSWER) return;
  if (currentCol > 0) {
    currentCol--;
    board[currentRow][currentCol].textContent = "";
  }
}

function handleEnter() {
  if (!ANSWER) return;
  if (currentCol < 5) {
    showMessage("Not enough letters");
    return;
  }

  const guess = board[currentRow].map(t => t.textContent).join("");
  colorRow(guess);

  if (guess === ANSWER) {
    showMessage("You got it!");
    disableKeyboard();
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow === MAX_GUESSES) {
    showMessage("Answer was " + ANSWER);
    disableKeyboard();
  } else {
    showMessage("");
  }
}

function colorRow(guess) {
  const answerArr = ANSWER.split("");
  const guessArr = guess.split("");

  const result = Array(5).fill("gray");
  const used = Array(5).fill(false);

  // greens
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "green";
      used[i] = true;
    }
  }

  // yellows
  for (let i = 0; i < 5; i++) {
    if (result[i] === "green") continue;
    const letter = guessArr[i];
    const idx = answerArr.findIndex((a, j) => a === letter && !used[j]);
    if (idx !== -1) {
      result[i] = "yellow";
      used[idx] = true;
    }
  }

  // apply
  for (let i = 0; i < 5; i++) {
    const tile = board[currentRow][i];
    if (result[i] === "green") {
      tile.style.background = "var(--green)";
      tile.style.borderColor = "var(--green)";
      markKeyboard(guessArr[i], "green");
    } else if (result[i] === "yellow") {
      tile.style.background = "var(--yellow)";
      tile.style.borderColor = "var(--yellow)";
      markKeyboard(guessArr[i], "yellow");
    } else {
      tile.style.background = "var(--gray)";
      tile.style.borderColor = "var(--gray)";
      markKeyboard(guessArr[i], "gray");
    }
  }
}

function buildKeyboard() {
  const rows = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ];

  rows.forEach((rowLetters, index) => {
    const row = document.createElement("div");
    row.className = "kbd-row";

    if (index === 2) {
      const enter = document.createElement("button");
      enter.textContent = "Enter";
      enter.className = "key wide";
      enter.onclick = handleEnter;
      row.appendChild(enter);
    }

    rowLetters.split("").forEach(letter => {
      const key = document.createElement("button");
      key.textContent = letter;
      key.className = "key";
      key.onclick = () => handleKey(letter);
      key.id = "key-" + letter;
      row.appendChild(key);
    });

    if (index === 2) {
      const del = document.createElement("button");
      del.textContent = "Del";
      del.className = "key wide";
      del.onclick = handleDelete;
      row.appendChild(del);
    }

    keyboardEl.appendChild(row);
  });

  // physical keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") return handleEnter();
    if (e.key === "Backspace") return handleDelete();
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter)) {
      handleKey(letter);
    }
  });
}

function markKeyboard(letter, state) {
  const key = document.getElementById("key-" + letter);
  if (!key) return;

  if (state === "green" || (state === "yellow" && key.dataset.state !== "green")) {
    key.style.background = state === "green" ? "var(--green)" : "var(--yellow)";
    key.dataset.state = state;
  } else if (!key.dataset.state) {
    key.style.background = "var(--gray)";
    key.dataset.state = state;
  }
}

function disableKeyboard() {
  const keys = keyboardEl.querySelectorAll("button");
  keys.forEach(k => k.disabled = true);
}
