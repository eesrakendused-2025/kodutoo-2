console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");

const introAudio = document.getElementById('start-audio');
$(document).one("keydown", () => {
    introAudio.play();
}); //laenatud ChatGPT-lt
        //prompt: how to play audio when user presses a key in JavaScript

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
        this.resultsVisible = false;

        this.setupModal();
        this.loadFromFile();
        $("#resultPhoto").hide();
        //this.showResults(this.resultCount);
    }

    setupModal() {
        $('#showResults').click(() => {
            $('#resultsModal').fadeIn(200);
            this.showResults(this.allResults.length); 
        });
    
        $('#closeResults').click(() => {
            $('#resultsModal').fadeOut(200);
        });
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
        $("#newGame").hide();
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

    shortenWords(keyCode){
        console.log(keyCode);
        const startAudio = document.getElementById('typingAudio');
        if (keyCode != this.word.charAt(0)) {
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
            startAudio.pause(); 
        } else if (this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame) {
            startAudio.pause();
            this.endGame();
        } else if (this.word.length == 1 && keyCode == this.word.charAt(0)) {
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
            startAudio.pause();
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)) {
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus - this.bonusKoef;
            startAudio.play();
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
        const endAudio = document.getElementById('endgame-audio');
        
        console.log("Mäng läbi");
        endAudio.play();
        this.endTime = performance.now();
        $("#wordDiv").hide();
        //$(document).off(keypress);
        this.calculateAndShowScore();
        $("#newGame").show();
        this.shareResults();
        this.newGameStart();
        this.showConfetti();
    }

    newGameStart(){
        $('#newGame').click(() => {
            $('#newGame').hide();
            window.location.reload();
        });
    }

    calculateAndShowScore(){
        console.log(this.bonus, this.endTime, this.startTime)
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
        this.resultPhoto();
    }
    
    resultPhoto(){
        $('#resultPhoto').show();
        if(this.score <= 3){
            $('#resultPhoto').attr("src", "trophy.jpg");
        } else if(this.score <= 5 && this.score > 3){
            $('#resultPhoto').attr("src", "cheers.jpg");
        } else if(this.score <= 10 && this.score > 5){
            $('#resultPhoto').attr("src", "thumbs-up.jpg");
        } else if(this.score <= 20 && this.score > 10){
            $('#resultPhoto').attr("src", "no.jpg");
        } else {
            $('#resultPhoto').attr("src", "thumbs-down.png");
        }
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
        if (this.resultsVisible) {
            this.showResults(this.resultCount);
        }
    }

    showResults(count){
        document.getElementById('resultsAudio').play();
        $('#results').html("");
        for(let i = 0; i < count; i++){
            if(this.allResults[i]){
                $('#results').append(`
                    <div class="result-row">
                      <span class="name">${this.allResults[i].name}</span>
                      <span class="score">${this.allResults[i].score}</span>
                      <span class="words">${this.allResults[i].words}</span>
                    </div>
                  `);
            }
            
        }
    
    }

    showAllResults(){
        $('#results').html("");

        for(let i = 0; i < this.allResults.length; i++){
            $('#results').append(`
                <div class="result-row">
                  <span class="name">${this.allResults[i].name}</span>
                  <span class="score">${this.allResults[i].score}</span>
                  <span class="words">(${this.allResults[i].words})</span>
                </div>
              `);
        }

    }

    shareResults() {
        let score = this.score;
        const currentPageURL = window.location.href;
        const twitterText = `Minu trükkimiskiirus on ${score} sekundi pealt!`;
        const twitterURL = `https://twitter.com/intent/tweet?text=${
            encodeURIComponent(twitterText)}&url=${encodeURIComponent(currentPageURL)}`;
        
        const twitterButton = document.getElementById('twitter');
        twitterButton.href = twitterURL;
        twitterButton.setAttribute("target", "_blank");
        twitterButton.style.display = "inline-block";
    } //laenatud ChatGPT-lt
        //prompt: how to create a share link for Twitter in javascript

    showConfetti() {
        confetti({
            particleCount: 200,
            angle: 90,
            spread: 70,
            origin: { x: 0.5, y: 0.5 }
        });
    } //laenatud ChatGPT-lt
        //prompt: how to create confetti animation in javascript

    saveToFile(){
        $.post('server.php', {save: this.allResults}).fail(
            function(){
                console.log("Fail");
            }
        )
    }
}

let typer = new Typer(playerName);