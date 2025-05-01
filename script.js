console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");

class Typer {
    constructor(name) {
        this.name = name;
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
        this.bonus = 0;
        this.bonusKoef = 200;
        this.resultCount = 30;

        this.loadFromFile();
    }

    loadFromFile() {
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content);
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
        console.log(this.words);
        this.startTyper();
    }

    startTyper() {
        let urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("words")) {
            this.wordsInGame = urlParams.get("words");
        }

        this.generateWords();
        this.startTime = performance.now();

        $(document).keypress((event) => { this.shortenWords(event.key) });

        //2. Kui vajutatakse "Laadi tulemusi" nuppu, avatakse modal-aken. Võetud ülesande lingilt
        $('#loadResults').click(() => {
            $('#resultsModal').css('display', 'block'); // Näita modali
            this.showResults(this.resultCount);         // Kuva tulemused modalisse
        });

        //2. Kui vajutatakse modali aknas "X" nuppu, suletakse modal
        $('#closeResults').click(() => {
            $('#resultsModal').css('display', 'none');
        });

        this.showResults(this.resultCount);
    }

    generateWords() {
        for (let i = 0; i < this.wordsInGame; i++) {
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.floor(Math.random() * this.words[wordLength].length);
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

    shortenWords(key) {
        if (key !== this.word.charAt(0)) {
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
        } else if (this.word.length === 1 && key === this.word.charAt(0) && this.typedCount === this.wordsInGame) {
            this.endGame();
            document.getElementById('audioPlayer').play();
        } else if (this.word.length === 1 && key === this.word.charAt(0)) {
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus -= this.bonusKoef;
        } else if (this.word.length > 0 && key === this.word.charAt(0)) {
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus -= this.bonusKoef;
        }

        this.drawWord();
    }

    changeBackground(colorClass, time) {
        setTimeout(() => {
            $('#container').removeClass(colorClass);
        }, time);
        $('#container').addClass(colorClass);
    }

    endGame() {
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
    }

    calculateAndShowScore() {
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show(); //Kuvatakse ainult skoor (ilma tekstita)
        this.saveResult();
    }

    saveResult() {
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame
        };
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showResults(this.resultCount);
    }

    showResults(count) {
        $('#results').html("");
        for (let i = 0; i < count; i++) {
            $('#results').append(`<div>${this.allResults[i].name} ${this.allResults[i].score} (${this.allResults[i].words})</div>`);
        }
    }

    saveToFile() {
        $.post('server.php', { save: this.allResults }).fail(() => {
            console.log("Fail");
        });
    }
}

let typer = new Typer(playerName);

