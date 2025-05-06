console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");

class Typer{
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
        this.allResults = JSON.parse(localStorage.getItem("typer")) || [];
        this.score = 0;
        this.bonus = 0;
        this.bonusKoef = 200;
        this.resultCount = 10;

        this.loadFromFile();
        //this.showResults(this.resultCount);
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content)
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
            this.wordsInGame = urlParams.get("words")
        
        }
        console.log(urlParams.get("words"));
        this.generateWords();
        this.startTime = performance.now();
        $(document).keypress((event) => {this.shortenWords(event.key)});
        $("#loadResults").click(() => {
            this.showResults(this.allResults.length); // show ALL results
            document.getElementById("Modal").style.display = "block"; 
            console.log(this.allResults.length, this.resultCount)
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResult").hide();
            }
            this.showResults(this.resultCount + 5)
    })
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
        $("#info").html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(keyCode){
        console.log(keyCode);
        if(keyCode != this.word.charAt(0)){
            this.changeBackGround("wrong-button", 100)
            this.bonus = 0;
    }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
            document.getElementById("audioPlayer").play();
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.changeBackGround("right-word", 200)
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackGround("right-button", 100)
            this.word = this.word.slice(1);
            this.bonus = this.bonus - this.bonusKoef;
        }

        this.drawWord();
    }

    changeBackGround(color, time){
        setTimeout(function(){
            $("#container").removeClass(color)
        }, time)
            $("#container").addClass(color);
    }

    endGame(){
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        //$(document).off(keypress);
        this.calculateAndShowScore();
    }

    calculateAndShowScore(){
        console.log(this.bonus, this.endTime, this.startTime);
        this.score = Math.round((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame,
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        console.log(this.allResults);
        localStorage.setItem("typer", JSON.stringify(this.allResults));
        this.saveToFile();
        this.showResults(this.resultCount);
    }

    showResults(count){
        $("#results").html("");
        for(let i = 0; i < count; i++){
            $("#results").append("<div>" + this.allResults[i].name + "" + 
                this.allResults[i].score + 
                " (" + this.allResults[i].words + ")" + "</div>");
        }
    }
    saveToFile(){
        $.post("server.php", {save: this.allResults}).fail(
            function(){
                console.log("Fail");
            }
        )
    }
}
// Võetud kood: https://www.w3schools.com/howto/howto_css_modals.asp
    // gets the modal
    var modal = document.getElementById("Modal");

    // gets the button that opens the modal
    var button = document.getElementById("loadResults");

    // gets the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on the button, open the modal
    button.onclick = function() {
        modal.style.display = "block";
    }

    span.onclick = function() {
        modal.style.display = "none";
    }
let typer = new Typer(playerName);