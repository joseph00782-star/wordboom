// --- WORDBOOM Main Script ---

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let wordList = []; // Array of {word, meaning}
    let currentDoc = null; // Store current jsPDF instance
    let gameState = {
        score: 0,
        enemies: [],
        isPlaying: false,
        mode: 'word-mode', 
        lastTime: 0,
        spawnTimer: 0
    };

    // --- DOM Elements ---
    const imageUpload = document.getElementById('image-upload');
    const previewImage = document.getElementById('preview-image');
    const uploadPreview = document.getElementById('upload-preview');
    const ocrLoader = document.getElementById('ocr-loader');
    const wordListContainer = document.getElementById('word-list-container');
    const todayWordsUl = document.getElementById('today-words');
    const generatePdfBtn = document.getElementById('generate-pdf');
    const testTypeSelect = document.getElementById('test-type');
    const testTitleInput = document.getElementById('test-title');
    const addWordBtn = document.getElementById('add-word-btn');

    const pdfModal = document.getElementById('pdf-modal');
    const pdfFrame = document.getElementById('pdf-frame');
    const closeModalBtn = document.getElementById('close-modal');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    const gameCanvas = document.getElementById('game-canvas');
    const ctx = gameCanvas.getContext('2d');
    const gameInput = document.getElementById('game-input');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameStartOverlay = document.getElementById('game-start-overlay');
    const gameScoreDisplay = document.getElementById('game-score');
    const gameModeSelect = document.getElementById('game-mode');
    const currentModeBadge = document.getElementById('current-mode');

    // --- 1. AI Word Extraction with Tesseract.js ---
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show image preview
        const reader = new FileReader();
        reader.onload = (event) => {
            previewImage.src = event.target.result;
            uploadPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // OCR Processing
        ocrLoader.classList.remove('hidden');
        wordListContainer.classList.add('hidden');
        
        try {
            const worker = await Tesseract.createWorker({
                logger: m => {
                    if (m.status === 'recognizing text') {
                        document.getElementById('loader-text').textContent = `AI가 단어를 분석 중입니다... ${(m.progress * 100).toFixed(0)}%`;
                    }
                }
            });
            await worker.loadLanguage('eng+kor');
            await worker.initialize('eng+kor');
            
            // Layout analysis helps find columns
            const { data: { lines } } = await worker.recognize(file);
            const extractedWords = [];

            lines.forEach(line => {
                // Heuristic: Try to split by common delimiters or large spaces
                const text = line.text.trim();
                if (text.length < 3) return;

                // Split by colon, dash, or multiple spaces
                let parts = text.split(/[:\-\t]|\s{2,}/);
                if (parts.length >= 2) {
                    const word = parts[0].trim();
                    const meaning = parts.slice(1).join(' ').trim();
                    if (word && meaning) {
                        extractedWords.push({ word, meaning });
                    }
                } else {
                    // Fallback for single line without clear delimiter
                    // (Might be just a word or a meaning, user can edit)
                    extractedWords.push({ word: text, meaning: '' });
                }
            });

            await worker.terminate();

            if (extractedWords.length > 0) {
                updateWordList(extractedWords);
            } else {
                alert('이미지에서 단어를 찾지 못했습니다. 직접 추가하거나 다른 이미지를 시도해 보세요.');
                updateWordList([{ word: '', meaning: '' }]);
            }
        } catch (error) {
            console.error(error);
            alert('AI 분석 중 오류가 발생했습니다.');
        } finally {
            ocrLoader.classList.add('hidden');
            wordListContainer.classList.remove('hidden');
            document.getElementById('loader-text').textContent = "AI가 단어를 분석 중입니다...";
        }
    });

    function updateWordList(words) {
        wordList = words;
        renderWordList();
    }

    function renderWordList() {
        todayWordsUl.innerHTML = '';
        wordList.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'word-item fade-in';
            li.innerHTML = `
                <input type="text" value="${item.word}" data-index="${index}" data-type="word" placeholder="단어">
                <input type="text" value="${item.meaning}" data-index="${index}" data-type="meaning" placeholder="뜻">
                <button class="delete-btn" data-index="${index}">✕</button>
            `;
            todayWordsUl.appendChild(li);
        });
    }

    todayWordsUl.addEventListener('input', (e) => {
        const index = e.target.dataset.index;
        const type = e.target.dataset.type;
        wordList[index][type] = e.target.value;
    });

    todayWordsUl.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            wordList.splice(index, 1);
            renderWordList();
        }
    });

    addWordBtn.addEventListener('click', () => {
        wordList.push({ word: '', meaning: '' });
        renderWordList();
    });

    // --- 2. PDF Preview & Generation ---
    generatePdfBtn.addEventListener('click', () => {
        if (wordList.length === 0) {
            alert('먼저 단어를 추출하거나 추가해주세요!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const testType = testTypeSelect.value;
        const title = testTitleInput.value || '오늘의 단어 테스트';

        // Page 1: Test Sheet
        generatePage(doc, title, testType, false);
        
        // Page 2: Answer Key
        doc.addPage();
        generatePage(doc, `${title} (정답지)`, testType, true);

        currentDoc = doc;
        const blobUri = doc.output('bloburl');
        pdfFrame.src = blobUri;
        pdfModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        pdfModal.classList.add('hidden');
        pdfFrame.src = '';
    });

    downloadPdfBtn.addEventListener('click', () => {
        if (currentDoc) {
            const title = testTitleInput.value || '오늘의 단어 테스트';
            currentDoc.save(`${title}.pdf`);
        }
    });

    function generatePage(doc, title, type, isAnswerKey) {
        doc.setFontSize(22);
        doc.setTextColor(60, 60, 60);
        doc.text(title, 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`일시: ${new Date().toLocaleDateString()} | 성명: __________ | 점수: ____ / ${wordList.length}`, 105, 30, { align: 'center' });

        const headers = [['No.', 'Question', 'Answer']];
        const data = wordList.map((item, i) => {
            const question = type === 'word-test' ? item.meaning : item.word;
            const answer = type === 'word-test' ? item.word : item.meaning;
            return [i + 1, question, isAnswerKey ? answer : ''];
        });

        doc.autoTable({
            startY: 40,
            head: headers,
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            styles: { fontSize: 12, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 80 },
                2: { cellWidth: 80 }
            }
        });
    }

    // --- 3. Game Logic: Enemy Defeat ---
    function resizeCanvas() {
        const rect = gameCanvas.parentNode.getBoundingClientRect();
        gameCanvas.width = rect.width;
        gameCanvas.height = rect.height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Enemy {
        constructor(word, meaning, mode) {
            this.word = word;
            this.meaning = meaning;
            this.targetText = mode === 'word-mode' ? meaning : word;
            this.answerText = mode === 'word-mode' ? word : meaning;
            this.x = gameCanvas.width;
            this.y = Math.random() * (gameCanvas.height - 60) + 30;
            this.speed = 1.2 + (Math.random() * 0.8);
            this.color = `oklch(70% 0.2 ${Math.random() * 360})`;
        }

        update() {
            this.x -= this.speed;
        }

        draw() {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            const boxWidth = ctx.measureText(this.targetText).width + 30;
            roundRect(ctx, this.x, this.y - 20, boxWidth, 40, 10, true, true);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Pretendard';
            ctx.textAlign = 'center';
            ctx.fillText(this.targetText, this.x + boxWidth/2, this.y + 6);
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function spawnEnemy() {
        if (wordList.length === 0) return;
        const validWords = wordList.filter(w => w.word && w.meaning);
        if (validWords.length === 0) return;
        const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
        gameState.enemies.push(new Enemy(randomWord.word, randomWord.meaning, gameState.mode));
    }

    function gameLoop(timestamp) {
        if (!gameState.isPlaying) return;
        const deltaTime = timestamp - gameState.lastTime;
        gameState.lastTime = timestamp;
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        gameState.spawnTimer += deltaTime;
        if (gameState.spawnTimer > 2000) {
            spawnEnemy();
            gameState.spawnTimer = 0;
        }
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            enemy.update();
            enemy.draw();
            if (enemy.x < -200) {
                endGame();
                return;
            }
        }
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        const validWords = wordList.filter(w => w.word && w.meaning);
        if (validWords.length === 0) {
            alert('게임을 시작하려면 최소 하나 이상의 유효한 단어가 필요합니다!');
            return;
        }
        gameState.isPlaying = true;
        gameState.score = 0;
        gameState.enemies = [];
        gameState.spawnTimer = 0;
        gameState.lastTime = performance.now();
        gameState.mode = gameModeSelect.value;
        gameScoreDisplay.textContent = '0';
        currentModeBadge.textContent = gameState.mode === 'word-mode' ? 'A모드 (단어입력)' : 'B모드 (뜻입력)';
        gameStartOverlay.classList.add('hidden');
        gameInput.disabled = false;
        gameInput.value = '';
        gameInput.focus();
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameState.isPlaying = false;
        gameStartOverlay.classList.remove('hidden');
        gameInput.disabled = true;
        alert(`게임 종료! 최종 점수: ${gameState.score}`);
    }

    gameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = gameInput.value.trim().toLowerCase();
            let found = false;
            for (let i = 0; i < gameState.enemies.length; i++) {
                if (gameState.enemies[i].answerText.trim().toLowerCase() === input) {
                    gameState.enemies.splice(i, 1);
                    gameState.score += 10;
                    gameScoreDisplay.textContent = gameState.score;
                    found = true;
                    break;
                }
            }
            gameInput.value = '';
        }
    });

    startGameBtn.addEventListener('click', startGame);
});
