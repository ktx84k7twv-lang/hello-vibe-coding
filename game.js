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
        this.hoverPos = null; // 마우스 호버 위치

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

        // 마우스 이동 - 호버 미리보기
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameStarted && !this.gameOver && this.currentPlayer === 1) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const pos = this.getBoardPosition(x, y);
                if (pos && this.board[pos.row][pos.col] === 0) {
                    this.hoverPos = pos;
                } else {
                    this.hoverPos = null;
                }
                this.drawBoard();
            }
        });

        // 마우스가 캔버스를 벗어났을 때
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPos = null;
            this.drawBoard();
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
        this.hoverPos = null;

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

    getBoardPosition(x, y) {
        // 캔버스 좌표를 보드 좌표로 변환
        const col = Math.round((x - CELL_SIZE) / CELL_SIZE);
        const row = Math.round((y - CELL_SIZE) / CELL_SIZE);

        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            return { row, col };
        }
        return null;
    }

    handleClick(x, y) {
        const pos = this.getBoardPosition(x, y);

        if (pos && this.board[pos.row][pos.col] === 0) {
            this.makeMove(pos.row, pos.col, 1);

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
        // 1. 즉시 승리할 수 있는 수 찾기 (5목 완성)
        const winMove = this.findWinningMove(2);
        if (winMove) return winMove;

        // 2. 상대의 즉시 승리를 막기
        const blockMove = this.findWinningMove(1);
        if (blockMove) return blockMove;

        // 3. 4-3 같은 필승 패턴 찾기 (AI)
        const criticalAttack = this.findCriticalMove(2);
        if (criticalAttack) return criticalAttack;

        // 4. 상대의 4-3 패턴 막기
        const criticalDefense = this.findCriticalMove(1);
        if (criticalDefense) return criticalDefense;

        // 5. 쌍삼(double three) 만들기
        const doubleThree = this.findDoubleThree(2);
        if (doubleThree) return doubleThree;

        // 6. 상대의 쌍삼 막기
        const blockDoubleThree = this.findDoubleThree(1);
        if (blockDoubleThree) return blockDoubleThree;

        // 7. 평가 함수를 사용한 최선의 수 찾기
        let bestScore = -Infinity;
        let bestMove = null;

        const moves = this.getAvailableMoves();
        for (const move of moves) {
            const score = this.evaluateMove(move.row, move.col);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || this.getRandomMove();
    }

    // 승리 가능한 수 찾기
    findWinningMove(player) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.checkWin(row, col, player)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        return null;
    }

    // 치명적인 공격/방어 수 찾기 (열린 4, 4-3 등)
    findCriticalMove(player) {
        const criticalMoves = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;

                    const patterns = this.analyzePatterns(row, col, player);
                    let score = 0;

                    // 열린 4 (양쪽이 열려있는 4개 연속)
                    if (patterns.openFour > 0) score += 50000;
                    // 막힌 4 (한쪽이 막힌 4개 연속)
                    if (patterns.closedFour > 0) score += 10000;
                    // 열린 3
                    if (patterns.openThree >= 2) score += 5000; // 쌍삼
                    if (patterns.openThree === 1) score += 1000;

                    this.board[row][col] = 0;

                    if (score > 0) {
                        criticalMoves.push({ row, col, score });
                    }
                }
            }
        }

        if (criticalMoves.length > 0) {
            criticalMoves.sort((a, b) => b.score - a.score);
            return { row: criticalMoves[0].row, col: criticalMoves[0].col };
        }

        return null;
    }

    // 쌍삼(double three) 찾기
    findDoubleThree(player) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    const patterns = this.analyzePatterns(row, col, player);
                    this.board[row][col] = 0;

                    if (patterns.openThree >= 2) {
                        return { row, col };
                    }
                }
            }
        }
        return null;
    }

    // 패턴 분석
    analyzePatterns(row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        let openFour = 0;
        let closedFour = 0;
        let openThree = 0;
        let closedThree = 0;

        for (const [dr, dc] of directions) {
            const line = this.getLine(row, col, dr, dc, player);
            const pattern = this.classifyPattern(line, player);

            if (pattern.type === 'openFour') openFour++;
            else if (pattern.type === 'closedFour') closedFour++;
            else if (pattern.type === 'openThree') openThree++;
            else if (pattern.type === 'closedThree') closedThree++;
        }

        return { openFour, closedFour, openThree, closedThree };
    }

    // 한 방향의 라인 정보 가져오기
    getLine(row, col, dr, dc, player) {
        const line = [];

        // 역방향으로 최대 5칸
        for (let i = 5; i >= 1; i--) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                line.push(this.board[r][c]);
            } else {
                line.push(-1); // 보드 밖
            }
        }

        // 현재 위치
        line.push(player);

        // 정방향으로 최대 5칸
        for (let i = 1; i <= 5; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                line.push(this.board[r][c]);
            } else {
                line.push(-1); // 보드 밖
            }
        }

        return line;
    }

    // 패턴 분류
    classifyPattern(line, player) {
        const opponent = player === 1 ? 2 : 1;
        let count = 0;
        let openEnds = 0;
        let start = -1, end = -1;

        // 연속된 돌의 개수와 범위 찾기
        for (let i = 0; i < line.length; i++) {
            if (line[i] === player) {
                if (start === -1) start = i;
                end = i;
                count++;
            }
        }

        // 양쪽 끝이 열려있는지 확인
        if (start > 0 && line[start - 1] === 0) openEnds++;
        if (end < line.length - 1 && line[end + 1] === 0) openEnds++;

        // 패턴 분류
        if (count === 4) {
            if (openEnds === 2) return { type: 'openFour', count, openEnds };
            if (openEnds >= 1) return { type: 'closedFour', count, openEnds };
        }
        if (count === 3) {
            if (openEnds === 2) return { type: 'openThree', count, openEnds };
            if (openEnds === 1) return { type: 'closedThree', count, openEnds };
        }
        if (count === 2 && openEnds === 2) return { type: 'openTwo', count, openEnds };

        return { type: 'none', count, openEnds };
    }

    // 수를 평가하는 함수 (개선된 버전)
    evaluateMove(row, col) {
        let aiScore = 0;
        let playerScore = 0;

        // AI 입장에서의 점수
        this.board[row][col] = 2;
        const aiPatterns = this.analyzePatterns(row, col, 2);
        aiScore += aiPatterns.openFour * 10000;
        aiScore += aiPatterns.closedFour * 1000;
        aiScore += aiPatterns.openThree * 500;
        aiScore += aiPatterns.closedThree * 100;
        this.board[row][col] = 0;

        // 상대 입장에서의 점수 (방어 점수)
        this.board[row][col] = 1;
        const playerPatterns = this.analyzePatterns(row, col, 1);
        playerScore += playerPatterns.openFour * 9000;
        playerScore += playerPatterns.closedFour * 900;
        playerScore += playerPatterns.openThree * 450;
        playerScore += playerPatterns.closedThree * 90;
        this.board[row][col] = 0;

        // 중앙 가산점
        const centerBonus = (14 - Math.abs(row - 7) - Math.abs(col - 7)) * 5;

        // 난이도에 따른 가중치
        const difficultyMultiplier = this.difficulty === 'easy' ? 0.5 :
                                     this.difficulty === 'medium' ? 1.0 : 1.5;

        return (aiScore * 1.2 + playerScore) * difficultyMultiplier + centerBonus;
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

        // 호버 미리보기 그리기
        if (this.hoverPos && this.currentPlayer === 1) {
            const x = CELL_SIZE * (this.hoverPos.col + 1);
            const y = CELL_SIZE * (this.hoverPos.row + 1);

            this.ctx.beginPath();
            this.ctx.arc(x, y, STONE_RADIUS, 0, Math.PI * 2);

            // 반투명 흑돌
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();

            // 테두리 추가
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
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
