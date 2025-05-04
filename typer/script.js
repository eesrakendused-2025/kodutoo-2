console.log("scripti fail õigesti ühendatud")



let timerInterval;
let difficultyLevel = 3;
let typer;
// 8. samm helid
const startSound = document.getElementById("startSound");
const correctWord = document.getElementById("correctWord");
const wrongLetter = document.getElementById("wrongLetter");
const endSound = document.getElementById("endSound");

function startGame() {
    let playerName = prompt("Palun sisesta oma nimi");
    typer = new Typer(playerName);
}
// tasemetega soetud tegevused
$(document).ready(function () {
    $('.difficulty-btn').click(function () {
        difficultyLevel = parseInt($(this).attr('data-words'));
        $('#difficultyContainer').hide();
        startGame();
    });
});


class Typer{
    constructor(pname){
        this.name = pname;
        this.wordsInGame = difficultyLevel;
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
        // viimase punkti 3 funktsiooni timer
        this.timer = 0;
        this.startTime = 0;
        this.gameEnded = false;


        this.loadFromFile();
        //this.showResults(this.resultCount);
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content);
        })
    }

    getWords(data){
        //console.log(data);
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

        console.log(this.words);

        this.startTyper();
    }

    startTyper(){
        let urlParams = new URLSearchParams(window.location.search)
        if(urlParams.get("words")){
            this.wordsInGame = urlParams.get("words");
        }
        console.log(urlParams.get("words"));
        this.generateWords();
        this.startTime = performance.now();
        this.timerInterval = setInterval(() => { //timer funktsioon 9 samm ja allpool clear interval ka olemas
            this.timer = ((performance.now() - this.startTime) / 1000).toFixed(2);
            $('#timer').html(`Mängu kestus: ${this.timer} sek`);
        }, 100);
        $(document).keypress((event) => {this.shortenWords(event.key)});
        $('#loadResults').click(() => {
            this.resultCount = this.resultCount + 50;
            console.log(this.allResults.length, this.resultCount)
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResults").hide();
            }
            this.showResults(this.resultCount);
            $('#resultsModal').show(); // Ava modal
        });

        $(document).on('click', '.close-button', function(){
            $('#resultsModal').hide(); //modali sulgemine
        });
        // Modalite liseamine w3schools, moned naited veel ja gpt-ga bugfiximine.
        this.showResults(this.resultCount);
    }

    generateWords(){
        for(let i = 0; i <this.wordsInGame; i++){
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.round(Math.random() * this.words[wordLength].length);
            //console.log(i, randomWord, this.words[wordLength]);
            this.typeWords[i] = this.words[wordLength][randomWord];
            //console.log(this.typeWords)
        }
        this.selectWord();
        
    }

    drawWord(){
        $("#wordDiv").html(this.word);
    }

    selectWord(){
        this.word = this.typeWords[this.typedCount];
        this.typedCount++;
        this.drawWord();
        this.updateInfo();
    }

    updateInfo(){
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }
    // audio lisamine siia sisse õigel ajal.
    shortenWords(keyCode){
        console.log(keyCode);
        if(keyCode != this.word.charAt(0)){
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
            wrongLetter.play();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
            endSound.play();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            correctWord.play();
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus - this.bonusKoef;
        }

        this.drawWord();
    }

    changeBackground(color, time){
        setTimeout(function(){
            $('#container').removeClass(color);
        }, time)

        $('#container').addClass(color);

    }

    endGame(){
        if (this.gameEnded) return;
        this.gameEnded = true;

        clearInterval(this.timerInterval);
        console.log("Mäng läbi");
        endSound.play();
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
        document.getElementById("restartBtn").style.display = "block";
    }

    calculateAndShowScore(){
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();

        let numericScore = parseFloat(this.score);
        let wpm = (this.wordsInGame / numericScore) * 60;
        let imageUrl = "";

        if (wpm < 20){
            imageUrl = "pildid/snail.png";
        } else if (wpm < 40){
            imageUrl = "pildid/turtle.png";
        } else if (wpm < 60){
            imageUrl = "pildid/rabbit.png";
        } else {
            imageUrl = "pildid/cheetah.png";
        }
        // piltide näitamine tulemuste korvale gpt abiga tööle saamine
        let resultImageHtml = `
            <div class="result-container">
                <p>Sinu trükkimiskiirus: ${wpm.toFixed(1)} sõna/min</p>
                <img src="${imageUrl}" alt="Tulemus" class="result-image" />
            </div>
        `;

        $("#score").after(resultImageHtml);

        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        console.log(this.allResults);
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showResults(this.resultCount);
    }
    // parem näitamine leaderboardis pealkirjadega
    showResults(count) {
        $('#results').html("");
        for (let i = 0; i < count; i++) {
            $('#results').append(`
                <div class="result-card">
                    <div class="result-item"><span class="result-label">Nimi:</span> ${this.allResults[i].name}</div>
                    <div class="result-item"><span class="result-label">Aeg:</span> ${this.allResults[i].score} sek</div>
                    <div class="result-item"><span class="result-label">Sõnu:</span> ${this.allResults[i].words}</div>
                </div>
            `);
        }
    }

    showAllResults() {
        $('#results').html("");
        for (let i = 0; i < this.allResults.length; i++) {
            $('#results').append(`
                <div class="result-card">
                    <div class="result-item"><span class="result-label">Nimi:</span> ${this.allResults[i].name}</div>
                    <div class="result-item"><span class="result-label">Aeg:</span> ${this.allResults[i].score} sek</div>
                    <div class="result-item"><span class="result-label">Sõnu:</span> ${this.allResults[i].words}</div>
                </div>
            `);
        }
    }

    saveToFile(){
        $.post('server.php', {save: this.allResults}).fail(
            function(){
                console.log("Fail");
            }
        )
    }
}

// Modaliga tegelemine
$(document).ready(function () {
    const modal = document.getElementById("resultsModal");
    const closeButton = document.querySelector(".close-button");
    const loadButton = document.getElementById("loadResults");

    loadButton.addEventListener("click", function () {
        typer.showResults(typer.resultCount);
        modal.style.display = "block";
    });

    closeButton.addEventListener("click", function () {
        modal.style.display = "none";
        loadButton.style.display = "inline-block";
    });

    window.addEventListener("click", function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
            loadButton.style.display = "inline-block";
        }
    });
});
// Restart nupp
document.getElementById("restartBtn").addEventListener("click", () => {
    location.reload();
});