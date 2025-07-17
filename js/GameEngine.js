class GameEngine {
    constructor() {
        this.boardManager = new BoardManager();
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameOver = false;
        this.hasWon = false;
        this.wonMessageShown = false;
        this.isAutoPlay = false;
        this.autoPlayInterval = null;
        
        // 事件监听器
        this.listeners = {
            scoreUpdate: [],
            gameOver: [],
            gameWon: [],
            boardUpdate: [],
            tileAdded: []
        };
    }

    // 初始化游戏
    initialize() {
        this.boardManager.initialize();
        this.score = 0;
        this.gameOver = false;
        this.hasWon = false;
        this.wonMessageShown = false;
        this.isAutoPlay = false;
        
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }

        // 添加两个初始方块
        const tile1 = this.boardManager.addRandomTile();
        const tile2 = this.boardManager.addRandomTile();
        
        this.notifyListeners('scoreUpdate', { score: this.score, bestScore: this.bestScore });
        this.notifyListeners('boardUpdate', this.boardManager.getBoard());
        
        if (tile1) this.notifyListeners('tileAdded', tile1);
        if (tile2) this.notifyListeners('tileAdded', tile2);
    }

    // 执行移动（公共接口）
    makeMove(direction) {
        if (this.gameOver) {
            return { success: false, reason: 'Game over' };
        }

        return this.executeMoveInternal(direction);
    }

    // 内部移动执行逻辑
    executeMoveInternal(direction) {
        if (!this.boardManager.canMove(direction)) {
            return { success: false, reason: 'Invalid move' };
        }

        const moveResult = this.boardManager.executeMove(direction);
        
        if (moveResult.moved) {
            // 更新分数
            this.score += moveResult.score;
            this.updateBestScore();
            
            // 添加新方块
            const newTile = this.boardManager.addRandomTile();
            
            // 检查游戏状态
            this.checkWinCondition();
            this.checkGameOverCondition();
            
            // 通知监听器
            this.notifyListeners('scoreUpdate', { score: this.score, bestScore: this.bestScore });
            this.notifyListeners('boardUpdate', this.boardManager.getBoard());
            
            if (newTile) {
                this.notifyListeners('tileAdded', newTile);
            }
            
            return {
                success: true,
                score: moveResult.score,
                movements: moveResult.movements,
                merges: moveResult.merges,
                newTile: newTile
            };
        }
        
        return { success: false, reason: 'No movement occurred' };
    }

    // 检查获胜条件
    checkWinCondition() {
        if (!this.hasWon && this.boardManager.hasWon()) {
            this.hasWon = true;
            if (!this.wonMessageShown) {
                this.wonMessageShown = true;
                this.notifyListeners('gameWon', { score: this.score });
            }
        }
    }

    // 检查游戏结束条件
    checkGameOverCondition() {
        if (this.boardManager.isGameOver()) {
            this.gameOver = true;
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
                this.isAutoPlay = false;
            }
            this.notifyListeners('gameOver', { score: this.score, bestScore: this.bestScore });
        }
    }

    // 重新开始游戏
    restart() {
        this.initialize();
    }

    // 获取当前分数
    getScore() {
        return this.score;
    }

    // 获取最高分
    getBestScore() {
        return this.bestScore;
    }

    // 更新最高分
    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
    }

    // 保存最高分到本地存储
    saveBestScore() {
        try {
            localStorage.setItem('2048-best-score', this.bestScore.toString());
        } catch (e) {
            // 忽略存储错误
        }
    }

    // 从本地存储加载最高分
    loadBestScore() {
        try {
            const saved = localStorage.getItem('2048-best-score');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    // 检查游戏是否结束
    isGameOver() {
        return this.gameOver;
    }

    // 检查是否已获胜
    hasWonGame() {
        return this.hasWon;
    }

    // 获取游戏状态
    getGameState() {
        return {
            board: this.boardManager.getBoard(),
            score: this.score,
            bestScore: this.bestScore,
            gameOver: this.gameOver,
            hasWon: this.hasWon,
            isAutoPlay: this.isAutoPlay,
            maxTile: this.boardManager.getMaxTile()
        };
    }

    // 设置游戏状态（用于撤销/重做）
    setGameState(state) {
        this.boardManager.setBoard(state.board);
        this.score = state.score;
        this.gameOver = state.gameOver || false;
        this.hasWon = state.hasWon || false;
        
        this.updateBestScore();
        this.notifyListeners('scoreUpdate', { score: this.score, bestScore: this.bestScore });
        this.notifyListeners('boardUpdate', this.boardManager.getBoard());
    }

    // 开始自动游戏
    startAutoPlay() {
        if (this.gameOver || this.isAutoPlay) {
            return false;
        }

        this.isAutoPlay = true;
        
        this.autoPlayInterval = setInterval(() => {
            if (this.gameOver) {
                this.stopAutoPlay();
                return;
            }

            // 简单的AI策略：优先级顺序为左、下、右、上
            const directions = ['left', 'down', 'right', 'up'];
            let moveSuccessful = false;
            
            for (const direction of directions) {
                if (this.boardManager.canMove(direction)) {
                    // 自动游戏时直接调用内部移动逻辑
                    const result = this.executeMoveInternal(direction);
                    if (result.success) {
                        moveSuccessful = true;
                        break;
                    }
                }
            }
            
            if (!moveSuccessful) {
                this.stopAutoPlay();
            }
        }, 300); // 每300ms执行一步
        
        return true;
    }

    // 停止自动游戏
    stopAutoPlay() {
        this.isAutoPlay = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    // 检查是否在自动游戏中
    isAutoPlaying() {
        return this.isAutoPlay;
    }

    // 添加事件监听器
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    // 移除事件监听器
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    // 通知监听器
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in event listener:', e);
                }
            });
        }
    }

    // 获取可用移动方向
    getAvailableMoves() {
        const moves = [];
        const directions = ['left', 'right', 'up', 'down'];
        
        for (const direction of directions) {
            if (this.boardManager.canMove(direction)) {
                moves.push(direction);
            }
        }
        
        return moves;
    }

    // 获取空位置数量
    getEmptyTileCount() {
        return this.boardManager.getEmptyPositions().length;
    }

    // 继续游戏（在获胜后）
    continueGame() {
        this.wonMessageShown = true;
        // 不重置hasWon标志，允许继续游戏
    }
} 