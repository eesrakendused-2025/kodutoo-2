console.log("scripti fail õigesti ühendatud");

let playerName = prompt("Palun sisesta oma nimi");

class Typer {
  constructor(pname) {
    this.name = pname;
    this.wordsInGame = 3;
    this.startingWordLength = 3;
    this.words = [];
    this.word = "START";
    this.typeWords = [];
    this.startTime = 0;
    this.endTime = 0;
    this.typedCount = 0;
    this.allResults = JSON.parse(localStorage.getItem("typer")) || [];
    this.score = 0;
    this.bonus = 0;
    this.bonusKoef = 200;
    this.resultCount = 30;

    // 🎵 HELI ELEMENDID
    this.audio = {
      start: document.getElementById("startSound"),
      error: document.getElementById("errorSound"),
      correct: document.getElementById("correctSound"),
      finish: document.getElementById("finishSound"),
    };

    this.loadFromFile();
  }

  loadFromFile() {
    $.get("lemmad2013.txt", (data) => this.getWords(data));

    $.get("database.txt", (data) => {
      let content = JSON.parse(data).content;
      this.allResults = this.allResults.concat(content);

      this.allResults = this.allResults.filter(
        (result) => result.name && result.score && result.words
      );

      console.log("Laetud tulemused:", this.allResults);
    });
  }

  getWords(data) {
    const dataFromFile = data.split("\n");
    this.separateWordsByLength(dataFromFile);
  }

  separateWordsByLength(data) {
    for (let i = 0; i < data.length; i++) {
      const wordLength = data[i].length;
      if (!this.words[wordLength]) {
        this.words[wordLength] = [];
      }
      this.words[wordLength].push(data[i]);
    }

    console.log(this.words);
    this.startTyper();
  }

  startTyper() {
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("words")) {
      this.wordsInGame = urlParams.get("words");
    }

    // Näita loendust enne mängu algust
    const countdownWords = ["Ready", "Set", "Go!"];
    let index = 0;
    const countdownText = document.getElementById("countdownText");
    const countdownOverlay = document.getElementById("countdownOverlay");

    countdownOverlay.style.display = "flex";
    this.audio.start.play(); // 🔊 mängu heli kohe

