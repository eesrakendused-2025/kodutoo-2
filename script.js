console.log("scripti fail õigesti ühendatud");

const startSound = new Audio('start.mp3');
const typingSound = new Audio('typing.mp3');
const endSound = new Audio('end.mp3');
const highscoreSound = new Audio('highscore.mp3');

let avatarDataUrl = localStorage.getItem('typer_avatar') || 'default-avatar.png';
document.getElementById('avatarPreview').src = avatarDataUrl;
document.getElementById('avatarInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      avatarDataUrl = evt.target.result;
      document.getElementById('avatarPreview').src = avatarDataUrl;
      localStorage.setItem('typer_avatar', avatarDataUrl);
    }
    reader.readAsDataURL(file);
  }
});

let playerName = prompt("Palun sisesta oma nimi") || "Anonüümne";

class Typer {
  constructor(pname) {
    this.name = pname;
    this.wordsInGame = 5;
    this.startingWordLength = 3;
    this.words = [];
    this.word = "START";
    this.typeWords = [];
    this.startTime = 0;
    this.endTime = 0;
    this.typedCount = 0;
    this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
    this.score = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.isShowingResults = false;
    this.loadFromFile();
    this.showAllResults();
    this.currentWordIndex = 0;
    this.avatar = avatarDataUrl;
    this.bindInput();
  }

  loadFromFile() {
    $.get("lemmad2013.txt", (data) => this.getWords(data));
    $.get("database.txt", (data) => {
      let content = JSON.parse(data);
      this.allResults = content.content;
    });
  }

  getWords(data) {
    const dataFromFile = data.split("\n");
    this.separateWordsByLength(dataFromFile);
  }

  separateWordsByLength(data) {
    for (let i = 0; i < data.length; i++) {
      const wordLength = data[i].length;
      if (this.words[wordLength] === undefined) {
        this.words[wordLength] = [];
      }
      this.words[wordLength].push(data[i]);
    }
    this.startTyper();
  }

  startTyper() {
    this.generateWords();
    this.currentWordIndex = 0;
    this.typedCount = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.showWord();
    this.startTime = performance.now();
    startSound.play();
    document.getElementById('scoreSection').style.display = 'none';
    document.getElementById('inputBox').value = '';
    document.getElementById('inputBox').disabled = false;
    document.getElementById('inputBox').focus();
    this.updateCounter();
  }

  generateWords() {
    this.typeWords = [];
    for (let i = 0; i < this.wordsInGame; i++) {
      const len = this.startingWordLength + i;
      const arr = this.words[len];
      if (arr && arr.length > 0) {
        const idx = Math.floor(Math.random() * arr.length);
        this.typeWords.push(arr[idx]);
      }
    }
  }

  showWord() {
    if (this.currentWordIndex < this.typeWords.length) {
      this.word = this.typeWords[this.currentWordIndex];
      document.getElementById('wordDiv').textContent = this.word;
      document.getElementById('inputBox').value = '';
      this.updateCounter();
    } else {
      this.endGame();
    }
  }

  bindInput() {
    const input = document.getElementById('inputBox');
    input.oninput = (e) => this.checkWordAuto(e);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') e.preventDefault();
    };
  }

  checkWordAuto(e) {
    const input = e.target;
    const userInput = input.value.trim();
    this.totalChars = this.currentWordIndex * this.word.length + userInput.length;

    if (userInput === this.word) {
      typingSound.play();
      this.correctChars += this.word.length;
      this.currentWordIndex++;
      this.showWord();
    } else {
      if (userInput.length === this.word.length) {
        input.classList.add('invalid');
        setTimeout(() => input.classList.remove('invalid'), 500);
      }
    }
  }

  updateCounter() {
    document.getElementById('wordCount').textContent = `Sõnade arv: ${this.currentWordIndex + 1}/${this.wordsInGame}`;
    const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(2);
    document.getElementById('timer').textContent = `Aeg: ${elapsed}s`;
  }

  endGame() {
    endSound.play();
    this.endTime = performance.now();
    document.getElementById('wordDiv').textContent = "Mäng läbi!";
    document.getElementById('inputBox').disabled = true;
    this.calculateAndShowScore();
  }

  calculateAndShowScore() {
    this.score = ((this.endTime - this.startTime) / 1000).toFixed(2);
    const accuracy = this.totalChars > 0 ? 
      ((this.correctChars / this.totalChars) * 100).toFixed(1) : 100;
    document.getElementById('score').textContent = `Aeg: ${this.score} s`;
    document.getElementById('accuracy').textContent = `Täpsus: ${accuracy}%`;
    document.getElementById('scoreSection').style.display = 'block';
    this.showSpeedImage();
    this.saveResult(accuracy);
  }

  showSpeedImage() {
    const speed = this.wordsInGame / (this.score / 60);
    let img = '';
    if (speed < 20) img = 'slow.png';
    else if (speed < 40) img = 'average.png';
    else if (speed < 60) img = 'good.png';
    else img = 'fast.png';
    document.getElementById('speedImage').src = img;
  }

  saveResult(accuracy) {
    let result = {
      name: this.name,
      score: this.score,
      accuracy: accuracy,
      avatar: avatarDataUrl
    };
    this.allResults.push(result);
    this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
    if (this.isHighscore(result)) highscoreSound.play();
    localStorage.setItem('typer', JSON.stringify(this.allResults));
    this.showAllResults();
  }

  isHighscore(result) {
    return this.allResults.slice(0, 3).some(r => r.name === result.name && r.score === result.score);
  }

  showAllResults(filter = "all") {
    let results = this.allResults;
    if (filter === "top") results = results.slice(0, 5);
    else if (filter === "recent") results = results.slice(-5).reverse();
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    results.forEach(r => {
      resultsList.innerHTML += `
        <div class="result-card">
          <img class="avatar" src="${r.avatar}" alt="avatar" />
          <h3>${r.name}</h3>
          <span>Kiirus: ${r.score}s</span>
          <span>Täpsus: ${r.accuracy}%</span>
        </div>
      `;
    });
  }
}

document.getElementById('showResultsBtn').onclick = () => {
  document.getElementById('resultsModal').style.display = 'block';
  typer.showAllResults();
};
document.querySelector('.close').onclick = () => {
  document.getElementById('resultsModal').style.display = 'none';
};
document.querySelectorAll('.filterBtn').forEach(btn => {
  btn.onclick = function() {
    typer.showAllResults(this.dataset.filter);
  }
});

let typer = new Typer(playerName);