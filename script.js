console.log("scripti fail õigesti ühendatud")

// Ei küsi kohe nime, laseme kasutajal alustada nupust
let playerName = "";

// Helide sätted
const gameAudio = {
    start: new Audio('sounds/game_start.mp3'),   // Mängu alguses
    keypress: new Audio('sounds/key_press.mp3'), // Mängu jooksul klahvivajutuste jaoks
    complete: new Audio('sounds/game_complete.mp3'), // Mängu lõpus
    highscore: new Audio('sounds/highscore.mp3')    // Edetabelisse jõudmisel
};

class Typer{
    constructor(){
        this.name = "";
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
        this.gameActive = false;
        this.timerInterval = null;
        this.speedRanges = [
            { max: 2, image: "images/speed1.jpg", text: "Eksperdiklass - Välgukiirus!" },
            { max: 3, image: "images/speed2.jpg", text: "Professionaal - Väga kiire!" },
            { max: 4, image: "images/speed3.jpg", text: "Edasijõudnu - Tubli töö!" },
            { max: 5, image: "images/speed4.jpg", text: "Keskmine - Arenev!" },
            { max: 1000, image: "images/speed5.jpg", text: "Algaja - Harjuta veel!" }
        ];
        this.topScoreThreshold = 10; // Edetabeli esimesed 10 kohta

        this.loadFromFile();
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
        
        // Ei genereeri sõnu kohe, ainult kuulame start nupu vajutust
        $('#startButton').click(() => {
            playerName = prompt("Palun sisesta oma nimi");
            if (!playerName || playerName.trim() === "") {
                playerName = "Tundmatu mängija";
            }
            this.name = playerName;
            
            this.startGame();
        });
        
        // Lisame modaali avamise ja sulgemise funktsionaalsuse
        this.setupModal();
        this.showResults(this.resultCount);
        
        // Peidame alguses wordDiv ja näitame start nuppu
        $("#wordDiv").hide();
        $("#showResultsButton").show();
        
        // Lisame laadimise nupu funktsionaalsuse
        $('#loadResults').click(() => {
            this.resultCount = this.resultCount + 50;
            console.log(this.allResults.length, this.resultCount)
            if(this.resultCount >= this.allResults.length){
                this.resultCount = this.allResults.length;
                $("#loadResults").hide();
            }
            this.showResults(this.resultCount);
        });
        
        // Lisame document-level sündmuse kuulari modaali sulgemiseks
        $(document).on("click", ".close-btn", () => {
            $("#resultsModal").hide();
            this.showPlayAgainPrompt();
        });
        
        // Lisame document-level sündmuse väljapoole modaali vajutamiseks
        $(window).on("click", (event) => {
            if (event.target.id === "resultsModal") {
                $("#resultsModal").hide();
                this.showPlayAgainPrompt();
            }
        });
    }
    
    // Uus meetod mängi uuesti kasti näitamiseks
    showPlayAgainPrompt() {
        // Eemaldame olemasoleva prompti, kui see juba eksisteerib
        $("#playAgainPrompt").remove();
        
        // Loome uue prompti kasti
        const playAgainPrompt = `
            <div id="playAgainPrompt" class="play-again-prompt">
                <div class="prompt-content">
                    <button id="playAgainBtn">Mängi uuesti</button>
                </div>
            </div>
        `;
        
        // Lisame prompti DOM-i ja näitame seda
        $("body").append(playAgainPrompt);
        
        // Mängime heli (sama mis klahvivajutusel)
        gameAudio.keypress.play();
        
        // Lisame click handleri mängi uuesti nupule
        $("#playAgainBtn").click(() => {
            location.reload();
        });
    }
    
    // Uus meetod nuppude näitamiseks
    showGameButtons() {
        if (!this.gameActive) {
            $("#startButton").show();
            $("#showResultsButton").show();
        }
    }
    
