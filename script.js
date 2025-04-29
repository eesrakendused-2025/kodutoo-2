class Typer {
    constructor() {
        this.name = "Külaline";
        this.wordsInGame = 5;
        this.words = [];
        this.typeWords = [];
        this.startTime = 0;
        this.endTime = 0;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        
        this.init();
    }

    init() {
        this.loadWords();
        this.setupEventListeners();
        $("#showResults").click(() => $("#resultsModal").show());
        $(".close").click(() => $("#resultsModal").hide());
        $("#themeToggle").click(() => $("body").toggleClass("dark-theme"));
    }

    loadWords() {
        $.get("lemmad2013.txt", (data) => {
            this.words = data.split("\n").reduce((acc, word) => {
                const len = word.length;
                acc[len] = acc[len] || [];
                acc[len].push(word);
                return acc;
            }, {});
            this.showCountdown(() => this.startGame());
        });
    }

    showCountdown(onComplete) {
        $("#nextKey").hide();
        let count = 3;
        $("#countdown").text(count).fadeIn(100);
        
        const countdown = setInterval(() => {
            count--;
            if(count <= 0) {
                clearInterval(countdown);
                $("#countdown").fadeOut(100, () => {
                    document.getElementById("startSound").play();
                    onComplete();
                });
                return;
            }
            $("#countdown").text(count);
        }, 1000);
    }

    startGame() {
        this.typeWords = Array.from({length: this.wordsInGame}, (_, i) => {
            const len = 3 + i;
            return this.words[len][Math.floor(Math.random() * this.words[len].length)];
        });
        this.startTime = performance.now();
        this.typedCount = 0;
        this.updateProgress(0);
        $("#nextKey").show();
        this.selectWord();
    }

    selectWord() {
        if(this.typedCount >= this.wordsInGame) return this.endGame();
        this.word = this.typeWords[this.typedCount];
        $("#wordDiv").text(this.word);
        this.updateNextKeyDisplay();
        this.typedCount++;
    }
    
    updateNextKeyDisplay() {
        if(this.word && this.word.length > 0) {
            $("#nextKey").text(`Järgmine klahv: ${this.word[0]}`);
        } else {
            $("#nextKey").text("");
        }
    }

    handleKeypress(key) {
        if(!this.word) return;
        
        if(key !== this.word[0]) {
            $("#container").addClass("wrong-button");
            setTimeout(() => $("#container").removeClass("wrong-button"), 100);
            return;
        }

        document.getElementById("keySound").play();
        this.word = this.word.slice(1);
        $("#wordDiv").text(this.word);
        this.updateNextKeyDisplay();

        if(this.word.length === 0) {
            this.updateProgress((this.typedCount / this.wordsInGame) * 100);
            this.selectWord();
        }
    }

    endGame() {
        this.endTime = performance.now();
        const totalTime = ((this.endTime - this.startTime) / 1000).toFixed(2);
        
        const playerName = prompt("Palun sisesta oma nimi edetabelisse:") || "Külaline";
        this.name = playerName;

        $("#score").html(`⏱️ Aeg: ${totalTime}s`).show();
        document.getElementById("endSound").play();
        this.saveResult();
    }

    saveResult() {
        const result = {
            name: this.name,
            score: parseFloat(((this.endTime - this.startTime)/1000).toFixed(2)),
            words: this.wordsInGame
        };
        
        this.allResults.push(result);
        this.allResults.sort((a,b) => a.score - b.score);
        localStorage.setItem("typer", JSON.stringify(this.allResults));
        this.showResults();
        
        if(this.allResults[0]?.score === result.score) {
            document.getElementById("highscoreSound").play();
        }
    }

    showResults() {
        $("#results").empty();
        this.allResults.slice(0, 30).forEach((res, i) => {
            const icon = res.score <= 4.6 ? "🚀" : res.score <= 5.5 ? "🐆" : "🐢";
            $("#results").append(`
                <div class="result-item">
                    <span>${i+1}.</span>
                    <span>${res.name}</span>
                    <span>${res.score}s</span>
                    <span>${icon}</span>
                </div>
            `);
        });

        $("#results").scrollTop(0);
    }

    updateProgress(percent) {
        $("#progress").css("width", `${percent}%`);
    }

    setupEventListeners() {
        $(document).keypress((e) => this.handleKeypress(e.key));
        $("#restartButton").click(() => {
            this.showCountdown(() => this.startGame());
            $("#score").hide();
        });
    }
}

let typer;
$(document).ready(() => {
    typer = new Typer();
});

$(document).on("keypress", function(e) {
    if($("#countdown").is(":visible")) e.preventDefault();
});