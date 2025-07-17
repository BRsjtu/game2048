class InputController {
    constructor(gameEngine, uiRenderer) {
        this.gameEngine = gameEngine;
        this.uiRenderer = uiRenderer;
        this.inputEnabled = true;
        this.keyPressTimeout = null;
        
        this.bindEvents();
    }

    // 绑定所有事件监听器
    bindEvents() {
        this.bindKeyboardEvents();
        this.bindButtonEvents();
        this.bindGameMessageEvents();
    }

    // 绑定键盘事件
    bindKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            if (!this.inputEnabled) {
                return;
            }

            // 防止快速连续按键
            if (this.keyPressTimeout) {
                return;
            }

            let direction = null;
            
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    direction = 'right';
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    direction = 'down';
                    break;
                case 'KeyR':
                    // R键重新开始
                    this.restartGame();
                    event.preventDefault();
                    return;
                case 'KeyZ':
                    // Ctrl+Z撤销
                    if (event.ctrlKey || event.metaKey) {
                        this.handleUndo();
                        event.preventDefault();
                        return;
                    }
                    break;
                case 'KeyY':
                    // Ctrl+Y重做
                    if (event.ctrlKey || event.metaKey) {
                        this.handleRedo();
                        event.preventDefault();
                        return;
                    }
                    break;
                case 'Space':
                    // 空格键切换自动游戏
                    this.toggleAutoPlay();
                    event.preventDefault();
                    return;
                case 'Escape':
                    // ESC键停止自动游戏
                    if (this.gameEngine.isAutoPlaying()) {
                        this.gameEngine.stopAutoPlay();
                        this.updateUIState();
                    }
                    event.preventDefault();
                    return;
            }

            if (direction) {
                event.preventDefault();
                this.handleMove(direction);
                
                // 设置防抖动超时
                this.keyPressTimeout = setTimeout(() => {
                    this.keyPressTimeout = null;
                }, 100);
            }
        });

        // 防止方向键滚动页面
        document.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
        });
    }

    // 绑定按钮事件
    bindButtonEvents() {
        // 重新开始按钮
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        // 撤销按钮
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.handleUndo();
            });
        }

        // 重做按钮
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.handleRedo();
            });
        }

        // 自动游戏按钮
        const autoPlayBtn = document.getElementById('auto-play-btn');
        if (autoPlayBtn) {
            autoPlayBtn.addEventListener('click', () => {
                this.toggleAutoPlay();
            });
        }
    }

    // 绑定游戏消息事件
    bindGameMessageEvents() {
        // 使用事件委托处理动态创建的按钮
        const gameMessageContainer = document.getElementById('game-message');
        if (gameMessageContainer) {
            gameMessageContainer.addEventListener('click', (event) => {
                if (event.target.id === 'try-again-btn') {
                    this.restartGame();
                    this.uiRenderer.hideMessage();
                } else if (event.target.id === 'continue-btn') {
                    this.gameEngine.continueGame();
                    this.uiRenderer.hideMessage();
                }
            });
        }
    }

    // 处理移动操作
    handleMove(direction) {
        if (!this.inputEnabled || this.gameEngine.isGameOver()) {
            return;
        }

        // 临时禁用输入，防止动画期间的重复输入
        this.disableInput();
        
        const result = this.gameEngine.makeMove(direction);
        
        if (result.success) {
            // 简化处理：直接重新渲染，不使用复杂的移动动画
            // 动画完成后重新启用输入
            setTimeout(() => {
                this.enableInput();
            }, 150);
        } else {
            // 如果移动失败，立即重新启用输入
            this.enableInput();
        }
        
        this.updateUIState();
    }

    // 处理撤销操作
    handleUndo() {
        if (!this.inputEnabled) {
            return;
        }

        // 这里需要HistoryManager的支持，暂时留空
        // 在Phase 3中会实现
        console.log('Undo functionality will be implemented in Phase 3');
        this.updateUIState();
    }

    // 处理重做操作
    handleRedo() {
        if (!this.inputEnabled) {
            return;
        }

        // 这里需要HistoryManager的支持，暂时留空
        // 在Phase 3中会实现
        console.log('Redo functionality will be implemented in Phase 3');
        this.updateUIState();
    }

    // 切换自动游戏
    toggleAutoPlay() {
        if (this.gameEngine.isGameOver()) {
            return;
        }

        if (this.gameEngine.isAutoPlaying()) {
            this.gameEngine.stopAutoPlay();
        } else {
            this.gameEngine.startAutoPlay();
        }
        
        this.updateUIState();
    }

    // 重新开始游戏
    restartGame() {
        this.gameEngine.restart();
        this.updateUIState();
    }

    // 启用输入
    enableInput() {
        this.inputEnabled = true;
    }

    // 禁用输入
    disableInput() {
        this.inputEnabled = false;
    }

    // 检查输入是否启用
    isInputEnabled() {
        return this.inputEnabled;
    }

    // 更新UI状态
    updateUIState() {
        // 更新按钮状态（撤销/重做按钮在Phase 3中实现）
        this.uiRenderer.updateButtonStates(
            false, // 撤销可用性，Phase 3中实现
            false, // 重做可用性，Phase 3中实现
            this.gameEngine.isAutoPlaying()
        );
    }

    // 处理游戏状态变化
    onGameStateChange(gameState) {
        if (gameState.gameOver) {
            this.disableInput();
        } else {
            this.enableInput();
        }
        
        this.updateUIState();
    }

    // 处理触摸事件（移动端支持）
    bindTouchEvents() {
        let touchStartX = null;
        let touchStartY = null;
        const minSwipeDistance = 30;

        document.addEventListener('touchstart', (event) => {
            if (!this.inputEnabled) {
                return;
            }
            
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        document.addEventListener('touchmove', (event) => {
            // 防止页面滚动
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (event) => {
            if (!this.inputEnabled || touchStartX === null || touchStartY === null) {
                return;
            }

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) {
                return;
            }

            let direction = null;
            
            if (absDeltaX > absDeltaY) {
                // 水平滑动
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                // 垂直滑动
                direction = deltaY > 0 ? 'down' : 'up';
            }

            if (direction) {
                this.handleMove(direction);
            }

            touchStartX = null;
            touchStartY = null;
        });
    }

    // 显示键盘提示
    showKeyboardHints() {
        const hints = [
            '使用方向键或WASD移动方块',
            'R键：重新开始游戏',
            'Ctrl+Z：撤销操作',
            'Ctrl+Y：重做操作',
            '空格键：切换自动游戏',
            'ESC键：停止自动游戏'
        ];
        
        console.log('键盘操作提示：');
        hints.forEach(hint => console.log(`- ${hint}`));
    }

    // 初始化输入控制器
    initialize() {
        this.enableInput();
        this.bindTouchEvents(); // 添加触摸支持
        this.updateUIState();
        
        // 显示键盘提示（可选）
        if (window.location.hash === '#debug') {
            this.showKeyboardHints();
        }
    }

    // 销毁输入控制器
    destroy() {
        this.disableInput();
        // 移除事件监听器
        document.removeEventListener('keydown', this.handleKeydown);
        
        if (this.keyPressTimeout) {
            clearTimeout(this.keyPressTimeout);
            this.keyPressTimeout = null;
        }
    }
} 