const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Arkaplan resmi
const background = new Image();
background.src = 'back.jpg';

// Giriş ekranı resmi
const titleScreen = new Image();
titleScreen.src = 'raccoon.jpg';

// Power-up resmi
const initiaImage = new Image();
initiaImage.src = 'initia.png';
const feedImage = new Image();
feedImage.src = 'feed.png';
const heartImage = new Image();
heartImage.src = 'heart.png';
const foxImage = new Image(); // Düşman resmi
foxImage.src = 'fox.png';

// Resimlerin yüklendiğinden emin olmak için
feedImage.onload = () => {
    console.log('Feed resmi yüklendi');
};
feedImage.onerror = () => {
    console.log('Feed resmi yüklenemedi');
};

// Ses efektleri
const laserSound = document.getElementById('laserSound');
const explosionSound = document.getElementById('explosionSound');
const hitSound = document.getElementById('hitSound');
const powerupPickupSound = document.getElementById('powerupPickupSound');
const backgroundMusic = document.getElementById('backgroundMusic');

// Ses seviyelerini ayarla
laserSound.volume = 0.5;
explosionSound.volume = 0.5;
hitSound.volume = 0.5;
powerupPickupSound.volume = 0.6;
backgroundMusic.volume = 0.4;

canvas.width = 1200;
canvas.height = 800;

// Player
const player = {
    x: 50,
    y: canvas.height / 2,
    width: 120,  // 140'tan 120'ye düşürdüm (orantılı olarak)
    height: 200, // 240'tan 200'e düşürdüm
    speed: 5,
    color: '#00ff00',
    health: 3,
    maxHealth: 3,
    invulnerable: false,
    invulnerableTime: 0,
    laser: {
        active: false,
        width: 1200,
        height: 4,
        color: '#0000ff',
        energy: 100,
        currentEnergy: 100,
        rechargeRate: 0.5,
        drainRate: 1,
        canUse: true
    }
};

const enemies = [];
const enemyLasers = [];
const powerUps = [];
let score = 0;
let distanceScore = 0; // Mesafe puanı için yeni değişken
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let gameTime = 0;
let lastEnemySpawnTime = 0;
let lastPowerUpTime = 0;
let lastDistanceScoreTime = 0; // Son mesafe puanı zamanı

// Controls
let wPressed = false;
let sPressed = false;
let aPressed = false;
let dPressed = false;

let gameStarted = false; // Oyunun başlayıp başlamadığını kontrol etmek için

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameStarted && e.code === 'Space') {
        gameStarted = true;
        // Oyun başladığında müziği çal
        backgroundMusic.play();
        return;
    }

    if (gameStarted) {
        if (e.key.toLowerCase() === 'w') wPressed = true;
        if (e.key.toLowerCase() === 's') sPressed = true;
        if (e.key.toLowerCase() === 'a') aPressed = true;
        if (e.key.toLowerCase() === 'd') dPressed = true;
        
        if (e.code === 'Space' && player.laser.canUse && player.laser.currentEnergy > 0) {
            player.laser.active = true;
            if (laserSound.paused) { // Eğer ses çalmıyorsa başlat
                laserSound.currentTime = 0;
                laserSound.play();
            }
        }
        if (e.key.toLowerCase() === 'r' && gameOver) resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'w') wPressed = false;
    if (e.key.toLowerCase() === 's') sPressed = false;
    if (e.key.toLowerCase() === 'a') aPressed = false;
    if (e.key.toLowerCase() === 'd') dPressed = false;
    if (e.code === 'Space') {
        player.laser.active = false;
        laserSound.pause(); // Sesi durdur
        laserSound.currentTime = 0; // Ses pozisyonunu başa al
    }
});

function shootLaser() {
    enemyLasers.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 10,
        height: 4,
        color: '#ff0000'
    });
}

function createEnemy() {
    const maxEnemies = Math.min(3 + Math.floor(gameTime / 10), 15);
    const enemySpeed = Math.min(2 + Math.floor(gameTime / 20), 5);
    
    if (enemies.length < maxEnemies) {
        enemies.push({
            x: canvas.width - 50,
            y: Math.random() * (canvas.height - 40),
            width: 40,
            height: 40,
            speed: enemySpeed,
            health: 5,
            maxHealth: 5,
            color: '#ff0000'
        });
    }
}

function createPowerUp() {
    const currentTime = Date.now();
    if (currentTime - lastPowerUpTime < 5000) return; // 5 saniye arayla çıkmasını sağlar
    lastPowerUpTime = currentTime;

    const type = Math.random() < 0.3 ? 'health' : 'laser'; // Recharge boncukları daha sık çıkar
    powerUps.push({
        x: canvas.width + 30, // Haritanın sağ tarafından başlar
        y: Math.random() * (canvas.height - 30),
        width: 30,
        height: 30,
        type: type,
        color: type === 'health' ? '#00ff00' : '#0000ff',
        speed: 2 // Sola doğru hareket hızı
    });
}

