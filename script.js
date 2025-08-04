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
let audioReady = false;

updateBasketPosition();
updateScore();

// Load audio (tanpa hentikan game)
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

function playCatchSound() {
    playSound(popBuffer);
}

function playMissSound() {
    playSound(missBuffer);
}

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

function createBall() {
    if (!gameRunning) return;

    const ball = document.createElement('div');
    ball.classList.add('ball');
    ball.style.left = Math.random() * (gameArea.clientWidth - 40) + 'px';
    gameArea.appendChild(ball);

    let ballY = 0;
    const fallInterval = setInterval(() => {
        if (!gameRunning) {
            ball.remove();
            clearInterval(fallInterval);
            return;
        }

        ballY += 5;
        ball.style.top = ballY + 'px';

        const ballRect = ball.getBoundingClientRect();
        const basketRect = basket.getBoundingClientRect();

        if (
            ballRect.bottom >= basketRect.top &&
            ballRect.left >= basketRect.left &&
            ballRect.right <= basketRect.right
        ) {
            score++;
            animateScoreChange(scoreValue);
            basket.classList.add('catch');
            setTimeout(() => basket.classList.remove('catch'), 300);
            playCatchSound();
            updateScore();
            ball.remove();
            clearInterval(fallInterval);
        }

        if (ballY > gameArea.clientHeight) {
            lives--;
            animateScoreChange(livesValue);
            playMissSound();
            updateScore();
            ball.remove();
            clearInterval(fallInterval);
            if (lives <= 0) {
                endGame();
            }
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

// Start balls immediately
setInterval(() => {
    if (gameRunning) {
        createBall();
    }
}, 1000);