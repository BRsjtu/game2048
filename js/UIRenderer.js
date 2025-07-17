class UIRenderer {
    constructor() {
        this.gridContainer = document.getElementById('grid-container');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessageContainer = document.getElementById('game-message');
        
        this.tiles = new Map(); // 存储当前的方块元素
        this.tileIdCounter = 0;
        
        this.initializeGrid();
        this.addScoreAnimation(); // 添加动画样式
    }

    // 初始化背景网格
    initializeGrid() {
        this.gridContainer.innerHTML = '';
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const gridCell = document.createElement('div');
                gridCell.className = 'grid-cell';
                this.gridContainer.appendChild(gridCell);
            }
        }
    }

    // 渲染整个棋盘
    renderBoard(board) {
        // 清除所有现有方块
        this.clearAllTiles();
        
        // 重新渲染所有方块
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] !== 0) {
                    this.createTile(row, col, board[row][col]);
                }
            }
        }
    }

    // 创建方块元素
    createTile(row, col, value, isNew = false, isMerged = false) {
        const tile = document.createElement('div');
        const tileId = `tile-${this.tileIdCounter++}`;
        
        tile.id = tileId;
        tile.className = `tile tile-${value} tile-position-${row}-${col}`;
        tile.textContent = value;
        
        if (isNew) {
            tile.classList.add('tile-new');
        }
        
        if (isMerged) {
            tile.classList.add('tile-merged');
        }
        
        // 超过2048的方块使用特殊样式
        if (value > 2048) {
            tile.classList.add('tile-super');
        }
        
        this.tileContainer.appendChild(tile);
        this.tiles.set(`${row}-${col}`, { element: tile, value, id: tileId });
        
        return tile;
    }

    // 添加新方块（带动画）
    addTile(tileData) {
        if (tileData && tileData.row !== undefined && tileData.col !== undefined) {
            const tile = this.createTile(tileData.row, tileData.col, tileData.value, true);
            
            // 移除动画类，避免重复动画
            setTimeout(() => {
                tile.classList.remove('tile-new');
            }, 200);
        }
    }

    // 移动方块（带动画）
    moveTile(from, to, value) {
        const fromKey = `${from.row}-${from.col}`;
        const toKey = `${to.row}-${to.col}`;
        const tileData = this.tiles.get(fromKey);
        
        if (tileData) {
            const tile = tileData.element;
            
            // 更新位置类
            tile.className = tile.className.replace(
                /tile-position-\d+-\d+/,
                `tile-position-${to.row}-${to.col}`
            );
            
            // 更新映射
            this.tiles.delete(fromKey);
            this.tiles.set(toKey, { ...tileData, value });
        }
    }

    // 合并方块（带动画）
    mergeTiles(position, value) {
        const key = `${position.row}-${position.col}`;
        const tileData = this.tiles.get(key);
        
        if (tileData) {
            const tile = tileData.element;
            
            // 更新方块值和样式
            tile.textContent = value;
            tile.className = `tile tile-${value} tile-position-${position.row}-${position.col}`;
            
            if (value > 2048) {
                tile.classList.add('tile-super');
            }
            
            // 添加合并动画
            tile.classList.add('tile-merged');
            
            // 移除动画类
            setTimeout(() => {
                tile.classList.remove('tile-merged');
            }, 200);
            
            // 更新存储的值
            this.tiles.set(key, { ...tileData, value });
        }
    }

    // 移除方块
    removeTile(row, col) {
        const key = `${row}-${col}`;
        const tileData = this.tiles.get(key);
        
        if (tileData) {
            this.tileContainer.removeChild(tileData.element);
            this.tiles.delete(key);
        }
    }

    // 清除所有方块
    clearAllTiles() {
        this.tileContainer.innerHTML = '';
        this.tiles.clear();
    }

    // 更新分数显示
    updateScore(scoreData) {
        if (this.scoreElement) {
            this.scoreElement.textContent = scoreData.score;
            
            // 添加分数增加动画
            this.scoreElement.classList.add('score-animation');
            setTimeout(() => {
                this.scoreElement.classList.remove('score-animation');
            }, 300);
        }
        
        if (this.bestScoreElement && scoreData.bestScore !== undefined) {
            this.bestScoreElement.textContent = scoreData.bestScore;
        }
    }

    // 显示游戏消息（获胜/失败）
    showMessage(type, data) {
        if (!this.gameMessageContainer) return;
        
        const messageText = this.gameMessageContainer.querySelector('.message-text');
        const tryAgainBtn = this.gameMessageContainer.querySelector('#try-again-btn');
        
        let message = '';
        let showContinueOption = false;
        
        switch (type) {
            case 'gameWon':
                message = `恭喜！你达到了2048！<br>分数：${data.score}`;
                showContinueOption = true;
                break;
            case 'gameOver':
                message = `游戏结束！<br>最终分数：${data.score}<br>最高分：${data.bestScore}`;
                break;
            default:
                message = '游戏结束！';
        }
        
        messageText.innerHTML = message;
        
        // 如果是获胜，添加继续游戏选项
        if (showContinueOption) {
            const messageButtons = this.gameMessageContainer.querySelector('.message-buttons');
            messageButtons.innerHTML = `
                <button class="btn" id="continue-btn">继续游戏</button>
                <button class="btn" id="try-again-btn">重新开始</button>
            `;
        } else {
            tryAgainBtn.textContent = '重新开始';
        }
        
        this.gameMessageContainer.classList.add('visible');
    }

    // 隐藏游戏消息
    hideMessage() {
        if (this.gameMessageContainer) {
            this.gameMessageContainer.classList.remove('visible');
        }
    }

    // 更新按钮状态
    updateButtonStates(undoAvailable, redoAvailable, isAutoPlay) {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        const autoPlayBtn = document.getElementById('auto-play-btn');
        
        if (undoBtn) {
            undoBtn.disabled = !undoAvailable;
        }
        
        if (redoBtn) {
            redoBtn.disabled = !redoAvailable;
        }
        
        if (autoPlayBtn) {
            if (isAutoPlay) {
                autoPlayBtn.textContent = '停止自动';
                autoPlayBtn.classList.add('auto-playing');
            } else {
                autoPlayBtn.textContent = '自动游戏';
                autoPlayBtn.classList.remove('auto-playing');
            }
        }
    }

    // 显示移动动画效果
    animateTileMovement(movements) {
        movements.forEach(movement => {
            this.moveTile(movement.from, movement.to, movement.value);
        });
    }

    // 显示合并动画效果
    animateTileMerges(merges) {
        merges.forEach(merge => {
            const position = {
                row: merge.row !== undefined ? merge.row : merge.col,
                col: merge.col !== undefined ? merge.col : merge.row
            };
            
            // 延迟执行合并动画，让移动动画先完成
            setTimeout(() => {
                this.mergeTiles(position, merge.value);
            }, 150);
        });
    }

    // 获取方块元素（用于自定义动画）
    getTileElement(row, col) {
        const key = `${row}-${col}`;
        const tileData = this.tiles.get(key);
        return tileData ? tileData.element : null;
    }

    // 添加CSS类到方块
    addTileClass(row, col, className) {
        const tile = this.getTileElement(row, col);
        if (tile) {
            tile.classList.add(className);
        }
    }

    // 移除CSS类从方块
    removeTileClass(row, col, className) {
        const tile = this.getTileElement(row, col);
        if (tile) {
            tile.classList.remove(className);
        }
    }

    // 显示加载状态
    showLoading() {
        // 可以在这里添加加载动画
        console.log('Loading...');
    }

    // 隐藏加载状态
    hideLoading() {
        // 隐藏加载动画
        console.log('Loading complete');
    }

    // 重置UI状态
    resetUI() {
        this.clearAllTiles();
        this.hideMessage();
        this.updateScore({ score: 0, bestScore: 0 });
        this.updateButtonStates(false, false, false);
    }

    // 添加分数动画效果的CSS
    addScoreAnimation() {
        if (!document.getElementById('score-animation-style')) {
            const style = document.createElement('style');
            style.id = 'score-animation-style';
            style.textContent = `
                .score-animation {
                    animation: scoreIncrease 0.3s ease-out;
                }
                
                @keyframes scoreIncrease {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                .auto-playing {
                    background-color: #f67c5f !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 动画样式将在UIRenderer初始化时自动添加 