
function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}
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
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        this.score = 0;

        this.loadFromFile();
        this.showAllResults();
    }

    loadFromFile() {
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content);
        })
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

        console.log(this.words);

        this.startTyper();
    }

    startTyper() {
        this.generateWords();
        this.startTime = performance.now();
        playSound('startSound');
        $(document).keypress((event) => { this.shortenWords(event.key) });
    }

    generateWords() {
        for (let i = 0; i < this.wordsInGame; i++) {
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.round(Math.random() * this.words[wordLength].length);
            this.typeWords[i] = this.words[wordLength][randomWord];
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
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(keyCode) {
        console.log(keyCode);
        if (keyCode != this.word.charAt(0)) {
            setTimeout(function () {
                $('#container').css("background-color", "lightblue");
            }, 100);
            $('#container').css("background-color", "red");
        } else if (this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame) {
            this.endGame();
        } else if (this.word.length == 1 && keyCode == this.word.charAt(0)) {
            this.selectWord();
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)) {
            this.word = this.word.slice(1);
            playSound('typingSound');
        }

        this.drawWord();
    }

    endGame() {
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
        playSound('endSound');
    }

    calculateAndShowScore() {
        this.score = ((this.endTime - this.startTime) / 1000).toFixed(2);
        $("#score").html("Aeg: " + this.score + " s").show();
        this.showTypingSpeedFeedback();
        this.score = ((this.endTime - this.startTime) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
        playSound('highscoreSound');
    }
    showTypingSpeedFeedback() {
        const totalWords = this.wordsInGame;
        const totalMinutes = (this.endTime - this.startTime) / 1000 / 60;
        const wpm = (totalWords / totalMinutes).toFixed(0);
    
        let message = "";
        let imageUrl = "";
    
        if (wpm < 40) {
            message = "All average typing speed.";
            imageUrl = "img/slow.jpg";
        } else if (wpm < 50) {
            message = "Average typing speed.";
            imageUrl = "img/average.jpg";
        } else if (wpm < 60) {
            message = "Above average speed!";
            imageUrl = "img/above.webp";
        } else if (wpm < 120) {
            message = "High typing speed!";
            imageUrl = "img/high.jpg";
        } else {
            message = "Competitive level! 🚀";
            imageUrl = "img/pro.png";
        }
    
        $("#speed-feedback").html(`
            <p><strong>Sinu kiirus:</strong> ${wpm} WPM</p>
            <p>${message}</p>
            <img src="${imageUrl}" alt="speed feedback">
        `);
    }
    
    saveResult() {
        let result = {
            name: this.name,
            score: this.score
        };
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        console.log(this.allResults);
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showAllResults();
    }

    showAllResults() {
        $('#modal-results').html(""); // Tühjenda eelnevad tulemused
        for (let i = 0; i < this.allResults.length; i++) {
            let resultBox = `
                <div class="result-card">
                    <div class="result-field"><strong>Nimi:</strong> ${this.allResults[i].name}</div>
                    <div class="result-field"><strong>Aeg:</strong> ${this.allResults[i].score} s</div>
                </div>
            `;
            $('#modal-results').append(resultBox);
        }
    }
    

    saveToFile() {
        $.post('server.php', { save: this.allResults }).fail(
            function () {
                console.log("Fail");
            }
        )
    }
}

// Modal functionality
var modal = document.getElementById("myModal");
var btn = document.getElementById("openModalBtn");
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function () {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Initialize the game
let typer = new Typer(playerName);
