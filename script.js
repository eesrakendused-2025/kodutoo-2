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

    //3. Kuva tulemused paremini välja, kui praegu. 
    // Praegu lihtsalt tühikutega eraldatud tulemused, aga paiguta need eraldi elementidesse ja kujunda selgemalt. 
    // Lisa ka pealkirjad igale osale, et saaks aru, mis osaga on tegemist (nimi, kiirus jne).
    // Lasin ChatGPT selle valmis kirjutada päringuga: "Loo mulle modali tabeli kujul tulemused, kus on pealkirjadeks "nimi", "aeg (s) ja sõnade arv"
    showResults(count) {
        $('#results').html("");
    
        // 3.Pealkirjade rida
        $('#results').append(`
            <div class="result-row result-header">
                <div class="result-cell">Nimi</div>
                <div class="result-cell">Aeg(s)</div>
                <div class="result-cell">Sõnade arv</div>
            </div>
        `);
    
        // 3.Mängu sooritanud tulemuste tsükkel, et tulemusi kuvada
        for (let i = 0; i < count; i++) {
            const r = this.allResults[i];
        
            // Kujunduse poolest lisan, et eristada esimest, teist ja kolmandat kohta need read vastavalt seda värvi medaliteks
            // GPT päring: "Loo mulle nii, et esimesed 3 rida on nagu medalid, esimene kuldne, teine hõbedane ja kolmas pronks."
            let rowClass = "";
            if (i === 0) rowClass = "first-place";
            else if (i === 1) rowClass = "second-place";
            else if (i === 2) rowClass = "third-place";
        
            $('#results').append(`
                <div class="result-row ${rowClass}">
                    <div class="result-cell">${r.name}</div>
                    <div class="result-cell">${r.score}</div>
                    <div class="result-cell">${r.words}</div>
                </div>
            `);
        }
        
    }
    
    saveToFile() {
        $.post('server.php', { save: this.allResults }).fail(() => {
            console.log("Fail");
        });
    }
}

let typer = new Typer(playerName);