function resetGame() {
    player.health = player.maxHealth;
    player.invulnerable = false;
    player.invulnerableTime = 0;
    player.laser.currentEnergy = player.laser.energy;
    player.laser.canUse = true;
    enemies.length = 0;
    enemyLasers.length = 0;
    powerUps.length = 0;
    score = 0;
    gameTime = 0;
    gameOver = false;
}

function updatePlayerPosition() {
    const playerGif = document.getElementById('player-gif');
    playerGif.style.left = player.x + 'px';
    playerGif.style.top = player.y + 'px';
}

function update() {
    if (!gameStarted || gameOver) return;

    gameTime += 1/60;
    
    // Her saniye mesafe puanı ekle
    if (gameTime - lastDistanceScoreTime >= 1) {
        distanceScore += 1; // Her saniye 1 puan
        score += 1; // Toplam puana direkt ekle
        lastDistanceScoreTime = gameTime;
        
        // Yüksek skoru güncelle
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
    }

    const spawnInterval = Math.max(1 - gameTime/60, 0.2);
    if (Math.random() < spawnInterval/30) createEnemy();

    if (Math.random() < 0.005) createPowerUp(); // Başlarda da çıkabilir

    if (wPressed && player.y > 0) player.y -= player.speed;
    if (sPressed && player.y < canvas.height - player.height) player.y += player.speed;
    if (aPressed && player.x > 0) player.x -= player.speed;
    if (dPressed && player.x < canvas.width - player.width) player.x += player.speed;

    // Sürekli lazer için çarpışma kontrolü
    if (player.laser.active) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (enemy.x > player.x + player.width &&
                enemy.y + enemy.height > player.y &&
                enemy.y < player.y + player.height) {
                
                // Her frame'de 0.2 hasar ver
                enemy.health -= 0.2;
                
                // Efekt için renk değiştir
                enemy.color = `rgb(255, ${Math.min(255, 255 - enemy.health * 30)}, ${Math.min(255, 255 - enemy.health * 30)})`;
                
                if (enemy.health <= 0) {
                    explosionSound.currentTime = 0;
                    explosionSound.play();
                    enemies.splice(i, 1);
                    score += 5; // Düşman öldürme puanını 10'dan 5'e düşürdük
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('highScore', highScore);
                    }
                }
            }
        }
    }

    // Lazer enerji yönetimi
    if (player.laser.active) {
        player.laser.currentEnergy -= player.laser.drainRate * 2; 
        if (player.laser.currentEnergy <= 0) {
            player.laser.active = false;
            player.laser.canUse = false;
            player.laser.currentEnergy = 0;
        }
    } else {
        if (player.laser.currentEnergy < player.laser.energy) {
            player.laser.currentEnergy += player.laser.rechargeRate / 2; 
            if (player.laser.currentEnergy >= player.laser.energy) {
                player.laser.currentEnergy = player.laser.energy;
                player.laser.canUse = true;
            }
        }
    }

    for (let i = enemyLasers.length - 1; i >= 0; i--) {
        const laser = enemyLasers[i];
        laser.x -= 5;
        
        if (laser.x < 0) {
            enemyLasers.splice(i, 1);
            continue;
        }

        if (!player.invulnerable &&
            laser.x < player.x + player.width &&
            laser.x + laser.width > player.x &&
            laser.y < player.y + player.height &&
            laser.y + laser.height > player.y) {
            
            hitSound.currentTime = 0;
            hitSound.play();
            player.health--;
            player.invulnerable = true;
            player.invulnerableTime = Date.now();
            enemyLasers.splice(i, 1);

            if (player.health <= 0) {
                gameOver = true;
            }
        }
    }

    // Power-up hareketi ve çarpışma kontrolü
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.x -= powerUp.speed; 

        if (powerUp.x < -powerUp.width) {
            powerUps.splice(i, 1); 
            continue;
        }

        if (player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y) {
            
            if (powerUp.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 1);
                powerupPickupSound.currentTime = 0;
                powerupPickupSound.play();
            } else if (powerUp.type === 'laser') {
                player.laser.currentEnergy = player.laser.energy;
                player.laser.canUse = true;
                powerupPickupSound.currentTime = 0;
                powerupPickupSound.play();
            }
            powerUps.splice(i, 1);
        }
    }

    // Invulnerability timer
    if (player.invulnerable && Date.now() - player.invulnerableTime > 1000) {
        player.invulnerable = false;
    }

    // Enemy movement and shooting
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x -= enemy.speed;

        if (enemy.x + enemy.width < 0) {
            enemies.splice(i, 1);
            continue;
        }

        // Enemy collision with player
        if (!player.invulnerable &&
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            
            hitSound.currentTime = 0;
            hitSound.play();
            enemies.splice(i, 1);
            player.health--;
            player.invulnerable = true;
            player.invulnerableTime = Date.now();

            if (player.health <= 0) {
                gameOver = true;
            }
            continue;
        }

        // Enemy shooting
        if (Math.random() < 0.002) {
            enemyLasers.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: 10,
                height: 4,
                color: '#FFA500' // Turuncu lazer
            });
        }
    }

    updatePlayerPosition();
}

