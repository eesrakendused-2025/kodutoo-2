let playerName = prompt("Palun sisesta oma nimi");

class Typer{
    constructor(pname){
        this.name = pname;
        this.wordsInGame = parseInt($("#wordsInGame").val()) || 3;
        if(this.wordsInGame < 1){
            this.wordsInGame = 1;
            $("#wordsInGame").val(this.wordsInGame);
        } else if(this.wordsInGame > 31){
            this.wordsInGame = 31;
            $("#wordsInGame").val(this.wordsInGame);
        }
        this.startingWordLength = parseInt($("#startingWordLength").val()) || 3;
        if(this.startingWordLength < 1){
            this.startingWordLength = 1;
            $("#startingWordLength").val(this.startingWordLength);
        } else if(this.startingWordLength + this.wordsInGame > 31){
            this.startingWordLength = 31 - this.wordsInGame;
            $("#startingWordLength").val(this.startingWordLength);
        }
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
        this.resultCount = 5;
        this.charactersTyped = 0;
        this.cpm = 0;
        $("#settings").hide();
        this.loadFromFile();
    }

    handleKeypress(event){
        typer.shortenWords(event.key)
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        /*$.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
        })*/
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
        let urlParams = new URLSearchParams(window.location.search)
        if(urlParams.get("words")){
            this.wordsInGame = urlParams.get("words");
        }
        this.generateWords();
        this.startTime = performance.now();
        $(document).on("keypress", this.handleKeypress);
        $('#loadResults').click(() => {
            this.resultCount = this.resultCount + 50;
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResults").hide();
            }
            this.showResults(this.resultCount);
        });
        $('#showResults').click(()=>{
            $('#resultsModal').css("display", "block");
        });
        $(window).click((event) => {
            if ($(event.target).is('#resultsModal')) {
                $('#resultsModal').css("display", "none");
            }
        });
        $('#close').click(()=>{
            $('#resultsModal').css("display", "none");
        });
        this.showResults(this.resultCount);
    }

    generateWords(){
        for(let i = 0; i < this.wordsInGame; i++){
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
        this.word = this.typeWords[this.typedCount];
        this.typedCount++; 
        this.drawWord();
        this.updateInfo();
    }

    updateInfo(){
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(key){
        this.charactersTyped++;
        console.log(this.word);
        if(!this.word || this.word.length == 0){
            this.selectWord();
        }
        if(this.typedCount > this.wordsInGame){
            this.endGame();
            return;
        }
        if(key != this.word.charAt(0)){
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
        } else if(this.word.length == 1 && key == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.typedCount = 0;
            this.endGame();
        } else if(this.word.length == 1 && key == this.word.charAt(0)){
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
        } else if (this.word.length > 0 && key == this.word.charAt(0)){
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus - this.bonusKoef;
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
        $(document).off("keypress", this.handleKeypress);
        this.calculateAndShowScore();
        $("#settings").show();
        console.log("End of game.");
    }

    calculateAndShowScore(){
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        this.cpm = (this.charactersTyped / ((this.endTime - this.startTime) / 1000) * 60).toFixed(2);
        $("#time").html(this.score);
        $("#cpm").html(this.cpm);
        $("#score").css("display", "flex");
        if(this.cpm >= 150){
            $("#image").attr("src", "images/thumbs_up.png");
        } else{
            $("#image").attr("src", "images/thumbs_down.png");
        }
        $("#image").show();
        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame,
            cpm : this.cpm
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(b.cpm) - parseFloat(a.cpm));
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        //this.saveToFile();
        this.showResults(this.resultCount);
    }

    showResults(count) {
        $('#results').html(`
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Nimi</th>
                        <th>Skoor</th>
                        <th>Sõnade arv</th>
                        <th>Sümbolit minutis</th>
                    </tr>
                </thead>
                <tbody id="resultsBody"></tbody>
            </table>
        `);
        if(count>this.allResults.length){count = this.allResults.length};
        for (let i = 0; i < count; i++) {
            const result = this.allResults[i];
            //console.log(result);
            $('#resultsBody').append(`
                <tr>
                    <td>${result.name}</td>
                    <td>${result.score}</td>
                    <td>${result.words}</td>
                    <td>${result.cpm}</td>
                </tr>
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
/*
    saveToFile(){
        $.post('server.php', {save: this.allResults}).fail(
            function(){
                console.log("Fail");
            }
        )
    }
*/
}

let typer;

function restartGame(){
    $("#score").hide();
    $("#image").hide();
    $("#wordDiv").show();
    $('#results').html("");
    $('#loadResults').show();
    $('#resultsModal').css("display", "none");
    typer = new Typer(playerName);
}

window.onload = function(){
    $("#startButton").click(restartGame);
}