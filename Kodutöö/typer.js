class Typer {
    constructor(pname){
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
        this.bonus = 0;
        this.bonusKoef = 200;
        this.resultCount = 30;

        this.sounds = {
            start: document.getElementById('audioStart'),
            key: document.getElementById('audioKeypress'),
            end: document.getElementById('audioEnd'),
            highscore: document.getElementById('audioHighscore')
        };

        this.loadFromFile();
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            this.showResults(this.resultCount); 
        });
    }

    getWords(data){
        const dataFromFile = data.split("\n");
        this.separateWordsByLength(dataFromFile);
    }

    separateWordsByLength(data){
        for(let i = 0; i < data.length; i++){
            const wordLength = data[i].length;
            if(this.words[wordLength] === undefined){
                this.words[wordLength] = [];
            }
            this.words[wordLength].push(data[i]);
        }
        this.startTyper();
    }

    startTyper(){
        this.sounds.start.play();
        this.generateWords();
        this.startTime = performance.now();
        $(document).keypress((event) => { this.shortenWords(event.key); });
        $('#showResultsBtn').click(() => {
            this.showResults(this.resultCount); 
        });
        this.showResults(this.resultCount);  
    }

    generateWords(){
        for(let i = 0; i < this.wordsInGame; i++){
            const wordLength = this.startingWordLength + i;
            const randomIndex = Math.floor(Math.random() * this.words[wordLength].length);
            this.typeWords[i] = this.words[wordLength][randomIndex];
        }
        this.selectWord();
    }

    selectWord(){
        this.word = this.typeWords[this.typedCount];
        this.typedCount++;
        this.drawWord();
        this.updateInfo();
    }

    drawWord(){
        $("#wordDiv").html(this.word);
    }

    updateInfo(){
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(keyCode){
        if(keyCode != this.word.charAt(0)){
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;

            this.sounds.key.currentTime = 0;
            this.sounds.key.play();
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus - this.bonusKoef;

            this.sounds.key.currentTime = 0;
            this.sounds.key.play();
        }
        this.drawWord();
    }

    changeBackground(color, time){
        setTimeout(function(){
            $('#container').removeClass(color);
        }, time);
        $('#container').addClass(color);
    }

    endGame(){
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
        this.sounds.end.play();
    }

    calculateAndShowScore(){
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame
        };

        let previousTop = this.allResults[0]?.score;
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

        if (this.allResults[0] === result && result.score != previousTop) {
            this.sounds.highscore.play();
        }

        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.showResults(this.resultCount);
    }

    showResults(count){ //Chatbgt: how to add results
        $('#resultsList').html("");  
        for(let i = 0; i < count; i++){
            if(this.allResults[i]) { 
                $('#resultsList').append(`
                    <div class="result-entry">
                        <div class="result-row">
                            <span><strong>${this.allResults[i].name}</strong></span>
                            <span>${this.allResults[i].score}</span>
                        </div>
                        <div><em>${this.allResults[i].words} sõna</em></div>
                    </div>
                `);
            }
        }
    }
}

$(document).ready(function(){
    let playerName = prompt("Palun sisesta oma nimi");
    let typer = new Typer(playerName);

    $('#closeResults').click(() => {
        $('#results').hide();
    });

    $('#showResultsBtn').click(() => {
        $('#results').toggle();
    });
});

function updateClock() {
    const now = new Date();
    const date = now.toLocaleDateString('et-EE');
    const time = now.toLocaleTimeString('et-EE', { hour12: false });
    $('#clock').text(`${date} ${time}`);
}
setInterval(updateClock, 1000);
updateClock();
