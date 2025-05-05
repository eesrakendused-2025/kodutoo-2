// Fireworks class for creating celebration animations
class Fireworks {
    constructor() {
        this.container = $("#fireworks-container");
        if (this.container.length === 0) {
            this.container = $('<div id="fireworks-container"></div>');
            $("body").append(this.container);
        }
        this.colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
            '#ff00ff', '#00ffff', '#ff8800', '#ff0088'
        ];
    }
    
    launch() {
        // Clear any existing fireworks
        this.container.empty();
        
        // Create multiple fireworks with a delay between each
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createFirework();
            }, i * 300);
        }
    }
    
    createFirework() {
        // Generate random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.6); // Keep in upper 60% of screen
        
        // Create main firework element
        const firework = $('<div class="firework"></div>').css({
            left: x + 'px',
            top: y + 'px',
            backgroundColor: this.getRandomColor()
        });
        
        // Add to container
        this.container.append(firework);
        
        // Create particles
        this.createParticles(x, y);
        
        // Remove after animation completes
        setTimeout(() => {
            firework.remove();
        }, 2000);
    }
    
    createParticles(x, y) {
        // Create particles for each firework
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 50 + 30;
            const size = Math.random() * 3 + 1;
            
            const particle = $('<div class="firework-particle"></div>').css({
                left: x + 'px',
                top: y + 'px',
                width: size + 'px',
                height: size + 'px',
                backgroundColor: this.getRandomColor(),
                borderRadius: '50%',
                position: 'absolute',
                boxShadow: '0 0 ' + size * 2 + 'px ' + size + 'px ' + this.getRandomColor()
            });
            
            this.container.append(particle);
            
            // Animate particle
            const destX = x + Math.cos(angle) * speed * 5;
            const destY = y + Math.sin(angle) * speed * 5;
            
            particle.animate({
                left: destX + 'px',
                top: destY + 'px',
                opacity: 0
            }, 1500 + Math.random() * 1000, function() {
                $(this).remove();
            });
        }
    }
    
    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }
}