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

        this.loadFromFile();
        this.showAllResults();
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
        if(keyCode != this.word.charAt(0)){
            setTimeout(function(){
                $('#container').css(
                    "background-color", "lightblue"
                )
            }, 100)
            $('#container').css(
                "background-color", "red"
            )
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.selectWord();
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.word = this.word.slice(1);
        }

        this.drawWord();
    }

    endGame(){
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        //$(document).off(keypress);
        this.calculateAndShowScore();
    }

    calculateAndShowScore(){
        this.score = ((this.endTime - this.startTime) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        console.log(this.allResults);
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showAllResults();
    }

    showAllResults(){
        $('#results').html("");
        for(let i = 0; i < this.allResults.length; i++){
            $('#results').append("<div>" + this.allResults[i].name + " " + this.allResults[i].score + "</div>");
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