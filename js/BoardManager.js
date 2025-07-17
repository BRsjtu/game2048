class BoardManager {
    constructor() {
        this.size = 4;
        this.board = [];
        this.initialize();
    }

    // 初始化空棋盘
    initialize() {
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = 0;
            }
        }
    }

    // 获取空位置
    getEmptyPositions() {
        const positions = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    positions.push({ row, col });
                }
            }
        }
        return positions;
    }

    // 添加随机方块（2或4）
    addRandomTile() {
        const emptyPositions = this.getEmptyPositions();
        if (emptyPositions.length === 0) {
            return null;
        }

        const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        const value = Math.random() < 0.9 ? 2 : 4; // 90%概率生成2，10%概率生成4
        
        this.board[randomPosition.row][randomPosition.col] = value;
        return {
            row: randomPosition.row,
            col: randomPosition.col,
            value: value,
            isNew: true
        };
    }

    // 克隆棋盘状态
    cloneBoard() {
        const cloned = [];
        for (let i = 0; i < this.size; i++) {
            cloned[i] = [...this.board[i]];
        }
        return cloned;
    }

    // 设置棋盘状态
    setBoard(newBoard) {
        this.board = newBoard;
    }

    // 获取当前棋盘状态
    getBoard() {
        return this.cloneBoard();
    }

    // 检查是否可以向指定方向移动
    canMove(direction) {
        const originalBoard = this.cloneBoard();
        const moveResult = this.executeMove(direction, true); // 试探性移动
        this.board = originalBoard; // 恢复原状态
        return moveResult.moved;
    }

    // 向左移动
    moveLeft() {
        return this.executeMove('left');
    }

    // 向右移动
    moveRight() {
        return this.executeMove('right');
    }

    // 向上移动
    moveUp() {
        return this.executeMove('up');
    }

    // 向下移动
    moveDown() {
        return this.executeMove('down');
    }

    // 执行移动操作
    executeMove(direction, dryRun = false) {
        let moved = false;
        let score = 0;
        const movements = [];
        const merges = [];
        
        if (direction === 'left' || direction === 'right') {
            for (let row = 0; row < this.size; row++) {
                const result = this.processLine(this.board[row], direction === 'right', dryRun);
                if (result.moved) moved = true;
                score += result.score;
                
                // 记录移动信息 - 简化处理，直接比较原始行和结果行
                // 这里不需要复杂的移动追踪，UI会通过重新渲染来处理
                
                if (!dryRun) {
                    this.board[row] = result.line;
                }
                
                // 记录合并信息
                merges.push(...result.merges.map(merge => ({
                    ...merge,
                    row: row
                })));
            }
        } else {
            for (let col = 0; col < this.size; col++) {
                const column = [];
                for (let row = 0; row < this.size; row++) {
                    column.push(this.board[row][col]);
                }
                
                const result = this.processLine(column, direction === 'down', dryRun);
                if (result.moved) moved = true;
                score += result.score;
                
                // 记录移动信息 - 简化处理，直接比较原始列和结果列
                // 这里不需要复杂的移动追踪，UI会通过重新渲染来处理
                
                if (!dryRun) {
                    for (let row = 0; row < this.size; row++) {
                        this.board[row][col] = result.line[row];
                    }
                }
                
                // 记录合并信息
                merges.push(...result.merges.map(merge => ({
                    ...merge,
                    col: col
                })));
            }
        }

        return {
            moved,
            score,
            movements,
            merges
        };
    }



    // 处理一行或一列的移动和合并
    processLine(line, reverse = false, dryRun = false) {
        let processedLine = [...line];
        let moved = false;
        let score = 0;
        const merges = [];

        if (reverse) {
            processedLine.reverse();
        }

        // 移除零并压缩
        const nonZeroTiles = processedLine.filter(tile => tile !== 0);
        const compressed = [...nonZeroTiles];
        
        // 添加零到末尾
        while (compressed.length < this.size) {
            compressed.push(0);
        }

        // 检查是否有移动
        if (JSON.stringify(compressed) !== JSON.stringify(processedLine)) {
            moved = true;
        }

        // 合并相同的方块
        const merged = [...compressed];
        for (let i = 0; i < this.size - 1; i++) {
            if (merged[i] !== 0 && merged[i] === merged[i + 1]) {
                merged[i] *= 2;
                merged[i + 1] = 0;
                score += merged[i];
                moved = true;
                
                if (!dryRun) {
                    merges.push({
                        position: reverse ? this.size - 1 - i : i,
                        value: merged[i]
                    });
                }
            }
        }

        // 再次移除零并压缩
        const finalNonZero = merged.filter(tile => tile !== 0);
        const finalLine = [...finalNonZero];
        
        while (finalLine.length < this.size) {
            finalLine.push(0);
        }

        if (reverse) {
            finalLine.reverse();
        }

        return {
            line: finalLine,
            moved,
            score,
            merges
        };
    }

    // 检查游戏是否结束
    isGameOver() {
        // 如果还有空位，游戏未结束
        if (this.getEmptyPositions().length > 0) {
            return false;
        }

        // 检查是否还可以移动
        const directions = ['left', 'right', 'up', 'down'];
        for (const direction of directions) {
            if (this.canMove(direction)) {
                return false;
            }
        }

        return true;
    }

    // 检查是否获胜（达到2048）
    hasWon() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    // 获取所有方块信息
    getTiles() {
        const tiles = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== 0) {
                    tiles.push({
                        row,
                        col,
                        value: this.board[row][col]
                    });
                }
            }
        }
        return tiles;
    }

    // 获取最大方块值
    getMaxTile() {
        let max = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] > max) {
                    max = this.board[row][col];
                }
            }
        }
        return max;
    }
} 