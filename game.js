// 게임 상수
const BOARD_SIZE = 15;
const CELL_SIZE = 40;
const STONE_RADIUS = 16;
const FIRST_MOVE_TIME_LIMIT = 60; // 첫 수 제한 시간 (초)

// 게임 상태
class OmokGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.currentPlayer = 1; // 1: 흑(사용자), 2: 백(AI)
        this.gameStarted = false;
        this.gameOver = false;
        this.difficulty = 'medium';
        this.firstMoveMade = false;
        this.timer = null;
        this.timeLeft = FIRST_MOVE_TIME_LIMIT;

        this.initCanvas();
        this.initEventListeners();
        this.drawBoard();
    }

    initCanvas() {
        // 캔버스 크기 조정
        const size = CELL_SIZE * (BOARD_SIZE + 1);
        this.canvas.width = size;
        this.canvas.height = size;
    }

    initEventListeners() {
        // 게임 시작 버튼
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 리셋 버튼
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });

        // 난이도 버튼들
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameStarted) {
                    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.difficulty = e.target.dataset.difficulty;
                }
            });
        });

        // 캔버스 클릭
        this.canvas.addEventListener('click', (e) => {
            if (this.gameStarted && !this.gameOver && this.currentPlayer === 1) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.handleClick(x, y);
            }
        });
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.firstMoveMade = false;
        this.currentPlayer = 1;
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));

        document.getElementById('startBtn').disabled = true;
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = true);
        this.canvas.classList.remove('disabled');

        this.updateStatus('흑돌을 놓으세요! (1분 이내에 첫 수를 두어야 합니다)');
        this.updateTurnIndicator();
        this.drawBoard();
        this.startTimer();
    }

    resetGame() {
        this.stopTimer();
        this.gameStarted = false;
        this.gameOver = false;
        this.firstMoveMade = false;
        this.currentPlayer = 1;
        this.timeLeft = FIRST_MOVE_TIME_LIMIT;
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));

        document.getElementById('startBtn').disabled = false;
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = false);
        this.canvas.classList.add('disabled');

        this.updateStatus('난이도를 선택하고 게임을 시작하세요!');
        this.updateTurnIndicator();
        this.updateTimer();
        this.drawBoard();

        // 게임 상태 스타일 초기화
        const statusEl = document.getElementById('gameStatus');
        statusEl.classList.remove('victory', 'defeat');
    }

    startTimer() {
        this.timeLeft = FIRST_MOVE_TIME_LIMIT;
        this.updateTimer();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.handleTimeOut();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        const timerEl = document.getElementById('timer');
        if (!this.firstMoveMade && this.gameStarted && !this.gameOver) {
            timerEl.textContent = `${this.timeLeft}초`;
            if (this.timeLeft <= 10) {
                timerEl.classList.add('warning');
            } else {
                timerEl.classList.remove('warning');
            }
        } else {
            timerEl.textContent = '-';
            timerEl.classList.remove('warning');
        }
    }

    handleTimeOut() {
        this.gameOver = true;
        this.updateStatus('시간 초과! 첫 수를 1분 이내에 두지 못했습니다.');
        const statusEl = document.getElementById('gameStatus');
        statusEl.classList.add('defeat');
        this.canvas.classList.add('disabled');
    }

    handleClick(x, y) {
        const col = Math.round((x - CELL_SIZE / 2) / CELL_SIZE);
        const row = Math.round((y - CELL_SIZE / 2) / CELL_SIZE);

        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            if (this.board[row][col] === 0) {
                this.makeMove(row, col, 1);

                if (!this.firstMoveMade) {
                    this.firstMoveMade = true;
                    this.stopTimer();
                    this.updateTimer();
                }

                if (!this.gameOver) {
                    setTimeout(() => {
                        this.aiMove();
                    }, 300);
                }
            }
        }
    }

    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.drawBoard();

        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            const statusEl = document.getElementById('gameStatus');
            if (player === 1) {
                this.updateStatus('🎉 승리했습니다! 축하합니다!');
                statusEl.classList.add('victory');
            } else {
                this.updateStatus('😢 AI가 승리했습니다. 다시 도전해보세요!');
                statusEl.classList.add('defeat');
            }
            this.canvas.classList.add('disabled');
            return;
        }

        this.currentPlayer = player === 1 ? 2 : 1;
        this.updateTurnIndicator();
    }

    aiMove() {
        const move = this.findBestMove();
        if (move) {
            this.makeMove(move.row, move.col, 2);
        }
    }

    findBestMove() {
        const depth = this.difficulty === 'easy' ? 1 : this.difficulty === 'medium' ? 2 : 3;

        // 승리 가능한 수 찾기
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 2;
                    if (this.checkWin(row, col, 2)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }

        // 사용자의 승리 막기
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 1;
                    if (this.checkWin(row, col, 1)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }

        // 평가 함수를 사용한 최선의 수 찾기
        let bestScore = -Infinity;
        let bestMove = null;

        const moves = this.getAvailableMoves();
        for (const move of moves) {
            const score = this.evaluatePosition(move.row, move.col, 2);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || this.getRandomMove();
    }

    getAvailableMoves() {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0 && this.hasNeighbor(row, col)) {
                    moves.push({ row, col });
                }
            }
        }
        return moves.length > 0 ? moves : this.getAllEmptyMoves();
    }

    getAllEmptyMoves() {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    moves.push({ row, col });
                }
            }
        }
        return moves;
    }

    hasNeighbor(row, col) {
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                    if (this.board[r][c] !== 0) return true;
                }
            }
        }
        return false;
    }

    getRandomMove() {
        const moves = this.getAvailableMoves();
        return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
    }

    evaluatePosition(row, col, player) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (const [dr, dc] of directions) {
            const count = this.countStones(row, col, dr, dc, player);
            score += this.scorePattern(count);
        }

        // 중앙에 가까울수록 가산점
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;

        return score;
    }

    countStones(row, col, dr, dc, player) {
        let count = 0;
        let openEnds = 0;

        // 정방향
        for (let i = 1; i < 5; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
            if (this.board[r][c] === player) count++;
            else if (this.board[r][c] === 0) {
                openEnds++;
                break;
            }
            else break;
        }

        // 역방향
        for (let i = 1; i < 5; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
            if (this.board[r][c] === player) count++;
            else if (this.board[r][c] === 0) {
                openEnds++;
                break;
            }
            else break;
        }

        return { count, openEnds };
    }

    scorePattern(pattern) {
        const { count, openEnds } = pattern;

        if (count >= 4) return 100000;
        if (count === 3 && openEnds === 2) return 10000;
        if (count === 3 && openEnds === 1) return 1000;
        if (count === 2 && openEnds === 2) return 500;
        if (count === 2 && openEnds === 1) return 100;
        if (count === 1 && openEnds === 2) return 10;

        return 1;
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 가로
            [1, 0],   // 세로
            [1, 1],   // 대각선 \
            [1, -1]   // 대각선 /
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            // 정방향 체크
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // 역방향 체크
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    drawBoard() {
        this.ctx.fillStyle = '#daa520';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 격자 그리기
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < BOARD_SIZE; i++) {
            // 세로선
            this.ctx.beginPath();
            this.ctx.moveTo(CELL_SIZE * (i + 1), CELL_SIZE);
            this.ctx.lineTo(CELL_SIZE * (i + 1), CELL_SIZE * BOARD_SIZE);
            this.ctx.stroke();

            // 가로선
            this.ctx.beginPath();
            this.ctx.moveTo(CELL_SIZE, CELL_SIZE * (i + 1));
            this.ctx.lineTo(CELL_SIZE * BOARD_SIZE, CELL_SIZE * (i + 1));
            this.ctx.stroke();
        }

        // 화점 그리기
        const starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];

        this.ctx.fillStyle = '#000';
        starPoints.forEach(([row, col]) => {
            this.ctx.beginPath();
            this.ctx.arc(CELL_SIZE * (col + 1), CELL_SIZE * (row + 1), 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 돌 그리기
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] !== 0) {
                    const x = CELL_SIZE * (col + 1);
                    const y = CELL_SIZE * (row + 1);

                    // 그림자
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetX = 2;
                    this.ctx.shadowOffsetY = 2;

                    this.ctx.beginPath();
                    this.ctx.arc(x, y, STONE_RADIUS, 0, Math.PI * 2);

                    if (this.board[row][col] === 1) {
                        // 흑돌
                        const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, STONE_RADIUS);
                        gradient.addColorStop(0, '#666');
                        gradient.addColorStop(1, '#000');
                        this.ctx.fillStyle = gradient;
                    } else {
                        // 백돌
                        const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, STONE_RADIUS);
                        gradient.addColorStop(0, '#fff');
                        gradient.addColorStop(1, '#ddd');
                        this.ctx.fillStyle = gradient;
                    }

                    this.ctx.fill();

                    // 그림자 초기화
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.shadowBlur = 0;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 0;
                }
            }
        }
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turnIndicator');
        if (this.gameOver) {
            indicator.textContent = '게임 종료';
        } else if (this.currentPlayer === 1) {
            indicator.textContent = '흑 (당신)';
        } else {
            indicator.textContent = '백 (AI)';
        }
    }

    updateStatus(message) {
        document.getElementById('gameStatus').innerHTML = `<p>${message}</p>`;
    }
}

// 게임 초기화
const game = new OmokGame();
