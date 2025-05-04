// 9. Kolm featuret omaltpoolt on: 1. helinupp, saab vastavalt valida kas soovid mängu mängida heliga või ei. 
// 2.-ks saab edetabelis vaadata sõnade arvu alusel tulemusi. 3. Mängu alguses on võimalik valida mitut sõna soovid mängus.


console.log("scripti fail õigesti ühendatud")

let playerName = "";
let typer = null;

$(".wordCountBtn").click(function () {
    
    //Küsi kasutaja nime
    let wordCount = parseInt($(this).data("count"));
    playerName = prompt("Palun sisesta oma nimi");

    if (!playerName) return;
    

    // Alusta mängu
    $("#startScreen").hide();
    $("#container").show();
    $("#backToStart").show();
    

    typer = new Typer(playerName, wordCount);
    // 8. Mängi heli kohe, kui kasutaja vajutab "ok" nuppu. 
    // lingid: https://www.w3schools.com/TAGs/tag_audio.asp ja https://www.w3schools.com/jsref/met_audio_play.asp
    const startSound = document.getElementById("startSound");
    startSound.currentTime = 0;
    startSound.play().catch((e) => {
        console.warn("Heli ei mänginud:", e);
    });


    $("#resultsContainer").addClass("compact");
});

 
//Uuendusena (iseseisev täiendus): võimaldan kasutajal "Vaata tulemusi" nuppu vajutada ka enne mängu alustamist.
// Kui mängu pole veel mängitud, siis kuvatakse ajutine Typer objekt, mis ei salvesta tulemusi. 
$(document).ready(function () {
    // ... olemasolev kood

    $(".tableToggleBtn").click(function () {
        const target = $(this).data("target");

        // Peida kõik tabelid
        $("#results3, #results5, #results10").hide();
        $("#results h3").hide();

        // Näita valitud tabelit ja pealkirja
        $("#" + target).show();
        $("#" + target).prev("h3").show();
    });

    let soundEnabled = true;

    // 9. Uus feature Helinupp: on/off heli mängus. Kui heli on off, siis ühtegi heli ei tule. Päring: Loo mulle nupp, millega saab heli sisse ja välja lülitada.
$("#toggleSoundBtn").click(function () {
    soundEnabled = !soundEnabled;

    $("audio").each(function () {
        this.muted = !soundEnabled;
    });

    // Uuenda teksti ja ikooni vastavalt olekule
    $(this).text(soundEnabled ? "🔉" : "🔇");
});
    
    
    $('#loadResults').click(function () {
        $('#resultsModal').css('display', 'block');
    
        // Kui mängu pole veel mängitud, loo ajutine Typer objekt
        if (!typer) {
            const dummy = new Typer("Külaline", 3); // mängija nimeks ajutine
            dummy.showResults();
        } else {
            typer.showResults();
        }
    });
    
    
    // 2. Kui vajutatakse modali aknas "X" nuppu, suletakse modal, võetud ülesande lingilt
    $('#closeResults').click(function () {
        $('#resultsModal').css('display', 'none');
    });
    // Nupp: Tagasi algusesse – näitab uuesti stardi ekraani ja peidab teised osad. 
    // Päring: Loo mulle nupp, millega saab tagasi algusesse, et mängu uuesti läbida
    $('#backToStart').click(function () {
        $("#resultsContainer").removeClass("compact");
        location.reload(); // Lihtne viis: lae leht uuesti, et naasta algusesse
    });

});

class Typer {
    constructor(name, wordCount) {
        this.name = name;
        this.wordsInGame = wordCount; // 9.Üks feature: Lisasin siia wordCount, et mängija saab alguses valida, mitu sõna ta soovib, et mängus oleks
        this.startingWordLength = 3;  // Päring: Loo mängu alguses võimalus valida, mitu sõna tuleb mängus.
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
        this.resultCount = 200;

        this.loadFromFile();
    }

