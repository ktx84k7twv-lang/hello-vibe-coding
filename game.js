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

    // 패턴 분석 (개선된 버전)
    analyzePatterns(row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        let openFour = 0;
        let closedFour = 0;
        let openThree = 0;
        let closedThree = 0;
        let openTwo = 0;

        for (const [dr, dc] of directions) {
            const line = this.getLine(row, col, dr, dc, player);
            const pattern = this.classifyPattern(line, player);

            if (pattern.type === 'openFour') openFour++;
            else if (pattern.type === 'closedFour') closedFour++;
            else if (pattern.type === 'openThree') openThree++;
            else if (pattern.type === 'closedThree') closedThree++;
            else if (pattern.type === 'openTwo') openTwo++;
        }

        return { openFour, closedFour, openThree, closedThree, openTwo };
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

    // 패턴 분류 (개선된 버전 - 분산된 패턴 인식 포함)
    classifyPattern(line, player) {
        const opponent = player === 1 ? 2 : 1;

        // 가능한 모든 5칸 윈도우 검사
        const patterns = [];

        for (let start = 0; start <= line.length - 5; start++) {
            const window = line.slice(start, start + 5);
            const pattern = this.analyzeWindow(window, player);
            if (pattern.type !== 'none') {
                patterns.push(pattern);
            }
        }

        // 가장 위협적인 패턴 반환
        if (patterns.length === 0) return { type: 'none', count: 0, openEnds: 0 };

        const priority = { 'openFour': 5, 'closedFour': 4, 'openThree': 3, 'closedThree': 2, 'openTwo': 1, 'none': 0 };
        patterns.sort((a, b) => priority[b.type] - priority[a.type]);

        return patterns[0];
    }

    // 5칸 윈도우 분석
    analyzeWindow(window, player) {
        const opponent = player === 1 ? 2 : 1;

        // 상대 돌이 있으면 이 윈도우는 무효
        if (window.includes(opponent)) {
            return { type: 'none', count: 0, openEnds: 0 };
        }

        const playerCount = window.filter(cell => cell === player).length;
        const emptyCount = window.filter(cell => cell === 0).length;

        // 보드 밖(-1) 확인
        const leftOpen = window[0] === 0;
        const rightOpen = window[4] === 0;
        const openEnds = (leftOpen ? 1 : 0) + (rightOpen ? 1 : 0);

        // 패턴 분류
        // 4개 + 1빈칸 = 열린4 또는 닫힌4
        if (playerCount === 4 && emptyCount === 1) {
            // 빈칸이 양 끝이면 열린4, 중간이면 분산4
            const emptyIndex = window.indexOf(0);
            if (emptyIndex === 0 || emptyIndex === 4) {
                if (openEnds === 2) return { type: 'openFour', count: 4, openEnds: 2 };
                return { type: 'closedFour', count: 4, openEnds: 1 };
            }
            // 중간에 빈칸 = 분산4 (예: ●●_●● or ●_●●●)
            return { type: 'closedFour', count: 4, openEnds };
        }

        // 3개 + 2빈칸 = 열린3 또는 닫힌3
        if (playerCount === 3 && emptyCount === 2) {
            // 연속된 3개인지 확인
            const str = window.join('');

            // 열린3 패턴: _●●●_, _●●_●_, _●_●●_
            if (str === `0${player}${player}${player}0`) {
                return { type: 'openThree', count: 3, openEnds: 2 };
            }
            if (str === `0${player}${player}0${player}0` || str === `0${player}0${player}${player}0`) {
                return { type: 'openThree', count: 3, openEnds: 2 };
            }

            // 닫힌3
            if (openEnds >= 1) {
                return { type: 'closedThree', count: 3, openEnds };
            }
        }

        // 2개 + 3빈칸 = 열린2
        if (playerCount === 2 && emptyCount === 3 && openEnds === 2) {
            return { type: 'openTwo', count: 2, openEnds: 2 };
        }

        return { type: 'none', count: playerCount, openEnds };
    }

    // 수를 평가하는 함수 (고도화 버전)
    evaluateMove(row, col) {
        let aiScore = 0;
        let playerScore = 0;

        // AI 입장에서의 점수
        this.board[row][col] = 2;
        const aiPatterns = this.analyzePatterns(row, col, 2);
        aiScore += aiPatterns.openFour * 50000;    // 필승
        aiScore += aiPatterns.closedFour * 5000;   // 강력한 위협
        aiScore += aiPatterns.openThree * 1000;    // 좋은 공격
        aiScore += aiPatterns.closedThree * 200;   // 준비 단계
        aiScore += aiPatterns.openTwo * 50;        // 초기 준비

        // 이중 위협 보너스 (가이드 참고)
        if (aiPatterns.openThree >= 2) aiScore += 10000; // 쌍삼
        if (aiPatterns.openFour + aiPatterns.closedFour >= 2) aiScore += 20000; // 4-4
        if (aiPatterns.openFour >= 1 && aiPatterns.openThree >= 1) aiScore += 30000; // 4-3 포크

        this.board[row][col] = 0;

        // 상대 입장에서의 점수 (방어 점수)
        this.board[row][col] = 1;
        const playerPatterns = this.analyzePatterns(row, col, 1);
        playerScore += playerPatterns.openFour * 45000;   // 반드시 막아야 함
        playerScore += playerPatterns.closedFour * 4500;  // 막아야 함
        playerScore += playerPatterns.openThree * 900;    // 위협 제거
        playerScore += playerPatterns.closedThree * 180;  // 선제 차단
        playerScore += playerPatterns.openTwo * 45;       // 공간 제한

        // 상대의 이중 위협 방어 보너스
        if (playerPatterns.openThree >= 2) playerScore += 9000;
        if (playerPatterns.openFour + playerPatterns.closedFour >= 2) playerScore += 18000;
        if (playerPatterns.openFour >= 1 && playerPatterns.openThree >= 1) playerScore += 27000;

        this.board[row][col] = 0;

        // 중앙 제어 가산점 (초반 전략)
        const centerBonus = (14 - Math.abs(row - 7) - Math.abs(col - 7)) * 10;

        // 인접한 돌과의 연결성 평가
        const connectivityBonus = this.evaluateConnectivity(row, col) * 20;

        // 난이도에 따른 가중치
        const difficultyMultiplier = this.difficulty === 'easy' ? 0.6 :
                                     this.difficulty === 'medium' ? 1.0 : 1.4;

        // 공격 우선 전략 (가이드 참고 - 공격이 최선의 방어)
        const attackWeight = 1.3;
        const defenseWeight = 1.0;

        return (aiScore * attackWeight + playerScore * defenseWeight) * difficultyMultiplier +
               centerBonus + connectivityBonus;
    }

    // 연결성 평가 (주변 돌과의 관계)
    evaluateConnectivity(row, col) {
        let connectivity = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1],
            [0, -1], [-1, 0], [-1, -1], [-1, 1]
        ];

        for (const [dr, dc] of directions) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (this.board[r][c] === 2) connectivity += 2; // AI 돌
                if (this.board[r][c] === 1) connectivity += 1; // 상대 돌 근처도 중요
            }
        }

        return connectivity;
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
