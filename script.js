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
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        this.score = 0;
        this.bonus = 0;
        this.bonusKoef = 200;
        this.resultCount = 30;

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
        $(document).keypress((event) => {this.shortenWords(event.key)});
        /*$('#loadResults').click(() => {
            this.resultCount = this.resultCount + 50;
            console.log(this.allResults.length, this.resultCount)
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResults").hide();
            }
            this.showResults(this.resultCount);
        })*/
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

    shortenWords(keyCode){
        console.log(keyCode);
        const  correctSound = document.getElementById("correctIput").cloneNode();/* how can I overlap sounds? */
        const errorSound = document.getElementById("error").cloneNode();
        const endSound = document.getElementById("endSound");
        const music = document.getElementById("music");
        correctSound.volume = 0.7; /* how can I change audio volume in js */
        errorSound.volume = 0.6;
        endSound.volume = 0.15;
        music.volume = 0.15;
        if (keyCode) {
            document.getElementById("bgGif").style.transition = "opacity 80s, z-index 10s";
            document.getElementById("bgGif").style.opacity = 0.7;
            document.getElementById("bgGif").style.zIndex = 1;
            
            
            music.play();
        }
        if(keyCode != this.word.charAt(0)){
            document.getElementById("snakeSprite").src="https://media1.tenor.com/m/DwaJbYyLGyYAAAAC/solid-snake-blink.gif";
            this.changeBackground('wrong-button', 100);
            errorSound.play();
            this.bonus = 0;
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            document.getElementById("bgGif").style.transition = "opacity 1s, z-index 1s";
            correctSound.play();
            endSound.play();
            music.pause();
            document.getElementById("bgGif").style.opacity = 0;
            document.getElementById("bgGif").style.zIndex = -1;
            this.endGame();
            document.getElementById("snakeSprite").src="https://media1.tenor.com/m/DwaJbYyLGyYAAAAC/solid-snake-blink.gif";
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            correctSound.play();
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            document.getElementById("snakeSprite").src="https://media.tenor.com/Xm3aw7T3mOQAAAAM/solid-snake-talking.gif";
            correctSound.play();
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
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        //$(document).off(keypress);
        this.calculateAndShowScore();
    }

    calculateAndShowScore(){
        console.log(this.bonus, this.endTime, this.startTime)
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score + "<br>" + "this u?").show();
        if(this.score < 5) {
            $("#resultImage").attr("src", "gifs/tc.gif");
        } else if(this.score > 5 && this.score < 30) {
            $("#resultImage").attr("src", "gifs/yakuza-kiryu.gif");
        } else {
            $("#resultImage").attr("src", "gifs/monkey.gif");
        }
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

    showResults(count){
        $('#results').html("");
        $('#results').append("<tr><th>name</th><th>time</th><th>words</th></tr>");
        for(let i = 0; i < count; i++){
            $('#results').append("<tr><td>" + this.allResults[i].name + "</td><td>" +  //<tr> <th></th>
                this.allResults[i].score + 
                "</td><td>" + this.allResults[i].words + "</td>");
            /*$('#results').append("<div>" + this.allResults[i].name + " " + 
                this.allResults[i].score + 
                " (" + this.allResults[i].words + ")" +"</div>");*/
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

let modal = document.getElementById("resultModal");

let btn = document.getElementById("showResultsBtn");

let span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
    document.getElementById("moduleOn").volume = 0.4;
    document.getElementById("moduleOn").play();
    modal.style.display = "block";
}


span.onclick = function() {
    document.getElementById("moduleOff").volume = 0.4;
    document.getElementById("moduleOff").play();
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}