    startGame() {
        // Peidame start nupu ja näitame wordDiv
        $("#startButton").hide();
        $("#showResultsButton").hide();
        $("#wordDiv").show();
        $("#fireworks-container").empty();
        
        // Mängime alguse heli
        gameAudio.start.play();
        
        this.gameActive = true;
        $('body').addClass('game-active');
        
        this.generateWords();
        this.startTime = performance.now();
        
        // Alustame taimeri
        this.updateTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
        
        $(document).keypress((event) => {
            if (this.gameActive) {
                this.shortenWords(event.key);
            }
        });
    }
    
    updateTimer() {
        const currentTime = performance.now();
        const elapsedTime = ((currentTime - this.startTime) / 1000).toFixed(2);
        $("#timer").text(elapsedTime + "s");
    }
    
    setupModal() {
        const modal = $("#resultsModal");
        const openBtn = $("#openModal");

        openBtn.on("click", () => {
            this.showAllResults();
            modal.show();
        });

        // Märkus: close-btn kuulari on nüüd document-level startTyper() funktsioonis
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
            // Mängime lõpu heli
            gameAudio.complete.play();
        } else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-word', 400);
            this.selectWord();
            this.bonus = this.bonus - this.bonusKoef;
            // Mängime klahvivajutuse heli
            gameAudio.keypress.play();
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus = this.bonus - this.bonusKoef;
            // Mängime klahvivajutuse heli
            gameAudio.keypress.play();
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
        
        // Peatame taimeri
        clearInterval(this.timerInterval);
        this.gameActive = false;
        $('body').removeClass('game-active');
        
        const fireworks = new Fireworks();
        fireworks.launch();

