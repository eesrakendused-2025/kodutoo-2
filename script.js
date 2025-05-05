console.log("scripti fail õigesti ühendatud")

let playerName = prompt("Palun sisesta oma nimi");

class Typer{
    constructor(pname){
        this.name = pname;
        this.wordsInGame = 3;
        this.startingWordLength = 3;
        this.maxWords = 10;
        this.words = [];
        this.word = "START";
        this.typeWords = [];
        this.startTime = 0;
        this.endTime = 0;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || []
        this.score = 0
        this.bonus = 0
        this.bonusKoef = 200
        this.resultCount=10
        this.lastCharacterTime = 0
        this.charactersPerMinute = 0
        

        this.loadFromFile();
        //this.showResults(this.resultCount)
    }

    loadFromFile(){
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        $.get("database.txt", (data)=> {
            let content = JSON.parse(data).content
            this.allResults=content
            console.log(content)})
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
            this.wordsInGame = urlParams.get("words")
        }
        // console.log(urlParams.get("words"))
        this.generateWords();
        this.startTime = performance.now();
        $(document).keypress((event) => {
            this.shortenWords(event.key)
            // https://stackoverflow.com/questions/25654558/html5-js-play-same-sound-multiple-times-at-the-same-time
            $('#keyboardClick')[0].cloneNode(true).play()
        });
        $('#loadResults').click(()=> {
            // this.resultCount += 5    
            // if(this.resultCount > this.allResults.length){
            //     this.resultCount=this.allResults.length
            //     $('#loadResults').hide()
            // }
            // this.showResults(this.resultCount)
            this.openModal()
        })
        $('#startGame')[0].play()
        this.activateMoreWords()
        this.activateRestart()
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
        this.updateInfo()
    }

    updateInfo(){
        $('#info').html(this.typedCount + "/" +this.wordsInGame)
    }

    shortenWords(keyCode){
        console.log(keyCode);


        if(keyCode != this.word.charAt(0)){
            this.changeBackground('wrong-button', 200)
            this.bonus=0
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame){
            this.endGame();
        }
        else if(this.word.length == 1 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-word', 500)
            this.selectWord();
            this.bonus -= this.bonusKoef
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)){
            this.changeBackground('right-button', 100)
            this.word = this.word.slice(1);
            this.bonus -= this.bonusKoef

        }

        this.typingSpeed()
        this.drawWord();
    }

    changeBackground(color, time){
        setTimeout(function(){
            $("#container").removeClass(color)
        }, time)
        $("#container").addClass(color)
    }

    endGame(){
        console.log("MÃ¤ng lÃ¤bi");
        this.endTime = performance.now();
        // $("#score").html(this.endTime - this.startTime).show();
        $("#wordDiv").hide();
        // $(document).off(keypress)
        // document.getElementById('audioplayer').play()
        this.calculateAndShowScore()
        $('#endGame')[0].play()
    }

    calculateAndShowScore(){
        console.log(this.bonus)
        this.score=((this.endTime - this.startTime - this.bonus)/1000).toFixed(2)
        $("#score").html(this.score).show()
        this.saveResult()
    }

    saveResult(){
        let result = {
            name: this.name,
            score: this.score,
            words: this.wordsInGame
        }
        this.allResults.push(result)
        this.allResults.sort((a, b) => parseFloat(a.score)-parseFloat(b.score))
        localStorage.setItem('typer', JSON.stringify(this.allResults))
        this.saveToFile()
        this.showResults(this.resultCount)
    }

    showResults(count){
        $('#results').html("")
        for(let i = 0; i<count; i++){
            $('#results').append("<div>" + this.allResults[i].name + " " + this.allResults[i].score + " ("+this.allResults[i].words+")" +"</div>")
        }
    }

    showAllResults(){
        $('#results').html("")
        for(let i = 0; i<this.allResults.length; i++){
            $('#results').append("<div>" + this.allResults[i].name + " " + this.allResults[i].score + " ("+this.allResults[i].words+")" +"</div>")
        }
    }

    saveToFile(){
        $.post("server.php", {save:this.allResults}).fail(
            function(){
                console.log("fail")
            }
        )
    }

    openModal(){
        $('#resultsModal').css("display", "block")
        $('#addedResults').html("")
        for(let i = 0; i<this.allResults.length; i++){
            $('#addedResults').append("<tr>"+
                "<td>"+this.allResults[i].name+"</td>"+
                "<td>"+this.allResults[i].score+"</td>"+
                "<td>"+this.allResults[i].words+"</td>"+
                "</tr>")
        }
        
        $('.close').click(()=>{
            $('#resultsModal').css("display", "none")
        })
        $('#modalSound')[0].play()
    }

    typingSpeed(){
        // console.log(performance.now())
        this.charactersPerMinute = 60/((performance.now()-this.lastCharacterTime)/1000)
        this.lastCharacterTime = performance.now()
        if(this.charactersPerMinute>=200){
            $('#averageSpeed').css('visibility', 'visible')
            setTimeout(function(){
                $('#averageSpeed').css('visibility', 'hidden')
                console.log("hidden")
            },1000)  
        }
        if(this.charactersPerMinute>250){
            $('#aboveAverageSpeed').css('visibility', 'visible')
            setTimeout(function(){
                $('#aboveAverageSpeed').css('visibility', 'hidden')
                console.log("hidden")
            },1000)  
        }
        if(this.charactersPerMinute>300){
            $('#productiveSpeed').css('visibility', 'visible')
            setTimeout(function(){
                $('#productiveSpeed').css('visibility', 'hidden')
                console.log("hidden")
            },1000)  
        }
        if(this.charactersPerMinute>350){
            $('#highSpeed').css('visibility', 'visible')
            setTimeout(function(){
                $('#highSpeed').css('visibility', 'hidden')
                console.log("hidden")
            },1000)  
        }
        if(this.charactersPerMinute>=600){
            $('#competitiveSpeed').css('visibility', 'visible')
            setTimeout(function(){
                $('#competitiveSpeed').css('visibility', 'hidden')
                console.log("hidden")
            },1000)  
        }
    }

    activateMoreWords(){
        if(this.wordsInGame<=1){
            $("#removeWords").prop('disabled', true)
        }
        if(this.wordsInGame>=this.maxWords){
            $("#addWords").prop('disabled', true)
        }
        if(this.wordsInGame>this.maxWords){
            window.location.href = "?words="+this.maxWords
        }
        $("#addWords").click(()=>{
            this.addWords()
        })
        $("#removeWords").click(()=>{
            this.removeWords()
        })
    }
    addWords(){
        //https://stackoverflow.com/questions/16959476/how-to-go-to-a-url-using-jquery
        window.location.href = "?words="+(parseInt(this.wordsInGame)+1)
    }

    removeWords(){
        window.location.href = "?words="+(parseInt(this.wordsInGame)-1)
    }

    activateRestart(){
        $('#restartButton').click(()=>{
            window.location.href = "?words="+this.wordsInGame
        })
    }
}

let typer = new Typer(playerName);