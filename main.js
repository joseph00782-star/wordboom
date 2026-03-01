// --- WORDBOOM Core Script ---
// Now using Firebase Cloud Functions for secure and automated GPT extraction.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

// --- Firebase Configuration ---
// Update with actual project info if needed, but for now we use the project ID.
const firebaseConfig = {
  projectId: "wordboom",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const extractWordsFunc = httpsCallable(functions, 'extractWords');

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

    // --- 1. AI Extraction (Now Automated via Cloud Functions) ---
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading state
        uploadStatus.classList.remove('hidden');
        dataEditContainer.classList.add('hidden');
        uploadStatus.querySelector('p').textContent = 'GPT-4o mini가 이미지를 분석 중입니다...';

        try {
            const base64Image = await fileToBase64(file);
            
            // Call the Firebase Function
            const result = await extractWordsFunc({ image: base64Image });
            
            // Check result structure and map to internal state
            if (result.data && result.data.words) {
                wordData = result.data.words.map(item => ({
                    word: item.word || '',
                    meaning: item.mean || ''
                }));

                renderTable();
                renderPreview();
                updateStats();
                
                uploadStatus.classList.add('hidden');
                dataEditContainer.classList.remove('hidden');
                lucide.createIcons();
            } else {
                throw new Error('올바른 응답 형식이 아닙니다.');
            }
        } catch (error) {
            console.error('Extraction Error:', error);
            // Detail the error for the user
            let msg = 'AI 분석 중 오류가 발생했습니다.';
            if (error.code === 'functions/not-found') msg += '\n(서버 함수가 아직 배포되지 않았습니다.)';
            if (error.code === 'functions/permission-denied') msg += '\n(권한 오류: API 설정 확인 필요)';
            
            alert(msg);
            uploadStatus.classList.add('hidden');
        }
    });

    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

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
        
        // Input handlers
        wordTableBody.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const { index, key } = e.target.dataset;
                wordData[index][key] = e.target.value;
                renderPreview();
            });
        });

        // Delete handlers
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
                <span class="q">${questionText || '______'}</span>
                <span class="a ${currentPreviewView === 'answer' ? 'answer-text' : ''}">
                    ${currentPreviewView === 'answer' ? (answerText || '---') : ''}
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
        
        const title = testTitleInput.value || 'WORDBOOM 테스트';
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
                styles: { font: 'Pretendard' }, // Note: You might need to add a font to jsPDF for Korean
                didDrawCell: (data) => {
                    if (isAnswerKey && data.column.index === 2 && data.section === 'body') {
                        doc.setTextColor(225, 29, 72); 
                    }
                }
            });
        };

        generatePDFPage(false);
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
            this.display = mode === 'word' ? (this.meaning || '???') : (this.word || '???');
            this.answer = mode === 'word' ? this.word : this.meaning;
            
            this.x = Math.random() * (gameCanvas.width - 150) + 75;
            this.y = -60;
            this.speed = gameState.speed + Math.random() * 0.4;
            this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            this.pulse = 0;
        }

        update() {
            this.y += this.speed;
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

            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 15px Pretendard';
            ctx.textAlign = 'center';
            ctx.fillText(this.display, 0, 5);
            
            ctx.restore();
        }
    }

    function spawnEnemy() {
        if (wordData.length === 0) return;
        const validWords = wordData.filter(w => w.word?.trim() || w.meaning?.trim());
        if (validWords.length === 0) return;
        const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
        gameState.enemies.push(new Enemy(randomWord, gameState.mode));
    }

    function gameLoop(time) {
        if (!gameState.isPlaying) return;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        if (time - gameState.lastSpawn > gameState.spawnInterval) {
            spawnEnemy();
            gameState.lastSpawn = time;
            gameState.spawnInterval = Math.max(1000, gameState.spawnInterval * 0.98);
            gameState.speed += 0.005;
        }

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
        const validWords = wordData.filter(w => w.word?.trim() || w.meaning?.trim());
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
            if (!val) return;

            for (let i = 0; i < gameState.enemies.length; i++) {
                const enemyAnswer = (gameState.enemies[i].answer || '').trim().toLowerCase();
                if (enemyAnswer === val) {
                    gameState.enemies.splice(i, 1);
                    gameState.score += 100;
                    gameScoreDisplay.textContent = String(gameState.score).padStart(4, '0');
                    break;
                }
            }
            gameInput.value = '';
        }
    });

    startGameBtn.addEventListener('click', startGame);
});
