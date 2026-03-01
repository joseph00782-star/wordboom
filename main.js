// --- WORDBOOM Core Script ---
// Note: In a production environment, GPT-4o mini would be called via a backend.
// For this standalone web version, we use Tesseract.js for real on-device OCR.

import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js';

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
        spawnInterval: 2500,
        lastSpawn: 0,
        speed: 0.8,
        mode: 'word' // 'word' (type the word) or 'meaning' (type the meaning)
    };

    // --- DOM Elements ---
    const imageUpload = document.getElementById('image-upload');
    const uploadStatus = document.getElementById('upload-status');
    const dataEditContainer = document.getElementById('data-edit-container');
    const wordTableBody = document.getElementById('word-table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const wordCountBadge = document.getElementById('word-count-badge');

    const testTitleInput = document.getElementById('test-title-input');
    const previewTitle = document.getElementById('preview-title');
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

    // --- 1. Real AI Extraction with Tesseract.js ---
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading
        uploadStatus.classList.remove('hidden');
        dataEditContainer.classList.add('hidden');
        uploadStatus.querySelector('p').textContent = 'AI가 이미지를 분석 중입니다... (Tesseract OCR)';

        try {
            const result = await Tesseract.recognize(file, 'eng+kor', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        uploadStatus.querySelector('p').textContent = `분석 중: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            const text = result.data.text;
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            
            const extracted = [];
            lines.forEach(line => {
                // Heuristic parsing: split by common delimiters
                let parts = line.split(/[:\-\t]|\s{2,}/);
                if (parts.length >= 2) {
                    extracted.push({
                        word: parts[0].trim(),
                        meaning: parts.slice(1).join(' ').trim()
                    });
                } else {
                    // Try space-based split if only one delimiter-less line
                    let words = line.trim().split(/\s+/);
                    if (words.length >= 2) {
                        extracted.push({
                            word: words[0],
                            meaning: words.slice(1).join(' ')
                        });
                    }
                }
            });

            wordData = extracted.length > 0 ? extracted : [{word: '', meaning: ''}];
            renderTable();
            renderPreview();
            updateStats();
            
            uploadStatus.classList.add('hidden');
            dataEditContainer.classList.remove('hidden');
            lucide.createIcons();
        } catch (error) {
            console.error(error);
            alert('이미지 분석 중 오류가 발생했습니다.');
            uploadStatus.classList.add('hidden');
        }
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
    testTitleInput.addEventListener('input', () => {
        previewTitle.textContent = testTitleInput.value;
    });

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
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const title = testTitleInput.value;
        const today = new Date().toLocaleDateString();

        const generatePDFPage = (isAnswerKey) => {
            doc.setFontSize(22);
            doc.text(isAnswerKey ? `${title} (정답지)` : title, 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.text(`일시: ${today} | 성명: __________ | 점수: ____ / ${wordData.length}`, 105, 30, { align: 'center' });

            const headers = [['No.', 'Question', 'Answer']];
            const data = wordData.map((item, i) => [
                i + 1, 
                currentTestMode === 'word-test' ? item.meaning : item.word,
                isAnswerKey ? (currentTestMode === 'word-test' ? item.word : item.meaning) : ''
            ]);

            doc.autoTable({
                startY: 40,
                head: headers,
                body: data,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                bodyStyles: { textColor: [31, 41, 55] },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 85 },
                    2: { cellWidth: 85 }
                },
                didDrawCell: (data) => {
                    if (isAnswerKey && data.column.index === 2 && data.section === 'body') {
                        doc.setTextColor(225, 29, 72); // Red for answers
                    }
                }
            });
        };

        // Page 1: Exam
        generatePDFPage(false);
        
        // Page 2: Answer Key (on a new page)
        doc.addPage();
        generatePDFPage(true);

        doc.save(`${title}.pdf`);
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
            this.y = -60;
            this.speed = gameState.speed + Math.random() * 0.4;
            this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            this.angle = 0;
            this.pulse = 0;
        }

        update() {
            this.y += this.speed;
            this.angle += 0.02;
            this.pulse += 0.1;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Draw Bomb Fuse
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.quadraticCurveTo(10, -40, 5 + Math.sin(this.pulse)*2, -45);
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Fuse Spark
            ctx.beginPath();
            ctx.arc(5 + Math.sin(this.pulse)*2, -45, 3 + Math.sin(this.pulse*2)*1, 0, Math.PI * 2);
            ctx.fillStyle = '#f97316';
            ctx.fill();

            // Draw Bomb Cap
            ctx.fillStyle = '#475569';
            ctx.fillRect(-10, -35, 20, 10);

            // Draw Bomb Body
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Reflection
            ctx.beginPath();
            ctx.arc(-10, -10, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();

            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 15px Pretendard';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(this.display, 0, 5);
            
            ctx.restore();
        }
    }

    function spawnEnemy() {
        if (wordData.length === 0) return;
        const validWords = wordData.filter(w => w.word.trim() && w.meaning.trim());
        if (validWords.length === 0) return;
        const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
        gameState.enemies.push(new Enemy(randomWord, gameState.mode));
    }

    function gameLoop(time) {
        if (!gameState.isPlaying) return;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Spawn
        if (time - gameState.lastSpawn > gameState.spawnInterval) {
            spawnEnemy();
            gameState.lastSpawn = time;
            gameState.spawnInterval = Math.max(1000, gameState.spawnInterval * 0.98);
            gameState.speed += 0.005;
        }

        // Update & Draw
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            e.update();
            e.draw();

            if (e.y > gameCanvas.height + 60) {
                gameOver();
                return;
            }
        }

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        const validWords = wordData.filter(w => w.word.trim() && w.meaning.trim());
        if (validWords.length === 0) return alert('게임을 시작하려면 최소 한 개의 단어가 필요합니다.');
        
        gameState = {
            isPlaying: true,
            score: 0,
            enemies: [],
            spawnInterval: 2500,
            lastSpawn: performance.now(),
            speed: 0.8,
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
        alert(`게임 종료! 최종 점수: ${gameState.score}`);
    }

    gameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = gameInput.value.trim().toLowerCase();
            let found = false;
            
            for (let i = 0; i < gameState.enemies.length; i++) {
                if (gameState.enemies[i].answer.toLowerCase() === val) {
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

    function createExplosion(x, y, color) {
        // Flash effect
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.restore();
    }

    startGameBtn.addEventListener('click', startGame);
});
