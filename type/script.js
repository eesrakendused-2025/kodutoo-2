console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");
let typer;


class Typer{
    constructor(pname, wordCount){
        this.name = pname;
        this.wordsInGame = wordCount;
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
        //chatgpt pakkus selle välja
        //prompt: "I need to play a sound when the user starts typing but only once"
        this.typingAudioPlaying = false; 
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content);
            console.log("Laetud tulemused:", this.allResults);
            this.showResults(this.resultCount);
        });
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
        $(document).keypress((event) => {this.shortenWords(event.key)});
        $('#loadResults').click(() => {
            this.resultCount = this.resultCount + 20;
            console.log(this.allResults.length, this.resultCount)
            if(this.resultCount > this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResult").hide();
            }
            this.showResults(this.resultCount);
        })
        document.getElementById('startSound').play();

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

    updateInfo() {
        $('#progressInfo').text(this.typedCount + "/" + this.wordsInGame);
    }
    
//chatgpt aitas pann heli mängima peale esimest klahvi vajutust
//prompt: "I need to play a sound when the user starts typing but only once"
shortenWords(keyCode) {
    console.log(keyCode);
    if (keyCode === this.word.charAt(0)) {
        if (!this.typingAudioPlaying) {
            const typeSound = document.getElementById("typeSound");
            typeSound.loop = true;
            typeSound.play();
            this.typingAudioPlaying = true;
        }
        if (this.word.length === 1 && this.typedCount === this.wordsInGame) {
            this.endGame();
            document.getElementById('audioPlayer').play();
        } else if (this.word.length === 1) {
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus -= this.bonusKoef;
        } else {
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus -= this.bonusKoef;
        }
    } else {
        this.changeBackground('wrong-button', 100);
        this.bonus = 0;
    }
    this.drawWord();
    this.updateCPM();
}

    changeBackground(color, time){
        setTimeout(function(){
            $('#container').removeClass(color);
        }, time)

        $('#container').addClass(color);

    }

    endGame() {
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
        document.getElementById("playAgainBtn").style.display = "inline-block";
        document.getElementById('endSound').play();
        const typeSound = document.getElementById("typeSound");
        typeSound.pause();
        typeSound.currentTime = 0;
        this.typingAudioPlaying = false;
    }
    
    calculateAndShowScore(){
        console.log(this.bonus, this.endTime, this.startTime)
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
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

        if (this.allResults.findIndex(r => r.name === this.name && r.score === this.score) < 3) {
            document.getElementById('highscoreSound').play();
        }
        console.log(this.allResults);
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showResults(this.resultCount);
    }

//chatpgt prompt: "how to make this code (olemasolev showresults) into a table where nimi, aeg and sõnade arv are the columns and the results are rows"
//filtreerimine lisatud
//filtr prompt: "nothing comes up when I search for a name in modal"
filtreerimise
showResults(count) {
    $('#results').html("");

    $('#results').append(`
        <div class="result-header result-grid">
            <div>Nimi</div>
            <div>Aeg (sekundites)</div>
            <div>Sõnade arv</div>
        </div>
    `);

    const filterText = ($('#nameFilter').val() || "").toLowerCase();
    console.log("Filter tekst:", filterText);

    let resultsToShow = [];

    resultsToShow = this.allResults;

    if (filterText.length > 0) {
        resultsToShow = resultsToShow.filter(result =>
            typeof result.name === 'string' &&
            result.name.toLowerCase().includes(filterText)
        );     
    }

resultsToShow = resultsToShow.slice(0, count);

    console.log("Leitud tulemused:", resultsToShow);

    if (resultsToShow.length === 0) {
        $('#results').append(`<div style="padding: 20px; text-align: center;">Ei leitud tulemusi.</div>`);
        return;
    }

    for (let i = 0; i < count && i < resultsToShow.length; i++) {
        $('#results').append(`
            <div class="result-row result-grid">
                <div>${resultsToShow[i].name}</div>
                <div>${resultsToShow[i].score}</div>
                <div>${resultsToShow[i].words}</div>
            </div>
        `);
    }
}

    showAllResults(){
        $('#results').html("");

        for(let i = 0; i < this.allResults.length; i++){
            $('#results').append("<div>" + this.allResults[i].name + " " + 
                this.allResults[i].score + 
                " (" + this.allResults[i].words + ")" +"</div>");
        }

    }

    saveToFile(){
        $.post('server.php', {save: this.allResults}).fail(
            function(){
                console.log("Fail");
            }
        )
    }
// chatgpt prompt alloleva koodi jaoks: 
// "I need a characters per minute counter to show the user if his typing is slow, average or fast 
// and show the characters per minute as well"

// Muutsin üsna palju, et oma koodiga tööle saada"

//chatgpt teine prompt: 
// "I also want to show images depending on how fast the users typing is so for every level one picture"

    updateCPM() {
        const now = performance.now();
        const seconds = (now - this.startTime) / 1000;
    
        const charsTyped = this.typeWords
            .slice(0, this.typedCount - 1)
            .join('').length + (this.typeWords[this.typedCount - 1]?.length - this.word.length);
    
        const cpm = Math.round((charsTyped / seconds) * 60);
    
        let level = '';
        let image = '';
    
        if (cpm < 150) {
            level = 'Aeglane';
            image = 'images/slow.png';
        } else if (cpm <= 250) {
            level = 'Keskmine';
            image = 'images/medium.png';
        } else {
            level = 'Kiire';
            image = 'images/fast.png';
        }
    
        $('#cpmText').text("CPM: " + cpm);
        $('#speedLevelText').text("Tase: " + level);
        $('#speedImage').attr('src', image);
    }
     
}

//chatgpt prompt: "I need to have a function that allows the user to select 
// how many words are generated in the game
// after the user has entered his name, right now I have just a prompt for the name:
// "let typer = new Typer(playerName);"
document.getElementById("startGameBtn").onclick = function () {
    const wordCount = parseInt(document.getElementById("wordCountSelect").value);
    document.getElementById("setupContainer").style.display = "none";
    typer = new Typer(playerName, wordCount);
};

document.getElementById("playAgainBtn").onclick = function () {
    location.reload();
};

//Chatgpt abiga sain allpool oleva koodi,
// kasutasin gpt abi, sest ei osanud ise w3schools lehelt saadud js koodi osa kuidagi tööle saada
// panin seda typer classi sisse ja selle tõttu see ei töötanudki
// gpt prompt: "how to use this code *(w3schools js code)* in my own js file, 
// it keeps giving me errors"

// Modal avamine ja kuulaja lisamine
var modal = document.getElementById("myModal");
var btn = document.getElementById("myBtn");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
  modal.style.display = "block";
  typer.showResults(typer.allResults.length);
};

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

//chatgpt antud kood filtreerimise jaoks
//prompt: "I need a name filter for my modal using input."
//chatgpt promt: "problem, filtering now gives no results at all"
$(document).ready(function () {
    $('#nameFilter').on('input', function () {
        if (typer) {
            typer.showResults(typer.allResults.length);
        }
    });
});