        //$(document).off(keypress);
        this.calculateAndShowScore();
    }

    calculateAndShowScore(){
        console.log(this.bonus, this.endTime, this.startTime)
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        
        // Kontrollime, kas tulemus jõuab edetabelisse (TOP 10)
        const isHighScore = this.checkIfHighScore();
        
        this.saveResult();
        
        // Kui tegemist on TOP tulemusega, mängime highscore heli
        if (isHighScore) {
            gameAudio.highscore.play();
        }
        
        // Näitame tulemuse modaali
        this.showEndGameModal(isHighScore);
        
        // Näitame uuesti alusta nuppu (seda teeme nüüd modaali sulgemise event kuularis)
    }
    
    // Kontrollime, kas tulemus jõuab edetabelisse
    checkIfHighScore() {
        // Kui tulemusi on vähem kui threshold, siis igal juhul on edetabelis
        if (this.allResults.length < this.topScoreThreshold) {
            return true;
        }
        
        // Loome ajutise massiivi koos uue tulemusega
        const tempResults = [...this.allResults, {
            name: this.name,
            score: this.score,
            words: this.wordsInGame
        }];
        
        // Sorteerime tulemused
        tempResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        
        // Otsime oma positsiooni
        const position = tempResults.findIndex(result => 
            result.name === this.name && 
            result.score === this.score && 
            result.words === this.wordsInGame
        );
        
        // Kui positsioon on väiksem kui threshold, siis tulemus jõuab edetabelisse
        return position < this.topScoreThreshold;
    }
    
    getSpeedImage(score) {
        for (let range of this.speedRanges) {
            if (parseFloat(score) <= range.max) {
                return { image: range.image, text: range.text };
            }
        }
        return this.speedRanges[this.speedRanges.length - 1];
    }
    
    getRandomMotivationalMessage() {
        const messages = [
            "Harjutamine teeb meistriks!",
            "Väike võit on suur samm edasi!",
            "Kiirus tuleb tööga – jätka samas vaimus!",
            "Tublilt tehtud! Proovi järgmine kord veel paremini!",
            "Sa oled teel tippu!",
            "Iga tähega said tugevamaks.",
            "Väike pingutus – suur areng.",
            "Sõrmed suitsesid, tubli töö!",
            "Ei ole halba tulemust – on vaid järgmine tase!",
            "Täna kiirem kui eile – super!"
        ];
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    }

    showEndGameModal(isHighScore) {
        // Eemaldame olemasoleva modaali, kui see on juba DOM-is
        $("#endGameModal").remove();
        
        const speedResult = this.getSpeedImage(this.score);
        
        // Loome modaali tulemuse kuvamiseks
        const endGameModal = `
            <div id="endGameModal" class="modal">
                <div class="modal-content">
                    <span class="close-end-game">&times;</span>
                    <h2>Mäng läbi!</h2>
                    <div class="end-result">
                        <p><strong>Nimi:</strong> ${this.name}</p>
                        <p><strong>Tulemus:</strong> ${this.score} sekundit</p>
                        <p><strong>Sõnu:</strong> ${this.wordsInGame}</p>
                        <p class="motivational-message">${this.getRandomMotivationalMessage()}</p>
                        ${isHighScore ? '<p class="high-score-message">Õnnitleme! Sinu tulemus jõudis edetabelisse!</p>' : ''}
                        <div class="speed-image">
                            <img src="${speedResult.image}" alt="Kiiruse hinnang">
                            <p>${speedResult.text}</p>
                        </div>
                    </div>
                    <button id="playAgain" class="btn">Mängi uuesti</button>
                    <button id="viewAllResults" class="btn">Vaata kõiki tulemusi</button>
                </div>
            </div>
        `;
        
        // Lisame modaali DOM-i ja näitame seda
        $("body").append(endGameModal);
        $("#endGameModal").show();
        
        // Lisame document-level sündmuse kuulari modaali sulgemiseks
        $(document).off("click", ".close-end-game").on("click", ".close-end-game", () => {
            $("#endGameModal").remove();
            this.showGameButtons();
        });
        
        // Lisame document-level sündmuste kuularid nuppudele
        $(document).off("click", "#playAgain").on("click", "#playAgain", () => {
            location.reload();
        });
        
        $(document).off("click", "#viewAllResults").on("click", "#viewAllResults", () => {
            $("#endGameModal").remove();
            $("#resultsModal").show();
            this.showAllResults();
        });
       
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

    showResults(count) {
        $('#results').html("");
        const showCount = Math.min(count, this.allResults.length);
        
        for(let i = 0; i < showCount; i++){
            const speedResult = this.getSpeedImage(this.allResults[i].score);
            $('#results').append(`
                <div class="result-item ${i < 3 ? 'top-result' : ''}">
                    <div class="result-header">
                        <span class="result-position">#${i+1}</span>
                        <span class="result-name">${this.allResults[i].name}</span>
                    </div>
                    <div class="result-details">
                        <div class="result-stat">
                            <span class="stat-label">Aeg:</span>
                            <span class="stat-value">${this.allResults[i].score} s</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-label">Sõnu:</span>
                            <span class="stat-value">${this.allResults[i].words}</span>
                        </div>
                    </div>
                    <div class="result-speed-image">
                        <img src="${speedResult.image}" alt="Kiiruse hinnang" class="speed-badge">
                    </div>
                </div>
            `);
        }
    }

    showAllResults(){
        $('#modal-results').html("");
        
        // Lisame tulemuste tabelipäise
        $('#modal-results').append(`
            <div class="results-header">
                <div class="header-position">#</div>
                <div class="header-name">Nimi</div>
                <div class="header-score">Aeg (s)</div>
                <div class="header-words">Sõnu</div>
                <div class="header-speed">Kiirus</div>
            </div>
        `);

        for(let i = 0; i < this.allResults.length; i++){
            const speedResult = this.getSpeedImage(this.allResults[i].score);
            $('#modal-results').append(`
                <div class="results-row ${i < 3 ? 'top-result' : ''}">
                    <div class="result-position">${i+1}</div>
                    <div class="result-name">${this.allResults[i].name}</div>
                    <div class="result-score">${this.allResults[i].score}</div>
                    <div class="result-words">${this.allResults[i].words}</div>
                    <div class="result-speed">
                        <img src="${speedResult.image}" alt="Kiiruse hinnang" class="speed-icon" title="${speedResult.text}">
                    </div>
                </div>
            `);
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


