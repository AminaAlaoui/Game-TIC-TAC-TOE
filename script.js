// ----------------------------
// DOM Elements
// ----------------------------
const boardElement = document.getElementById("board");
const statusText = document.querySelector(".status-text");
const statusIcon = document.querySelector(".status-content i");
const restartBtn = document.getElementById("restartBtn");
const newGameBtn = document.getElementById("newGameBtn");
const voiceBtn = document.getElementById("voiceBtn");
const startGameBtn = document.getElementById("startGame");
const playerXInput = document.getElementById("playerX");
const playerOInput = document.getElementById("playerO");
const currentPlayerNameElement = document.getElementById("currentPlayerName");
const playerXNameElement = document.getElementById("playerXName");
const playerONameElement = document.getElementById("playerOName");
const playerIndicator = document.getElementById("playerIndicator");
const symbolElement = playerIndicator.querySelector('.symbol');
const scoreXElement = document.querySelector("#scoreX .score-value");
const scoreOElement = document.querySelector("#scoreO .score-value");
const soundToggle = document.getElementById("soundToggle");

// ----------------------------
// Game Variables
// ----------------------------
let cells = [];
let currentPlayer = "X";
let gameActive = false;
let scoreX = 0;
let scoreO = 0;
let soundsEnabled = true;

const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

// ----------------------------
// Voice mapping (English positions)
// ----------------------------
const voiceMap = {
    // Grid positions
    "top left": 0, "top center": 1, "top right": 2,
    "middle left": 3, "center": 4, "middle right": 5,
    "bottom left": 6, "bottom center": 7, "bottom right": 8,
    // Numbers
    "one": 0, "two": 1, "three": 2,
    "four": 3, "five": 4, "six": 5,
    "seven": 6, "eight": 7, "nine": 8,
    // Alternative commands
    "upper left": 0, "upper right": 2,
    "lower left": 6, "lower right": 8,
    "mid left": 3, "mid right": 5,
    "middle": 4
};

// ----------------------------
// Audio Functions
// ----------------------------
function playSound(type) {
    if (!soundsEnabled) return;
    
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Set sound based on type
        switch(type) {
            case "X":
                osc.type = "sine";
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                break;
            case "O":
                osc.type = "square";
                osc.frequency.setValueAtTime(330, ctx.currentTime);
                break;
            case "WIN":
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                break;
            case "DRAW":
                osc.type = "triangle";
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                break;
            case "CLICK":
                osc.type = "sine";
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                break;
            case "START":
                osc.type = "sine";
                osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
                break;
        }
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.log("Audio context not supported");
    }
}

// ----------------------------
// Game Functions
// ----------------------------
function initGame() {
    // Set player names from input
    const playerXName = playerXInput.value.trim() || "Player 1";
    const playerOName = playerOInput.value.trim() || "Player 2";
    
    playerXNameElement.textContent = playerXName;
    playerONameElement.textContent = playerOName;
    
    // Reset game state (NE PAS réinitialiser les scores ici)
    currentPlayer = "X";
    gameActive = true;
    
    // Update UI
    createBoard();
    updateUI();
    
    // Play start sound
    playSound("START");
    
    // Update status
    statusText.textContent = `${playerXName}'s turn (X)`;
    statusIcon.className = "fas fa-play-circle";
}

function createBoard() {
    boardElement.innerHTML = "";
    cells = [];
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        
        // Add click event
        cell.addEventListener("click", () => handleCellClick(i));
        
        // Add hover effect
        cell.addEventListener("mouseenter", () => {
            if (gameActive && !cell.textContent) {
                cell.style.backgroundColor = "rgba(76, 201, 240, 0.1)";
                // Show preview of current player's symbol
                cell.setAttribute("data-preview", currentPlayer);
            }
        });
        
        cell.addEventListener("mouseleave", () => {
            if (!cell.textContent) {
                cell.style.backgroundColor = "transparent";
                cell.removeAttribute("data-preview");
            }
        });
        
        boardElement.appendChild(cell);
        cells.push(cell);
    }
}

function handleCellClick(index) {
    if (!gameActive || cells[index].textContent !== "") return;
    
    makeMove(index);
}

function makeMove(index) {
    cells[index].textContent = currentPlayer;
    cells[index].classList.add(currentPlayer.toLowerCase());
    playSound(currentPlayer);
    
    if (checkWinner()) {
        highlightWinner();
        const winnerName = currentPlayer === "X" ? playerXNameElement.textContent : playerONameElement.textContent;
        statusText.textContent = `🎉 ${winnerName} wins!`;
        statusIcon.className = "fas fa-trophy";
        playSound("WIN");
        updateScore();
        gameActive = false;
        return;
    }
    
    if (cells.every(cell => cell.textContent !== "")) {
        statusText.textContent = "Draw! 🤝";
        statusIcon.className = "fas fa-handshake";
        playSound("DRAW");
        gameActive = false;
        return;
    }
    
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateUI();
}

function checkWinner() {
    return winPatterns.some(pattern => 
        pattern.every(index => cells[index].textContent === currentPlayer)
    );
}

function highlightWinner() {
    winPatterns.forEach(pattern => {
        if (pattern.every(index => cells[index].textContent === currentPlayer)) {
            pattern.forEach(index => {
                cells[index].classList.add("winner");
            });
        }
    });
}