function draw() {
    if (!gameStarted) {
        // Giriş ekranını çiz
        ctx.drawImage(titleScreen, 0, 0, canvas.width, canvas.height);
        
        // Oyun başlığı ve başlama talimatı
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RACCOOMSDAY', canvas.width/2, canvas.height - 150);
        
        ctx.font = '30px Arial';
        ctx.fillText('PRESS SPACE TO START', canvas.width/2, canvas.height - 80);
        
        ctx.textAlign = 'left'; // Diğer yazılar için text align'ı resetle
        return;
    }

    // Normal oyun çizimi
    // Arkaplanı çiz
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Önce karakteri çizin
    updatePlayerPosition();

    // Sonra lazeri çizin
    if (player.laser.active) {
        ctx.fillStyle = player.laser.color;
        ctx.fillRect(
            player.x + player.width,
            player.y + player.height/4, // Göz hizasına geri getir
            player.laser.width,
            player.laser.height
        );
    }

    enemyLasers.forEach(laser => {
        ctx.fillStyle = laser.color;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    });

    // Rakipleri çiz
    enemies.forEach(enemy => {
        // Önce düşmanı çiz
        ctx.drawImage(foxImage, 
            enemy.x - (enemy.width * 1),
            enemy.y - (enemy.height * 1),
            enemy.width * 3,
            enemy.height * 3
        );

        // Can barı arka planı (siyah)
        const healthBarWidth = enemy.width * 2; // Genişliği azalttım
        const healthBarHeight = 5; // Yüksekliği azalttım
        ctx.fillStyle = '#000';
        ctx.fillRect(
            enemy.x - (enemy.width * 0.5), // Merkezleme için pozisyonu ayarladım
            enemy.y - (enemy.height * 1) - 8, // Düşmana daha yakın
            healthBarWidth,
            healthBarHeight
        );

        // Can barı (turuncu)
        const currentHealthWidth = (enemy.health / enemy.maxHealth) * healthBarWidth;
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(
            enemy.x - (enemy.width * 0.5), // Merkezleme için pozisyonu ayarladım
            enemy.y - (enemy.height * 1) - 8, // Düşmana daha yakın
            currentHealthWidth,
            healthBarHeight
        );
    });

    // Power-up'ları çiz
    powerUps.forEach(powerUp => {
        console.log('Power-up tipi:', powerUp.type);
        if (powerUp.type === 'laser') {
            // Laser power-up için initia.png kullan (1.2 kat büyük)
            ctx.drawImage(initiaImage, 
                powerUp.x - (powerUp.width * 0.1),
                powerUp.y - (powerUp.height * 0.1),
                powerUp.width * 1.2,
                powerUp.height * 1.2
            );
        } else if (powerUp.type === 'health') {
            // Health power-up için feed.png kullan (6 kat büyük)
            console.log('Health power-up çiziliyor');
            ctx.drawImage(feedImage, 
                powerUp.x - (powerUp.width * 2.5), // Merkezleme için pozisyonu daha fazla ayarla
                powerUp.y - (powerUp.height * 2.5), // Merkezleme için pozisyonu daha fazla ayarla
                powerUp.width * 6,  // 6 kat genişlik
                powerUp.height * 6  // 6 kat yükseklik
            );
        }
    });

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 60);

    // Health display - her can için bir heart.png çiz
    const heartSize = 30; // Kalp boyutu
    const heartSpacing = 35; // Kalpler arası boşluk
    for(let i = 0; i < player.health; i++) {
        ctx.drawImage(heartImage, 
            canvas.width - 100 + (i * heartSpacing), 
            10, 
            heartSize, 
            heartSize
        );
    }

    // Enerji barı
    const barWidth = 200;
    const barHeight = 20;
    const barX = 10;
    const barY = canvas.height - 30;

    // Arka plan
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Enerji seviyesi
    const energyWidth = (player.laser.currentEnergy / player.laser.energy) * barWidth;
    ctx.fillStyle = player.laser.canUse ? player.laser.color : '#ff0000';
    ctx.fillRect(barX, barY, energyWidth, barHeight);

    // Çerçeve
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Enerji durumu
    ctx.fillStyle = '#fff';
    if (!player.laser.canUse) {
        ctx.fillText('Recharging...', barX + barWidth + 10, barY + 15);
    }

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.fillText('GAME OVER', canvas.width/2 - 120, canvas.height/2);
        
        ctx.font = '24px Arial';
        ctx.fillText('Press R to Restart', canvas.width/2 - 80, canvas.height/2 + 40);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
