console.log("scripti fail õigesti ühendatud")

//TODO: Lisa Levelid
//TODO: Lisa levelid mis muudavad fonti
//TODO:Lisa tulemuste rankimine
//TODO: saad osta ui elemente raha eest

let playerName = prompt("Palun sisesta oma nimi");

class Typer{
    constructor(pname){
        this.name = pname;
        this.wordsInGame = 3;
        this.startingWordLength = 3;
        this.words = [];
        this.word = "START";
        this.typeWords = [];
        this.startTime = null;
        this.endTime = null;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        //score
        this.score = 0;
        this.bonus = 0;
        this.letterCount = 0;
        this.charactersPerMinute = 0;
        this.currentTime = null;
        this.styleRank = "D";
        //music player
        this.currentTrack = 0;
        //leveldamine
        this.currentLevel = 1;
        this.levelsInGame = 3;


        this.loadFromFile();
        this.showAllResults();
        this.resultsModal();
        this.calculateCPM();
        this.restartGame();
        this.musicPlayer();

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
        let words = new URLSearchParams(window.location.search);
        if(words.get("words")){
            this.wordsInGame = words.get("words");
        }
        console.log(words.get("words"));
        this.generateWords();


        $(document).keypress((event) => {

            if (this.startTime === null) {
                // Start the timer on the first keypress
                this.startTime = performance.now();
                console.log(this.startTime);
                this.playAudio("start");
            }
            this.shortenWords(event.key);
            $('#level').html("Level: " + this.currentLevel);
        });
    }

    generateWords(){
        for(let i = 0; i <this.wordsInGame; i++){
            const wordLength = this.startingWordLength + i + this.currentLevel;
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
            this.changeBackground('wrong-button', 100)
            this.playAudio("error");
            //mäng läbi
        } else if(
            this.word.length == 1 && 
            keyCode == this.word.charAt(0) && 
            this.typedCount == this.wordsInGame &&
            this.currentLevel == this.levelsInGame)
            {
            this.letterCount ++;
            this.currentTime = performance.now();
            this.calculateCPM();
            this.endGame();
            this.playAudio(this.styleRank);
            $('#level').html("Finish!")

            //level läbi
        } else if(
            this.word.length == 1 && 
            keyCode == this.word.charAt(0) && 
            this.typedCount == this.wordsInGame &&
            this.currentLevel < this.levelsInGame)
            {
            this.typedCount = 0;
            this.letterCount ++;
            this.currentTime = performance.now();
            this.calculateCPM();
            this.changeBackground('right-word', 400);
            this.generateWords();
            this.selectWord();
            this.bonus = this.bonus -100;
            this.currentLevel ++;
            $('#level').html("Level: " + this.currentLevel);
            
            //sõna läbi
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0))
            {
            this.letterCount ++;
            this.currentTime = performance.now();
            this.calculateCPM();
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus -100;

        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.letterCount ++;
            this.currentTime = performance.now();
            this.calculateCPM();
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus -100;
        }

