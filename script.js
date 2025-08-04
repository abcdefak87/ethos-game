const gameArea = document.getElementById('gameArea');
const basket = document.getElementById('basket');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const gameOverScreen = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');

let basketX = gameArea.clientWidth / 2 - basket.offsetWidth / 2;
let score = 0;
let lives = 3;
let gameRunning = true;

let audioContext = null;
let popBuffer = null;
let missBuffer = null;
// Optional: tambahkan bombBuffer dan heartBuffer jika ada suara

let audioReady = false;

updateBasketPosition();
updateScore();

// Load audio
document.addEventListener('click', async () => {
    if (!audioReady) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
        popBuffer = await loadAudioBuffer('sounds/pop.mp3');
        missBuffer = await loadAudioBuffer('sounds/miss.mp3');
        audioReady = true;
    }
}, { once: true });

async function loadAudioBuffer(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
}

function playSound(buffer) {
    if (!audioReady || !buffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function playCatchSound() { playSound(popBuffer); }
function playMissSound() { playSound(missBuffer); }

function updateBasketPosition() {
    const maxX = gameArea.clientWidth - basket.offsetWidth;
    basketX = Math.max(0, Math.min(maxX, basketX));
    basket.style.left = basketX + 'px';
}

function updateScore() {
    scoreValue.textContent = score;
    livesValue.textContent = lives;
}

function animateScoreChange(element) {
    element.classList.add('scoreChange');
    setTimeout(() => element.classList.remove('scoreChange'), 300);
}

// Keyboard controls
document.addEventListener('keydown', e => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft') {
        basketX -= 20;
        updateBasketPosition();
    } else if (e.key === 'ArrowRight') {
        basketX += 20;
        updateBasketPosition();
    }
});

// Touch controls
gameArea.addEventListener('touchstart', e => moveBasketToTouch(e.touches[0].clientX));
gameArea.addEventListener('touchmove', e => moveBasketToTouch(e.touches[0].clientX));

function moveBasketToTouch(x) {
    if (!gameRunning) return;
    basketX = x - basket.offsetWidth / 2;
    updateBasketPosition();
}

// ✅ Fungsi baru: Buat bola berdasarkan tipe (normal, bomb, heart)
function createBall() {
    if (!gameRunning) return;

    // Tentukan jenis bola
    let type = 'normal';
    const random = Math.random();
    if (random < 0.1) type = 'bomb';      // 10% bom
    else if (random < 0.15) type = 'heart'; // 5% hati

    const ball = document.createElement('div');
    ball.classList.add('ball');

    // Set gambar sesuai tipe
    if (type === 'bomb') {
        ball.style.backgroundImage = "url('images/bomb.png')";
    } else if (type === 'heart') {
        ball.style.backgroundImage = "url('images/heart.png')";
    } else {
        ball.style.backgroundImage = "url('images/bola.png')";
    }

    ball.style.left = Math.random() * (gameArea.clientWidth - 40) + 'px';
    gameArea.appendChild(ball);

    let ballY = 0;

    const fallInterval = setInterval(() => {
        if (!gameRunning) {
            ball.remove();
            clearInterval(fallInterval);
            return;
        }

        // Kecepatan meningkat berdasarkan skor
        let fallSpeed = 5 + Math.floor(score / 10);
        ballY += fallSpeed;
        ball.style.top = ballY + 'px';

        const ballRect = ball.getBoundingClientRect();
        const basketRect = basket.getBoundingClientRect();

        if (
            ballRect.bottom >= basketRect.top &&
            ballRect.left >= basketRect.left &&
            ballRect.right <= basketRect.right
        ) {
            if (type === 'bomb') {
                lives--;
                animateScoreChange(livesValue);
                updateScore();
                playMissSound();
            } else if (type === 'heart') {
                if (lives < 5) lives++;
                animateScoreChange(livesValue);
                updateScore();
                // Tambahkan suara jika ada
            } else {
                score++;
                animateScoreChange(scoreValue);
                basket.classList.add('catch');
                setTimeout(() => basket.classList.remove('catch'), 300);
                playCatchSound();
                updateScore();
            }

            ball.remove();
            clearInterval(fallInterval);

            if (lives <= 0) endGame();
        }

        if (ballY > gameArea.clientHeight) {
            // Jika bola biasa atau heart tidak tertangkap, tidak ada penalti
            if (type === 'normal') {
                lives--;
                animateScoreChange(livesValue);
                updateScore();
                playMissSound();
                if (lives <= 0) endGame();
            }

            ball.remove();
            clearInterval(fallInterval);
        }
    }, 20);
}

function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = 'flex';
}

restartBtn.addEventListener('click', () => {
    score = 0;
    lives = 3;
    basketX = gameArea.clientWidth / 2 - basket.offsetWidth / 2;
    updateBasketPosition();
    updateScore();
    gameOverScreen.style.display = 'none';
    gameRunning = true;
});

// Bola muncul lebih dari satu (dinamis)
setInterval(() => {
    if (!gameRunning) return;

    createBall();

    if (score >= 10) createBall();
    if (score >= 30) createBall();
}, 1000);
