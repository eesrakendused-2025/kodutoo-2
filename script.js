console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");

class Typer{
    constructor(pname){
        this.name = pname;
        this.wordsInGame = 5;
        this.startingWordLength = 3;
        this.words = [];
        this.word = "START";
        this.typeWords = [];
        this.startTime = 0;
        this.endTime = 0;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        this.letters = 0;
        this.cpm = 0;
        this.bonus = 0;
        this.bonusKoef = 200;
        this.resultCount = 30;

        this.loadFromFile();
        this.showAllResults();
        //this.showResults(this.resultCount);
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            if (this.allResults.length === 0) {
                this.allResults = content;
            }
            
            console.log(content[0].name);
            console.log(content.length);
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
        this.showAllResults();
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
            if (this.startTime === 0) {
                this.startTime = performance.now();     
                document.getElementById("startSound").volume = 0.7;
                document.getElementById("startSound").play();
            }
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
            this.letters ++;
            correctSound.play();
            music.pause();
            document.getElementById("bgGif").style.opacity = 0;
            document.getElementById("bgGif").style.zIndex = -1;
            this.endGame();
            document.getElementById("snakeSprite").src="https://media1.tenor.com/m/DwaJbYyLGyYAAAAC/solid-snake-blink.gif";
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            correctSound.play();
            this.letters ++;
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            document.getElementById("snakeSprite").src="https://media.tenor.com/Xm3aw7T3mOQAAAAM/solid-snake-talking.gif";
            correctSound.play();
            this.letters ++;
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
        //this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        this.time = ((this.endTime - this.startTime)/60000);
        this.cpm = (this.letters / this.time).toFixed(2);
        console.log("CPM:", this.cpm);
        console.log("Letters:", this.letters);
        console.log(this.bonus, this.endTime, this.startTime, this.time);
        $("#score").html(this.cpm + "<br>" + "this u?").show();
        $("#resultImage").addClass("resultGif");
        if(this.cpm < 100) {4
            $("#resultImage").attr("src", "gifs/monkey.gif");
        } else if(this.cpm >= 100 && this.cpm <= 200) {
            $("#resultImage").attr("src", "gifs/yakuza-kiryu.gif");
        } else if(this.cpm > 200 && this.cpm < 350){
            $("#resultImage").attr("src", "gifs/gibberish.gif");
        } else {
            $("#resultImage").attr("src", "gifs/tc.gif");
        }
        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            letters: this.letters,
            cpm: this.cpm, //character per minute
            time: this.time.toFixed(2),
            words: this.wordsInGame
        }
        console.log(result);
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(b.cpm) - parseFloat(a.cpm));
        console.log(this.allResults);
        let position = this.allResults.findIndex(r =>
            r.name === result.name &&
            r.time === result.time &&
            r.cpm === result.cpm &&
            r.words === result.words
        );
        if (position === 0) {
            document.getElementById("leaderBoard").volume = 0.6;
            document.getElementById("leaderBoard").play();
        }else if (position > 0 && position < 3){
            document.getElementById("leaderBoard3").volume = 0.6;
            document.getElementById("leaderBoard3").play();
        } else {
            endSound.play();
        }
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showAllResults();
    }

    showAllResults(){
        $('#results').html("");
        $('#results').append("<tr><th>name</th><th>time</th><th>cpm</th><th>words</th></tr>");
        for (let i = 0; i < this.allResults.length; i++){
            $('#results').append(
                "<tr><td>" + this.allResults[i].name +  //<tr> <th></th>
                "</td><td>" + this.allResults[i].time + 
                "</td><td>" + this.allResults[i].cpm +
                "</td><td>" + this.allResults[i].words + 
                "</td></tr>"
            );
        }
    }

    /*showAllResults(){
        $('#results').html("");

        for(let i = 0; i < this.allResults.length; i++){
            $('#results').append("<div>" + this.allResults[i].name + " " + 
                this.allResults[i].score + 
                " (" + this.allResults[i].words + ")" +"</div>");
        }

    }*/

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
    $(modal).fadeIn(150); // how can I make my module window slowly appear?
}


span.onclick = function() {
    document.getElementById("moduleOff").volume = 0.4;
    document.getElementById("moduleOff").play();
    $(modal).fadeOut(80);

}

window.onclick = function(event) {
    if (event.target == modal) {
        document.getElementById("moduleOff").volume = 0.4;
        document.getElementById("moduleOff").play();
        $(modal).fadeOut(80);
    }
}