function updateScore() {
    // N'incrémenter que quand un joueur gagne réellement
    if (currentPlayer === "X") {
        scoreX++;
        scoreXElement.textContent = scoreX;
    } else {
        scoreO++;
        scoreOElement.textContent = scoreO;
    }
    
    // Animation du score
    const scoreElement = currentPlayer === "X" ? scoreXElement : scoreOElement;
    scoreElement.style.transform = "scale(1.2)";
    setTimeout(() => {
        scoreElement.style.transform = "scale(1)";
    }, 300);
}

function updateUI() {
    const playerName = currentPlayer === "X" 
        ? playerXNameElement.textContent 
        : playerONameElement.textContent;
    
    currentPlayerNameElement.textContent = `${playerName} (${currentPlayer})`;
    symbolElement.textContent = currentPlayer;
    playerIndicator.setAttribute('data-player', currentPlayer);
    
    // Update status
    statusText.textContent = `${playerName}'s turn (${currentPlayer})`;
    
    // Add pulse animation
    playerIndicator.style.animation = 'none';
    setTimeout(() => {
        playerIndicator.style.animation = 'pulse 0.5s';
    }, 10);
}

function resetBoard() {
    currentPlayer = "X";
    gameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell";
        cell.style.backgroundColor = "transparent";
        cell.removeAttribute("data-preview");
    });
    
    updateUI();
    statusText.textContent = "Game restarted!";
    statusIcon.className = "fas fa-redo";
    playSound("CLICK");
}

function newGame() {
    // Demander confirmation avant de réinitialiser les scores
    if (scoreX > 0 || scoreO > 0) {
        if (!confirm("Are you sure you want to start a new game? All scores will be reset.")) {
            return;
        }
    }
    
    // Reset scores
    scoreX = 0;
    scoreO = 0;
    scoreXElement.textContent = "0";
    scoreOElement.textContent = "0";
    
    // Reset board
    currentPlayer = "X";
    gameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell";
        cell.style.backgroundColor = "transparent";
        cell.removeAttribute("data-preview");
    });
    
    // Update player names
    playerXNameElement.textContent = playerXInput.value.trim() || "Player 1";
    playerONameElement.textContent = playerOInput.value.trim() || "Player 2";
    
    updateUI();
    statusText.textContent = "New game started!";
    statusIcon.className = "fas fa-plus-circle";
    playSound("START");
}

// ----------------------------
// Voice Control Functions
// ----------------------------
function startVoiceControl() {
    if (!gameActive) {
        statusText.textContent = "Start a game first!";
        return;
    }
    
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        statusText.textContent = "Voice recognition not supported in your browser";
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    statusText.textContent = "Listening... Say a position (e.g., 'top left', 'center', 'five')";
    statusIcon.className = "fas fa-microphone";
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Voice command:", command);
        
        let position = -1;
        
        // Check for exact matches
        for (const [key, value] of Object.entries(voiceMap)) {
            if (command.includes(key)) {
                position = value;
                break;
            }
        }
        
        // Check for number words
        const numberWords = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
        numberWords.forEach((word, index) => {
            if (command === word || command.includes(word)) {
                position = index;
            }
        });
        
        if (position !== -1 && cells[position] && cells[position].textContent === "") {
            makeMove(position);
        } else {
            statusText.textContent = `"${command}" not recognized. Try: 'top left', 'center', 'five'`;
            setTimeout(() => {
                if (gameActive) {
                    const playerName = currentPlayer === "X" 
                        ? playerXNameElement.textContent 
                        : playerONameElement.textContent;
                    statusText.textContent = `${playerName}'s turn (${currentPlayer})`;
                    statusIcon.className = "fas fa-info-circle";
                }
            }, 2000);
        }
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        statusText.textContent = "Voice recognition error. Try again.";
        statusIcon.className = "fas fa-times-circle";
    };
    
    recognition.onend = () => {
        if (gameActive) {
            statusIcon.className = "fas fa-info-circle";
        }
    };
}

// ----------------------------
// Event Listeners
// ----------------------------
startGameBtn.addEventListener("click", initGame);

restartBtn.addEventListener("click", resetBoard);

newGameBtn.addEventListener("click", newGame);

voiceBtn.addEventListener("click", startVoiceControl);

soundToggle.addEventListener("change", (e) => {
    soundsEnabled = e.target.checked;
    playSound("CLICK");
});

// Initialize the game board on load
window.addEventListener("DOMContentLoaded", () => {
    createBoard();
    updateUI();
    statusText.textContent = "Enter player names and click 'Start Game'";
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    if (!gameActive) return;
    
    // Number keys 1-9 for quick moves
    const keyMap = {
        "1": 0, "2": 1, "3": 2,
        "4": 3, "5": 4, "6": 5,
        "7": 6, "8": 7, "9": 8
    };
    
    if (keyMap[e.key] !== undefined) {
        const position = keyMap[e.key];
        if (cells[position] && cells[position].textContent === "") {
            makeMove(position);
        }
    }
    
    // Spacebar for voice control
    if (e.code === "Space" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        startVoiceControl();
    }
    
    // R for restart
    if (e.code === "KeyR" && e.ctrlKey) {
        e.preventDefault();
        resetBoard();
    }
});

// Add CSS for preview
const style = document.createElement('style');
style.textContent = `
    .cell[data-preview="X"]::before {
        content: "X";
        position: absolute;
        font-size: 6rem;
        opacity: 0.2;
        color: #4361ee;
        font-weight: 800;
    }
    
    .cell[data-preview="O"]::before {
        content: "O";
        position: absolute;
        font-size: 6rem;
        opacity: 0.2;
        color: #f04cc9;
        font-weight: 800;
    }
    
    .score-value {
        transition: transform 0.3s ease;
    }
`;
document.head.appendChild(style);