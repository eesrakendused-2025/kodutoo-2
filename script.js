console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");

class Typer{
    constructor(name){
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
        this.fonts = [
            "Arial", "Verdana", "Tahoma", "Georgia", "Courier New", 
            "'Roboto', sans-serif", "'Open Sans', sans-serif", 
            "'Lobster', cursive", "'Pacifico', cursive", "'Press Start 2P'", "Garamond",
            "Courier New", "'Cormorant Garamond', serif","'Orbitron', sans-serif","'Rowdies', cursive",
            "'Single Day', cursive"
        ];
        this.loadFromFile();
        this.showResults(this.resultCount);
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

    startCountdown(callback) { //Idee siit: https://codepen.io/asdraban/pen/BaKoMeE
        console.log("Countdown käivitus");
        let countdownNum = 3;
        const countdownDiv = $('#countdown');
        const audio = document.getElementById("countdownAudio");

        countdownDiv.show();
        countdownDiv.text(countdownNum);

        audio.currentTime = 0;
        audio.play();
    
        const countdownInterval = setInterval(() => {
            countdownNum--;
            if (countdownNum > 0) {
                countdownDiv.text(countdownNum);
            } else {
                clearInterval(countdownInterval);
                countdownDiv.text("START!");
                setTimeout(() => {
                    countdownDiv.hide();
                    $("#wordDiv").show();
                    callback(); 
                }, 1000);
            }
        }, 1000);
    }
    
    startTyper(){
        let urlParams = new URLSearchParams(window.location.search)
        if(urlParams.get("words")){
            this.wordsInGame = urlParams.get("words");
        }
    
        $("#wordDiv").hide();
    
        this.startCountdown(() => {
            this.generateWords();
            this.startTime = performance.now();
    
            const ingameAudio = document.getElementById("ingameAudio");
            ingameAudio.currentTime = 0;
            ingameAudio.play();
    
            // ChatGPT parandatud: Kuidas vältida mitmekordseid käivitusi, kui tekib viga "play again" vajutamisega
            $(document).off("keypress");
            $(document).on("keypress", (event) => this.shortenWords(event.key));
        });
    
        $('#loadResults').click(() => {
            let sbAudio = document.getElementById("scoreboardAudio");
            sbAudio.currentTime = 0;
            sbAudio.play();
    
            this.resultCount = this.resultCount + 20;
            console.log(this.allResults.length, this.resultCount)
            if(this.resultCount > this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResult").hide();
            }
            this.showResults(this.resultCount);
            $('#resultsModal').show();
            $('.close').on('click', () => {
                $('#resultsModal').hide();
            });
    
            $(window).on('click', (event) => {
                if ($(event.target).is('#resultsModal')) {
                    $('#resultsModal').hide();
                }
            });
        });
    }
    
    generateWords(){
        for(let i = 0; i < this.wordsInGame; i++){
            const wordLength = this.startingWordLength + i;
    
            // ChatGPT parandatud: kuidas kontrollida, kas sellise pikkusega sõnad eksisteerivad
            if (this.words[wordLength] && this.words[wordLength].length > 0) {
                const randomIndex = Math.floor(Math.random() * this.words[wordLength].length);
                this.typeWords[i] = this.words[wordLength][randomIndex];
            } else {
                console.error(`Puuduvad sõnad pikkusega: ${wordLength}`); 
                this.typeWords[i] = "???"; 
            }
        }
        this.selectWord();
    }
    
    drawWord(){
        $("#wordDiv").html(this.word);
    }

    selectWord(){
        this.word = this.typeWords[this.typedCount];
        this.typedCount++;
        this.changeFont();
        this.drawWord();
        this.updateInfo();
    }

    updateInfo(){
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(keyCode){
        console.log("Vajutatud:", keyCode, "Ootab:", this.word);
    
        // ChatGPT parandatud: Kuidas kontrollida, kas this.word on määratud ja mitte tühi
        if (!this.word || this.word.length === 0) {
            console.warn("Tühi või määratlemata sõna, katkestan shortenWords");
            return;
        }
    
        if(keyCode != this.word.charAt(0)){
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
            document.getElementById('audioPlayer').play();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
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

    changeFont() { //Idee ja Funktsioon siit - https://stackoverflow.com/questions/21862759/how-do-i-generate-a-random-font-to-a-line-of-text-every-time-page-is-refreshed
        const randomFont = this.fonts[Math.floor(Math.random() * this.fonts.length)];
        document.getElementById("wordDiv").style.fontFamily = randomFont;
    }
        
    endGame(){
        console.log("Game over!!");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        const ingameAudio = document.getElementById("ingameAudio");
        ingameAudio.pause();
        ingameAudio.currentTime = 0;

        this.calculateAndShowScore();
    }

    calculateAndShowScore(){
        console.log(this.bonus, this.endTime, this.startTime)
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
        this.showSpeedImage();
        $("#playAgainBtn").show();
    }

    showSpeedImage() {
        let wpm = (this.wordsInGame / (parseFloat(this.score) / 60)).toFixed(1);
        let imgSrc = "";
        let levelText = "";
        
        if (wpm < 20) {
            imgSrc = "img/slow.jpg";
            levelText = "SLOW   =_=";
        } else if (wpm >= 20 && wpm < 40) {
            imgSrc = "img/average.jpg";
            levelText = "AVERAGE   ¯\_(ツ)_/¯ ";
        } else if (wpm >= 40 && wpm < 60) {
            imgSrc = "img/fast.png";
            levelText = "FAST   ٩( ^ᴗ^ )۶ ";
        } else {
            imgSrc = "img/pro.jpg";
            levelText = "PRO   ミヽ（。＞＜）ノ";
        }
    
        const imgElement = document.getElementById("speedImage");
        imgElement.src = imgSrc;
        imgElement.style.display = "block";
        
        const infoDiv = document.getElementById("speedInfo");
        infoDiv.innerHTML = `Your WPM: <strong>${wpm}</strong><br>LEVEL: <strong>${levelText}</strong>`;
        document.getElementById("resultBox").style.display = "block";

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

    showResults(count) {
        $('#result-numbers').html("");
        $('#result-names').html("");
        $('#result-times').html("");
        $('#result-words').html("");
    
        for (let i = 0; i < count; i++) {
            if (this.allResults[i]) {
                const result = this.allResults[i];
    
                let topClass = "";
                if (i === 0) topClass = "top-player top-player-1";
                else if (i === 1) topClass = "top-player top-player-2";
                else if (i === 2) topClass = "top-player top-player-3";
    
                let currentPlayerClass = result.name === this.name ? "current-player" : "";
    
                let medalHTML = "";
                if (i === 0) medalHTML = '<span class="medal-icon gold-medal">1</span> ';
                else if (i === 1) medalHTML = '<span class="medal-icon silver-medal">2</span> ';
                else if (i === 2) medalHTML = '<span class="medal-icon bronze-medal">3</span> ';
                //ChatGPT aitas parandada tabelite järjestuse ja dünaamika
                const combinedClasses = `result-row ${topClass} ${currentPlayerClass}`;
    
                $('#result-numbers').append(`<div class="${combinedClasses}">${i + 1}.</div>`);
                $('#result-names').append(`<div class="${combinedClasses}">${medalHTML}${result.name}</div>`);
                $('#result-times').append(`<div class="${combinedClasses}">${result.score}</div>`);
                $('#result-words').append(`<div class="${combinedClasses}">${result.words}</div>`);
            }
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
}

let typer = new Typer(playerName);
$("#playAgainBtn").click(() => {
    document.getElementById("newgameAudio").play();
    $("#score").hide();
    $("#resultBox").hide();
    $("#playAgainBtn").hide();

    // ChatGPT: Kuidas paremaks muuta uue pildi kuvamist, kui vana tulemuse pilt on vahepeal näha?
    document.getElementById("speedImage").style.display = "none";
    document.getElementById("speedInfo").innerHTML = "";
    typer = new Typer(playerName); 
});