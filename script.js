console.log("scripti fail õigesti ühendatud");

let playerName = prompt("Palun sisesta oma nimi");




class Typer {
    constructor(playerName){
        this.pname = playerName;
        this.wordsInGame = 3;
        this.startingWordLength = 3;
        this.words = [[]];
        this.word = "START";
        this.typeWords = [];
        this.startTime = 0;
        this.endTime = 0;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        this.bonus = 0;
        this.score = 0;
        this.resultCount = 5
        this.wordsPerMinute = 0
        this.averageWPM = 0

        this.loadFromFile();
        this.showResults(this.resultCount);
        this.calculateAverageWPM();
        this.changeModalBackground();
        this.modalControls();
    }

    playAudio(url){
        let audio = new Audio();
        audio.volume = 1
        audio.src = url
        audio.play()
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content
            this.allResults = content;
            console.log(content);
        });
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

            this.words[wordLength].push(data[i])
        }
        console.log(this.words);

        this.startTyper();
    }

    startTyper(){
        let urlParams = new URLSearchParams(window.location.search)
        if(urlParams.get("words")){
            this.wordsInGame = urlParams.get("words");
        }
        console.log(urlParams.get("words"))
        this.generateWords();
        this.startTime = performance.now();
        $(document).keypress((event) => {this.shortenWords(event.key)});
        $('#loadResults').click(() => {
            this.resultCount = this.resultCount + 5
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $('#loadResults').hide();
            }
            this.showResults(this.resultCount);
        });
        this.playAudio('audio/start.mp3')

    }

    generateWords(){
        for(let i = 0; i < this.wordsInGame; i++){
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.round(Math.random() * this.words[wordLength].length);
            //console.log(randomWord);
            this.typeWords[i] = this.words[wordLength][randomWord]
            //console.log(this.typeWords)
        }

        this.selectWord();
    }

    drawWord(){
        $("#wordDiv").html(this.word);

    }

    selectWord(){
        this.word = this.typeWords[this.typedCount];
        this.typedCount++
        this.drawWord();
        this.updateInfo();
    }

    updateInfo(){
        $('#info').html(this.typedCount + "/" + this.wordsInGame)
    }

    shortenWords(keyCode){
        console.log(keyCode);
        if(keyCode != this.word.charAt(0)){
            this.changeBackground('wrong-button', 100);
            this.bonus = 0;
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-word', 500);
            this.selectWord();
            this.bonus = this.bonus - 30;
        }
        else if(this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus - 30;
        }
        this.playAudio('audio/typed.wav')
        this.drawWord();
    }

    changeBackground(color, time){
        setTimeout(function(){
            $('#container').removeClass(color);
        }, time);
        $('#container').addClass(color);
    }

    calculateWPM(){
        let time = (this.endTime - this.startTime + this.bonus) / 1000;
        if(time <= 0){
            time = 1;
        }

        this.wordsPerMinute = parseInt(((this.wordsInGame * 60) / time))
    }

    calculateAverageWPM(){
        let average = 0
        for(let i = 0; i < this.allResults.length; i++){
            average += parseInt(this.allResults[i].wordsPerMinute)
        }
        this.averageWPM = average / this.allResults.length
        console.log(this.averageWPM);    
    }

    changeModalBackground(){
        if(this.averageWPM < 40){
            $('.modal-content').css('background-image', 'url(pictures/slow.jpg)');
        }
        else if (this.averageWPM >= 40 && this.averageWPM < 60){
            $('.modal-content').css('background-image', 'url(pictures/average.jpg)');
        }
        else if (this.averageWPM >= 60 && this.averageWPM < 80){
            $('.modal-content').css('background-image', 'url(pictures/fast.jpg)');
        }
        else if (this.averageWPM >= 80){
            $('.modal-content').css('background-image', 'url(pictures/fastest.jpg)');
        }
    }

    endGame(){
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
        this.playAudio('audio/end.mp3')
    }

    calculateAndShowScore(){
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        this.calculateWPM();
        $("#score").html("Aeg: " + this.score + " Kiirus: " + this.wordsPerMinute + " WPM").show();
        this.changeModalBackground();
        this.saveResult();
    }
    
    saveResult(){
        let result = {
             name: this.pname,
             score: this.score,
             words: this.wordsInGame,
             wordsPerMinute: this.wordsPerMinute
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showResults(this.resultCount);
        this.playAudio('audio/saved.wav')
    }

    saveToFile(){
        $.post('server.php', {save: this.allResults}).done(
            function(){
                console.log("Salvestatud");
            }
        )
    }

    showResults(count){
        $('#results-name').html("");
        $('#results-time').html("");
        $('#results-words').html("");
        $('#results-wpm').html("");
        for(let i = 0; i < this.resultCount; i++){
            $('#results-name').append("<div>" + this.allResults[i].name + "</div>")
            $('#results-time').append("<div>" + this.allResults[i].score + "</div>")
            $('#results-words').append("<div>" + this.allResults[i].words + "</div>")
            $('#results-wpm').append("<div>" + this.allResults[i].wordsPerMinute + "</div>")
        }
    }

    modalControls(){
        let modal = document.querySelector("#resultsModal");

        let btn = document.querySelector("#resultsBtn");

        let span = document.querySelector(".close");

        btn.addEventListener('click', () => {
            modal.style.display = "block";

        })

        span.addEventListener('click', () => {
            modal.style.display = "none";
        });

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

    }
}

let typer = new Typer(playerName);