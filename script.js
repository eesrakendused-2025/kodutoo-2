console.log("scripti fail Ãµigesti Ã¼hendatud")

let playerName = prompt("Palun sisesta oma nimi");

let difficulty = prompt(
    "Vali raskusaste:\n1 – Lihtne (3–4 tähte)\n2 – Keskmine (5–6 tähte)\n3 – Raske (7+ tähte)"
);
  
  // määrame algava pikkuse vastavalt valikule
let startingWordLength = 3;
  
if (difficulty === "2") {
    startingWordLength = 5;
} else if (difficulty === "3") {
    startingWordLength = 7;
}
  


class Typer{
    constructor(pname){
        this.name = pname;
        this.wordsInGame = 3;
        this.startingWordLength = startingWordLength;
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
        document.getElementById("startSound").play().catch(() => {});
        let urlParams = new URLSearchParams(window.location.search)
        if(urlParams.get("words")){
            this.wordsInGame = urlParams.get("words");
        }
        console.log(urlParams.get("words"));
        this.generateWords();
        this.startTime = performance.now();
        this.timerInterval = setInterval(() => {
            const now = performance.now();
            const elapsed = (now - this.startTime + this.bonus) / 1000;
            $('#liveTimer').html(`⏱ Aeg: ${elapsed.toFixed(1)} s`);
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
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(keyCode){
        console.log(keyCode);
        if(keyCode != this.word.charAt(0)){
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
            document.getElementById('audioPlayer').play();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            document.getElementById("wordSound").play();
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
    /* ChatGPT prompt: nulli taimer kui mäng läbi saab*/
    endGame(){
        document.getElementById("endSound").play();
        console.log("MÃ¤ng lÃ¤bi");
        clearInterval(this.timerInterval);
        this.endTime = performance.now();
        $("#wordDiv").hide();
        //$(document).off(keypress);
        this.calculateAndShowScore();
    }

    calculateAndShowScore() {
        this.endTime = performance.now();
        const timeInSeconds = (this.endTime - this.startTime + this.bonus) / 1000;
        this.score = timeInSeconds;
    
        const wpm = (this.wordsInGame / timeInSeconds) * 60;
        this.wpm = wpm;
    
        $("#score").html(`Aeg: ${this.score.toFixed(2)} s<br>Kiirus: ${this.wpm.toFixed(1)} WPM`).show();
    
        this.saveResult();
        this.showSpeedImage();

        /* ChatGPT prompt: Kuva sõnum kasutaja tulemuse põhjal*/
        let message = "";

        if (this.wpm > 80) {
            message = "Milline kiirus!";
        } else if (this.wpm > 60) {
            message = "Päris hea!";
        } else if (this.wpm > 40) {
            message = "Täitsa okei sooritus";
        } else if (this.wpm > 25) {
            message = "Veits penskari vibe";
        } else {
            message = "MEGA aeglane";
        }

        
        $('#endPopup').html(message).fadeIn(300);

        /* ChatGPT prompt: Peida pop-up mõne hetke pärast*/
        setTimeout(() => {
            $('#endPopup').fadeOut(300);
        }, 2000);
    }
    
    
    /* ChatGPT prompt: Kuva kasutajel vastavalt trükkimiskiirusele pilti tulemuste osas*/
    showSpeedImage() {
        const wpm = this.wpm;
        const img = document.getElementById("speedImage");
    
        if (!img) {
            console.error("speedImage elementi ei leitud!");
            return;
        }
    
        if (wpm >= 70) {
            console.log("Pildi allikas enne:", img.src);
            img.src = "img/pro.jpg";
            console.log("Pildi allikas pärast:", img.src);
        } else if (wpm >= 50) {
            img.src = "img/fast.jpg";
        } else if (wpm >= 30) {
            img.src = "img/average.jpg";
        } else {
            img.src = "img/beginner.jpg";
        }
    
        img.style.display = "block";
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
        this.showResults(this.resultCount);

        const index = this.allResults.findIndex(r =>
            r.name === this.name && r.score === this.score && r.words === this.wordsInGame
        );
        
        if (index > -1 && index < 3) {
            document.getElementById("topResultSound").play();
        }
        
    }

    showResults(count) {
        $('#results').html(""); 
        
        $('#results').append(`
            <div class="result-header">
                <div>Nimi</div>
                <div>Aeg (sek)</div>
                <div>Sõnu</div>
            </div>
        `);
        
        for (let i = 0; i < count; i++) {
            let result = this.allResults[i];
            if (result && result.name && result.score && result.words) {
                const isFirst = i === 0;
                const isLast = i === count - 1;
                let rowClass = "result-row";
                if (isFirst) rowClass += " highlight first";
                if (isLast) rowClass += " highlight last";
    
                $('#results').append(`
                    <div class="${rowClass}">
                        <div>${result.name}</div>
                        <div>${parseFloat(result.score).toFixed(2)}</div>
                        <div>${result.words}</div>
                    </div>
                `);
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
}
// ChatGPT prompt: Soovin teha nii, et tulemused tuleksid välja nupule vajutades ja läheksid peitu x vajutades. 
// Peaksin kasutama tavalist modalit või sidebari.
const typer = new Typer(playerName, startingWordLength);

$(document).ready(function() {
    $('#showResultsButton').click(() => {
        $('#resultsModal').css('display', 'block');
    });

    $('#closeResults').click(() => {
        $('#resultsModal').css('display', 'none');
    });

    window.onclick = function(event) {
        if (event.target.id === 'resultsModal') {
            $('#resultsModal').css('display', 'none');
        }
    };
});


