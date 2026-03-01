// --- WORDBOOM Core Script ---

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let wordData = []; // [{word: 'apple', meaning: '사과'}]
    let currentTestMode = 'word-test'; // 'word-test' or 'meaning-test'
    let currentPreviewView = 'exam'; // 'exam' or 'answer'
    
    // Game State
    let gameState = {
        isPlaying: false,
        score: 0,
        enemies: [],
        spawnInterval: 2000,
        lastSpawn: 0,
        speed: 1.0,
        mode: 'word' // 'word' (type the word) or 'meaning' (type the meaning)
    };

    // --- DOM Elements ---
    const imageUpload = document.getElementById('image-upload');
    const uploadStatus = document.getElementById('upload-status');
    const dataEditContainer = document.getElementById('data-edit-container');
    const wordTableBody = document.getElementById('word-table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const wordCountBadge = document.getElementById('word-count-badge');

    const previewContent = document.getElementById('preview-content');
    const totalCountSpans = document.querySelectorAll('.total-count');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    const gameCanvas = document.getElementById('game-canvas');
    const ctx = gameCanvas.getContext('2d');
    const gameInput = document.getElementById('game-input');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameOverlay = document.getElementById('game-overlay');
    const gameScoreDisplay = document.getElementById('game-score');
    const gameModeSelect = document.getElementById('game-mode-select');

    // --- 1. AI Extraction (Step 1) ---
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading
        uploadStatus.classList.remove('hidden');
        dataEditContainer.classList.add('hidden');

        // Mocking AI Extraction (GPT-4o mini via Cloud Functions)
        // In a real app, you'd upload to Firebase and call the function.
        setTimeout(() => {
            const mockData = [
                { word: 'Pragmatic', meaning: '실용적인' },
                { word: 'Eloquent', meaning: '유창한' },
                { word: 'Resilient', meaning: '회복력 있는' },
                { word: 'Ambiguous', meaning: '모호한' },
                { word: 'Meticulous', meaning: '꼼꼼한' }
            ];
            
            wordData = mockData;
            renderTable();
            renderPreview();
            updateStats();
            
            uploadStatus.classList.add('hidden');
            dataEditContainer.classList.remove('hidden');
            lucide.createIcons();
        }, 2000);
    });

    function renderTable() {
        wordTableBody.innerHTML = '';
        wordData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" value="${item.word}" data-index="${index}" data-key="word"></td>
                <td><input type="text" value="${item.meaning}" data-index="${index}" data-key="meaning"></td>
                <td><button class="btn-delete" data-index="${index}"><i data-lucide="trash-2"></i></button></td>
            `;
            wordTableBody.appendChild(row);
        });
        
        // Table events
        wordTableBody.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const { index, key } = e.target.dataset;
                wordData[index][key] = e.target.value;
                renderPreview();
            });
        });

        wordTableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                wordData.splice(index, 1);
                renderTable();
                renderPreview();
                updateStats();
                lucide.createIcons();
            });
        });
    }

    addRowBtn.addEventListener('click', () => {
        wordData.push({ word: '', meaning: '' });
        renderTable();
        updateStats();
        lucide.createIcons();
    });

    function updateStats() {
        wordCountBadge.textContent = `${wordData.length} words`;
        totalCountSpans.forEach(s => s.textContent = wordData.length);
    }

    // --- 2. Preview Logic (Step 2) ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.mode) currentTestMode = btn.dataset.mode;
            if (btn.dataset.view) currentPreviewView = btn.dataset.view;
            
            renderPreview();
        });
    });

    function renderPreview() {
        if (wordData.length === 0) {
            previewContent.innerHTML = '<p class="placeholder-text">단어를 먼저 추출해주세요.</p>';
            return;
        }

        previewContent.innerHTML = '';
        wordData.forEach((item, i) => {
            const row = document.createElement('div');
            row.className = 'preview-row';
            
            const questionText = currentTestMode === 'word-test' ? item.meaning : item.word;
            const answerText = currentTestMode === 'word-test' ? item.word : item.meaning;

            row.innerHTML = `
                <span class="num">${i + 1}.</span>
                <span class="q">${questionText}</span>
                <span class="a ${currentPreviewView === 'answer' ? 'answer-text' : ''}">
                    ${currentPreviewView === 'answer' ? answerText : ''}
                </span>
            `;
            previewContent.appendChild(row);
        });
    }

    downloadPdfBtn.addEventListener('click', () => {
        if (wordData.length === 0) return alert('단어를 입력해주세요.');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add Title
        doc.setFontSize(20);
        doc.text('WORDBOOM 단어 테스트', 105, 20, { align: 'center' });
        
        // Add Table
        const headers = [['No.', 'Question', 'Answer']];
        const data = wordData.map((item, i) => [
            i + 1, 
            currentTestMode === 'word-test' ? item.meaning : item.word,
            ''
        ]);

        doc.autoTable({
            startY: 40,
            head: headers,
            body: data,
            theme: 'striped'
        });

        // Add Answer Key on new page
        doc.addPage();
        doc.text('정답지', 105, 20, { align: 'center' });
        const answerData = wordData.map((item, i) => [
            i + 1,
            currentTestMode === 'word-test' ? item.meaning : item.word,
            currentTestMode === 'word-test' ? item.word : item.meaning
        ]);
        doc.autoTable({
            startY: 40,
            head: headers,
            body: answerData
        });

        doc.save('wordboom-test.pdf');
    });

    // --- 3. Word Bomb Game Logic (Step 3) ---
    function resizeCanvas() {
        const rect = gameCanvas.parentElement.getBoundingClientRect();
        gameCanvas.width = rect.width;
        gameCanvas.height = rect.height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Enemy {
        constructor(wordObj, mode) {
            this.word = wordObj.word;
            this.meaning = wordObj.meaning;
            this.mode = mode;
            this.display = mode === 'word' ? this.meaning : this.word;
            this.answer = mode === 'word' ? this.word : this.meaning;
            
            this.x = Math.random() * (gameCanvas.width - 150) + 75;
            this.y = -50;
            this.speed = gameState.speed + Math.random() * 0.5;
            this.color = `hsl(${Math.random() * 360}, 70%, 70%)`;
        }

        update() {
            this.y += this.speed;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Draw bomb body
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Pretendard';
            ctx.textAlign = 'center';
            ctx.fillText(this.display, 0, 45);
            
            ctx.restore();
        }
    }

    function spawnEnemy() {
        if (wordData.length === 0) return;
        const randomWord = wordData[Math.floor(Math.random() * wordData.length)];
        if (!randomWord.word || !randomWord.meaning) return;
        gameState.enemies.push(new Enemy(randomWord, gameState.mode));
    }

    function gameLoop(time) {
        if (!gameState.isPlaying) return;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Spawn
        if (time - gameState.lastSpawn > gameState.spawnInterval) {
            spawnEnemy();
            gameState.lastSpawn = time;
            gameState.spawnInterval = Math.max(800, gameState.spawnInterval * 0.98);
            gameState.speed += 0.01;
        }

        // Update & Draw
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            e.update();
            e.draw();

            if (e.y > gameCanvas.height + 50) {
                gameOver();
                return;
            }
        }

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        if (wordData.length === 0) return alert('게임을 시작하려면 단어가 필요합니다.');
        
        gameState = {
            isPlaying: true,
            score: 0,
            enemies: [],
            spawnInterval: 2000,
            lastSpawn: performance.now(),
            speed: 1.0,
            mode: gameModeSelect.value
        };

        gameScoreDisplay.textContent = '0000';
        gameOverlay.classList.add('hidden');
        gameInput.disabled = false;
        gameInput.value = '';
        gameInput.focus();
        
        requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameState.isPlaying = false;
        gameOverlay.classList.remove('hidden');
        gameInput.disabled = true;
        alert(`Game Over! Final Score: ${gameState.score}`);
    }

    gameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = gameInput.value.trim().toLowerCase();
            let found = false;
            
            for (let i = 0; i < gameState.enemies.length; i++) {
                if (gameState.enemies[i].answer.toLowerCase() === val) {
                    // Explode!
                    createExplosion(gameState.enemies[i].x, gameState.enemies[i].y, gameState.enemies[i].color);
                    gameState.enemies.splice(i, 1);
                    gameState.score += 100;
                    gameScoreDisplay.textContent = String(gameState.score).padStart(4, '0');
                    found = true;
                    break;
                }
            }
            gameInput.value = '';
        }
    });

    // Simple particle effect
    function createExplosion(x, y, color) {
        // You could add a particle system here for more "Boom"
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.restore();
    }

    startGameBtn.addEventListener('click', startGame);
});