    loadFromFile() {
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            console.log(content);
        });
    }

    getWords(data) {
        const dataFromFile = data.split("\n");
        this.separateWordsByLength(dataFromFile);
    }

    separateWordsByLength(data) {
        for (let i = 0; i < data.length; i++) {
            const wordLength = data[i].length;
            if (this.words[wordLength] === undefined) {
                this.words[wordLength] = [];
            }
            this.words[wordLength].push(data[i]);
        }
        this.startTyper();
    }

    startTyper() { //4. Päringu tulemusel saadud muudatus kuni 2. punktini.
        $("#score").hide();
        $("#feedbackBox").html("");

        this.generateWords();
        this.startTime = performance.now();

        $(document).off("keypress").on("keypress", (event) => {
            this.shortenWords(event.key);
        });

        //2. Kui vajutatakse "Laadi tulemusi" nuppu, avatakse modal-aken. Võetud ülesande lingilt
        $('#loadResults').click(() => {
            $('#resultsModal').css('display', 'block');
            this.resultCount = Math.min(this.resultCount, this.allResults.length); // lisatud juurde 4. punktis
            this.showResults(this.resultCount);         // Kuva tulemused modalisse
        });

        //2. Kui vajutatakse modali aknas "X" nuppu, suletakse modal
        $('#closeResults').click(() => {
            $('#resultsModal').css('display', 'none');
        });

        this.showResults(this.resultCount);
    }

    generateWords() {
        for (let i = 0; i < this.wordsInGame; i++) {
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.floor(Math.random() * this.words[wordLength].length);
            this.typeWords[i] = this.words[wordLength][randomWord];
        }
        this.selectWord();
    }

    drawWord() {
        $("#wordDiv").html(this.word);
    }

    selectWord() {
        this.word = this.typeWords[this.typedCount];
        this.typedCount++;
        this.drawWord();
        this.updateInfo();
    }

    updateInfo() {
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(key) {
        if (key !== this.word.charAt(0)) {
            this.changeBackground('wrong-button', 100);
            //8. Heli mängib kui vajutad vale klahvi. Lingid: https://www.w3schools.com/TAGs/tag_audio.asp ja https://www.w3schools.com/jsref/met_audio_play.asp
            const wrongSound = document.getElementById("wrongSound");
            wrongSound.currentTime = 0; // 
            wrongSound.play().catch(() => {});
            this.bonus = 0;
        } else if (this.word.length === 1 && key === this.word.charAt(0) && this.typedCount === this.wordsInGame) {
            this.endGame();
        } else if (this.word.length === 1 && key === this.word.charAt(0)) {
            this.changeBackground('right-word', 400);
            //8. Heli mängib kui sisestad sõna õigesti. Lingid: https://www.w3schools.com/TAGs/tag_audio.asp ja https://www.w3schools.com/jsref/met_audio_play.asp
            const correctSound = document.getElementById("correctSound");
            correctSound.currentTime = 0;
            correctSound.play().catch(() => {});
            this.selectWord();
            this.bonus -= this.bonusKoef;
        } else if (this.word.length > 0 && key === this.word.charAt(0)) {
            this.changeBackground('right-button', 100);
            this.word = this.word.slice(1);
            this.bonus -= this.bonusKoef;
        }

        this.drawWord();
    }

    changeBackground(colorClass, time) {
        setTimeout(() => {
            $('#container').removeClass(colorClass);
        }, time);
        $('#container').addClass(colorClass);
    }

    endGame() {
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
        //8. Heli mängib kui mäng saab läbi. Lingid: https://www.w3schools.com/TAGs/tag_audio.asp ja https://www.w3schools.com/jsref/met_audio_play.asp
        const endSound = document.getElementById("endSound");
        endSound.currentTime = 0;
        endSound.play().catch(() => {});
    }

    calculateAndShowScore() {
        this.score = ((this.endTime - this.startTime + this.bonus) / 1000).toFixed(2);
        $("#score").html(this.score).show(); //Kuvatakse ainult skoor (ilma tekstita)
        this.saveResult();
        this.showFeedbackImage(); // Lisatud 4. punkti juures
    }

    saveResult() {
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame
        };
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showResults(this.resultCount);
    }

    //3. Kuva tulemused paremini välja, kui praegu. 
    // Praegu lihtsalt tühikutega eraldatud tulemused, aga paiguta need eraldi elementidesse ja kujunda selgemalt. 
    // Lisa ka pealkirjad igale osale, et saaks aru, mis osaga on tegemist (nimi, kiirus jne).
    // Lasin ChatGPT selle valmis kirjutada päringuga: "Loo mulle modali tabeli kujul tulemused, kus on pealkirjadeks "nimi", "aeg (s) ja sõnade arv"
    showResults() {
        $("#results3, #results5, #results10").html("");
    
        const header = `
            <div class="result-row result-header">
                <div class="result-cell">Nimi</div>
                <div class="result-cell">Aeg(s)</div>
                <div class="result-cell">Sõnade arv</div>
            </div>
        `;
        //9. feature: Kasutajal on võimalus vaadata tulemusi eraldi 3, 5 ja 10 sõna kohta. Päring: Loo mulle nupud, millega saab vaadata edetabelis eraldi 3, 5 ja 10 sõna tulemusi.
        $("#results3").append(header);
        $("#results5").append(header);
        $("#results10").append(header);
    
        const groupMap = { 3: [], 5: [], 10: [] };
    
        // Sorteeri tulemused gruppidesse
        for (const r of this.allResults) {
            if (groupMap[r.words]) groupMap[r.words].push(r);
        }
    
        // Käi iga rühma kohta eraldi läbi ja lisa HTML
        [3, 5, 10].forEach(wordCount => {
            const group = groupMap[wordCount];
            const containerId = "#results" + wordCount;
    
            for (let i = 0; i < group.length; i++) {
                const r = group[i];
                let rowClass = "";
                if (i === 0) rowClass = "first-place";
                else if (i === 1) rowClass = "second-place";
                else if (i === 2) rowClass = "third-place";
    
                $(containerId).append(`
                    <div class="result-row ${rowClass}">
                        <div class="result-cell">${r.name}</div>
                        <div class="result-cell">${r.score}</div>
                        <div class="result-cell">${r.words}</div>
                    </div>
                `);
            }
        });
    }
    
    
    //4. ülesande päringu tulemusel. Lisasin päringule hiljem juurde, et saaksin pilte kuvada vastavalt, kas
    // on beginner, intermediate või expert. Tulemuseks Juurde lisatud osa kuni saveToFile().
    showFeedbackImage() {
        let totalChars = this.typeWords.join('').length;
        let seconds = (this.endTime - this.startTime) / 1000;

        let cpm = Math.round((totalChars / seconds) * 60); //palju tähemärke minutis kirjutaks selle kiirusega
        let wpm = Math.round(cpm / 5); // palju sõnu minutis kirjutaks selle kiirusega

        let imagePath = "";
        let levelText = "";

        //4. Lisaks pildile juurde lisatud ka wpm(words per minute) ja cpm (characters per minute) tulemused, et saaks aru, mis tasemel on mängija. (ehk siis uus feature)
        //Päring: Loo mulle arvutused, mis arvutavad sõnade ja tähemärkide arvu minutis.
        if (wpm < 15) {
            imagePath = "images/beginner.png";
            levelText = "Algaja";
        } else if (wpm < 35) {
            imagePath = "images/intermediate.png";
            levelText = "Edasijõudnu";
        } else {
            imagePath = "images/expert.png";
            levelText = "Ekspert";
        }
        //4. Ülesande tagasiside sisu, mis tuli päringuga
        $("#feedbackBox").html(`
            <p>
                Kirjutamise tase: <strong>${levelText}</strong><br>
                Tähemärke minutis: <strong>${cpm}</strong><br>
                Sõnu minutis: <strong>${wpm}</strong>
            </p>
            <img src="${imagePath}" alt="${levelText}">
        `);
    }
    
    saveToFile() {
        $.post('server.php', { save: this.allResults }).fail(() => {
            console.log("Fail");
        });
    }
}


// let typer = new Typer(playerName); eemaldatud punktis 4.