        this.drawWord();
    }

    calculateCPM(){
        if(this.startTime === null){
            $('#speedRating').html("Siia tuleb kiiruse reiting!");
        } else if (this.endTime === null){
            let timeInMinutes = (this.currentTime - this.startTime) / 60000; 
            this.charactersPerMinute = Math.round(this.letterCount / timeInMinutes);
        }else{
            let timeInMinutes = (this.endTime - this.startTime) / 60000;
            this.charactersPerMinute = Math.round(this.letterCount / timeInMinutes);
        }
        $('#speedRating').html(this.charactersPerMinute);
        this.styleRating();
    }

    styleRating(){
        if(this.charactersPerMinute < 200)
            {$('#styleRating').html('<img src="./img/D.png" alt="D">')
            this.styleRank = "D";
            }
        else if(this.charactersPerMinute < 250)
            {$('#styleRating').html('<img src="./img/C.png" alt="C">')
            this.styleRank = "C"
            }
        else if(this.charactersPerMinute < 300)
            {$('#styleRating').html('<img src="./img/B.png" alt="B">')
                this.styleRank = "B";
            }
        else if(this.charactersPerMinute < 350)
            {$('#styleRating').html('<img src="./img/A.png" alt="A">')
                this.styleRank = "A";
            }
        else if(this.charactersPerMinute < 370)
            {$('#styleRating').html('<img src="./img/S.png" alt="S">')
                this.styleRank = "S";
            }
        else if(this.charactersPerMinute < 390)
            {$('#styleRating').html('<img src="./img/SS.png" alt="SS">')
                this.styleRank = "SS";
            }
        else if(this.charactersPerMinute < 420)
            {$('#styleRating').html('<img src="./img/SSS.png" alt="SSS">')
                this.styleRank = "SSS";
            }
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

    restartGame() {
        $("#restartButton").on("click", () => {
            console.log("Game Restarted!");

            this.wordsInGame = 3;
            this.startingWordLength = 3;
            this.typeWords = [];
            this.word = "START";
            this.startTime = null;
            this.endTime = null;
            this.typedCount = 0;
            this.score = 0;
            this.bonus = 0;
            this.letterCount = 0;
            this.charactersPerMinute = 0;
            this.currentTime = null;
            this.styleRank = "D";
            this.currentLevel = 1;
            $('#level').html("Level: 1");
    
            $("#wordDiv").show();
            $("#score").hide();
    
            // You may also want to remove the keypress handler and re-add it
            $(document).off("keypress"); // remove old handler
            this.startTyper();          
        });
    }
    

    calculateAndShowScore(){
        console.log(this.bonus);
        this.score = ((this.endTime - this.startTime - this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.saveResult();
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score,
            cpm: this.charactersPerMinute,
            style: this.styleRank
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        console.log(this.allResults);
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showAllResults();
    }

    showAllResults() {
            $('#results').html("");
            $('#results').append("<table id='resultsTable'><thead><tr><th>Positsioon</th><th>Nimi</th><th>Tulemus</th></tr></thead><tbody></tbody></table>");
            this.allResults.sort((a, b) => a.score - b.score);
            for (let i = 0; i < this.allResults.length; i++) {
                $('#resultsTable tbody').append("<tr><td>" + (i + 1) + 
                "</td><td>" + this.allResults[i].name + 
                "</td><td>" + this.allResults[i].score + 
                "</td><td>" + this.allResults[i].cpm + 
                "</td><td>" + this.allResults[i].style + 
                "</td></tr>");
            }
        }

    saveToFile(){
        $.post('server.php', {save: this.allResults}).fail(
            function(){
                console.log("Fail");
            }
        )
    }
    //modal
    //Kood võetud https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal
    resultsModal(){
        var modal = document.getElementById("myModal");

        // Get the button that opens the modal
        var btn = document.getElementById("modalButton");

        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];
        var self  = this;


        // When the user clicks the button, open the modal 
        btn.onclick = function() {
            modal.style.display = "block";
            console.log("Modal Avatud")
            self.playAudio("results");
            btn.style.display = "none";
        }

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
            btn.style.display = "block";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
                btn.style.display = "block";
            }
        }
    }

    playAudio(sound){
        var file = "./audio/" + sound + ".mp3";
        console.log(file);
        var audio = new Audio(file);
        audio.play();
    }

    //isekirjutatud koodi parandas suuresti chatgpt.
    musicPlayer(){
        this.tracks = [
            { name: "Evanescence - Bring Me To Life", file: "./music/track1.mp3" },
            { name: "Linkin Park - Numb", file: "./music/track2.mp3" },
            { name: "Rob Zombie - Stairway To Heaven", file: "./music/track3.mp3" }
        ];
    
        this.currentTrack = this.currentTrack || 0;
        this.audio = new Audio(this.tracks[this.currentTrack].file);
        $('#trackName').html(this.tracks[this.currentTrack].name);
    
        $("#playButton").on("click", () => {
            if (this.audio.paused) {
                this.audio.play();
                $("#playButton").html("II Pause");
                console.log("Playing" + track.name)
              } else {
                this.audio.pause();
                $("#playButton").html("> Play");
              }
        });
        $("#skipButton").on("click", ()=> {
            this.audio.pause(); // Stop current track
            this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
            this.audio = new Audio(this.tracks[this.currentTrack].file);
            $('#trackName').html(this.tracks[this.currentTrack].name);
            this.audio.play();
            $("#playButton").html("II Pause");
            console.log("Playing: " + this.tracks[this.currentTrack].name);
        });

        
    }
}

let typer = new Typer(playerName);