    const countdownInterval = setInterval(() => {
      countdownText.textContent = countdownWords[index];
      index++;
      if (index === countdownWords.length) {
        clearInterval(countdownInterval);

        setTimeout(() => {
          countdownOverlay.style.display = "none";
          this.generateWords();
          this.startTime = performance.now();
          $(document).keypress((event) => this.shortenWords(event.key));
          $("#loadResults").click(() => {
            this.resultCount += 50;
            if (this.resultCount >= this.allResults.length) {
              this.resultCount = this.allResults.length;
              $("#loadResults").hide();
            }
            this.showResults(this.resultCount);
          });
          this.showResults(this.resultCount);
        }, 1000); // 1s paus pärast “Go!”
      }
    }, 1000); // 1s vahe iga sõna vahel
  }

  generateWords() {
    this.typeWords = [];

    for (let i = 0; i < this.wordsInGame; i++) {
      const wordLength = this.startingWordLength + i;
      const wordArray = this.words[wordLength] || [];

      if (wordArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * wordArray.length);
        this.typeWords[i] = wordArray[randomIndex];
      } else {
        this.typeWords[i] = "???";
      }
    }

    this.selectWord();
  }

  drawWord() {
    $("#wordDiv").html(this.word);
  }

  selectWord() {
    this.word = this.typeWords[this.typedCount];
    this.typedCount++;
    this.drawWord();
    this.updateInfo();
  }

  updateInfo() {
    $("#info").html(this.typedCount + "/" + this.wordsInGame);
  }

  shortenWords(keyCode) {
    if (keyCode != this.word.charAt(0)) {
      this.changeBackground("wrong-button", 100);
      this.bonus = 0;
      this.audio.error.play(); // 🔊 vale täht
    } else if (
      this.word.length == 1 &&
      keyCode == this.word.charAt(0) &&
      this.typedCount == this.wordsInGame
    ) {
      this.audio.correct.play(); // 🔊 viimane õige täht
      this.endGame();
    } else if (this.word.length == 1 && keyCode == this.word.charAt(0)) {
      this.audio.correct.play(); // 🔊 täissõna trükitud
      this.changeBackground("right-word", 400);
      this.selectWord();
      this.bonus -= this.bonusKoef;
    } else if (this.word.length > 0 && keyCode == this.word.charAt(0)) {
      this.audio.correct.play(); // 🔊 õige täht
      this.changeBackground("right-button", 100);
      this.word = this.word.slice(1);
      this.bonus -= this.bonusKoef;
    }

    this.drawWord();
  }

  changeBackground(color, time) {
    setTimeout(() => {
      $("#container").removeClass(color);
    }, time);

    $("#container").addClass(color);
  }

  endGame() {
    this.endTime = performance.now();
    $("#wordDiv").hide();
    this.audio.finish.play(); // 🔊 mäng läbi
    this.calculateAndShowScore();
  }

  calculateAndShowScore() {
    this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(
      2
    );
    $("#score")
      .html(this.score + " sekundit")
      .show();

    const wpm = (60 / (this.score / this.wordsInGame)).toFixed(0);
    let imageSrc = "";
    let levelText = "";

    if (wpm < 20) {
      imageSrc = "img/slow.png";
      levelText = "Aeglane (alla 20 WPM)";
    } else if (wpm < 40) {
      imageSrc = "img/average.png";
      levelText = "Keskmine (20–39 WPM)";
    } else if (wpm < 60) {
      imageSrc = "img/good.png";
      levelText = "Hea (40–59 WPM)";
    } else {
      imageSrc = "img/excellent.png";
      levelText = "Väga hea (60+ WPM)";
    }

    $("#speedImage").html(`
      <p>${levelText}</p>
      <img src="${imageSrc}" alt="${levelText}" />
    `);

    this.saveResult();
  }

  saveResult() {
    let result = {
      name: this.name,
      score: this.score,
      words: this.wordsInGame,
    };

    this.allResults.push(result);
    this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
    localStorage.setItem("typer", JSON.stringify(this.allResults));
    this.saveToFile();
    this.showResults(this.resultCount);
  }

  showResults(count) {
    if (!this.allResults || this.allResults.length === 0) {
      $("#modalResults").html("<p>Tulemused puuduvad.</p>");
      return;
    }

    let html = `
      <table class="results-table">
        <thead>
          <tr>
            <th>Nimi</th>
            <th>Aeg (sekundites)</th>
            <th>Sõnade arv</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (let i = 0; i < count; i++) {
      const result = this.allResults[i];
      html += `
        <tr>
          <td>${result.name}</td>
          <td>${result.score}</td>
          <td>${result.words}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;

    $("#modalResults").html(html);
  }

  saveToFile() {
    $.post("server.php", { save: this.allResults }).fail(() => {
      console.log("Fail");
    });
  }
}

let typer = new Typer(playerName);

// MODAL loogika
const modal = document.getElementById("resultsModal");
const btn = document.getElementById("showResultsBtn");
const span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
  if (typer.allResults && typer.allResults.length > 0) {
    typer.showResults(typer.resultCount);
  } else {
    $("#modalResults").html("<p>Andmeid pole veel laetud.</p>");
  }
  modal.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

document.getElementById("restartBtn").onclick = function () {
  $("#wordDiv").show();
  $("#score").hide();
  $("#speedImage").empty();
  $("#container").removeClass("wrong-button right-button right-word");

  typer.typedCount = 0;
  typer.bonus = 0;
  typer.score = 0;

  typer.generateWords();
  typer.startTime = performance.now();

  typer.audio.start.play(); // 🔊 mängu alguse heli ka uuesti
};
