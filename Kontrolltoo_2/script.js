
let playerName = prompt("Palun sisesta on nimi");

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
        this.typeCount = 0;
        this.allResults = JSON.parse(localStorage.getItem("typer")) || [];
        this.score = 0;
        this.bonus = 0;
        this.resultCount = 3;
        this.scoreInMinutes = 0;
        this.wordsPerMinute = 0;
        this.scorePicture = document.getElementById("scorePic");

        this.loadFromFile();
        this.showResults(this.resultCount);
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content);
        })
    }

    getWords(data){
        //console.log(data)
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
        let URLwords = new URLSearchParams(window.location.search);
        console.log(URLwords.get('words'))
        if(URLwords.get('words')){
            this.wordsInGame = URLwords.get('words')
        }
        this.generateWords();
        this.startTime = performance.now();
        $(document).keypress((event)=>{this.shortendWords(event.key)});
        $('#loadResults').click(() => {
            this.resultCount = this.resultCount + 5;
            console.log(this.resultCount, this.allResults.length)
            $('#hideResults').show();
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResults").hide();
            }
            this.showResults(this.resultCount);
        })
        $('#hideResults').click(()=>{
            this.resultCount = this.resultCount - 5;
            $('#loadResults').show();
            if (this.resultCount <= 0){
                this.resultCount = 0;
                $('#hideResults').hide();
            }
            this.showResults(this.resultCount);
        })
    }

    generateWords(){
        for(let i=0; i<this.wordsInGame;i++){
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.round(Math.random() * this.words[wordLength].length);
            this.typeWords[i] = this.words[wordLength][randomWord];

        }

        this.selectWord();
    }

    drawWord(){
        $("#wordDiv").html(this.word);
    }
    
    selectWord(){
        this.word = this.typeWords[this.typeCount];
        this.typeCount++;
        this.drawWord();
        this.updateInfo();
    }

    updateInfo(){
        $("#info").html("Sõnade arv on: " + this.typeCount+"/"+this.wordsInGame);
    }

    shortendWords(keyCode){
        console.log(keyCode)
        if(keyCode != this.word.charAt(0)){
            this.changeBackground("wrong-button")
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typeCount == this.wordsInGame){
            this.endGame();
            //document.getElementById("audioPlayer").play();
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.changeBackground("right-word")
            this.selectWord();
            this.bonus = this.bonus - 100
        }else if(this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackground("right-button")
            this.word = this.word.slice(1);
            this.bonus = this.bonus - 100 // bonus pole aktiivne ( ei arvutata maha)
        }

        this.drawWord();
    }

    changeBackground(color){
        setTimeout(function(){
            $('#container').removeClass(color)
        }, 100)
        $('#container').addClass(color)

    }

    endGame(){
        console.log("mäng läbi")
        this.endTime = performance.now();
        $("#wordDiv").hide();
        //$(document.off(keypress));
        this.calculateAndShowScore();
        $('#containerBelow').show();
    }

    calculateAndShowScore(){
        //console.log(this.bonus)
        //console.log(this.endTime, this.startTime)
        this.score = ((this.endTime - this.startTime)/1000).toFixed(2);
        this.scoreInMinutes = this.score / 60;

        console.log(this.scoreInMinutes);
        this.wordsPerMinute = (this.wordsInGame / this.scoreInMinutes).toFixed(2);
        if(this.wordsPerMinute >= 50 && this.wordsPerMinute < 60){
            $("#scorePic").append("<img src=./Public/good-job.jpg alt='Väga hästi'></img>");
        }else if(this.wordsPerMinute >= 60 && this.wordsPerMinute < 70){
            $("#scorePic").append("<img src=./Public/fast_as_fck.jpg alt='Kiire oled'></img>");
        }else if(this.wordsPerMinute < 50){
            $("#scorePic").append("<img src=./Public/sloth.webp alt='Aeglane oled'></img>");
        }
        $("#score").html(this.score + " -- " + "WPM: " + this.wordsPerMinute).show();
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
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        console.log(this.allResults);
        this.saveToFile();
        this.showResults(this.resultCount);
    }

    showResults(count){
        $("#results").html("");
        $('#results').append("<table id='tabel'><tr><th>Nimi</th><th>aeg</th><th>sõnad</th></tr></table>")
        for (let i=0; i<count; i++){
            $("#tabel").append("<tr><td>" + this.allResults[i].name + "</td><td>" + this.allResults[i].score + "</td><td>" +
                this.allResults[i].words + "</td>" +"</tr>");
        }
    }

/*     showAllResults(){
        $("#results").html("");
        for (let i=0; i<this.allResults.length; i++){
            $("#results").append("<div>" + this.allResults[i].name + ": " + this.allResults[i].score +
                 " ( " + this.allResults[i].words+ " )"+"</div>");
        }
    } */

    saveToFile(){
        $.post("server.php", {save: this.allResults}).fail(
            function(){
                console.log("fail");
            }
        )
    }

}

let typer = new Typer(playerName);