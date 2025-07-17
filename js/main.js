// 2048游戏主文件 - 集成所有组件
class Game2048 {
    constructor() {
        this.gameEngine = null;
        this.uiRenderer = null;
        this.inputController = null;
        this.animationSystem = null;
        this.historyManager = null;
        this.aiEngine = null;
        
        this.isInitialized = false;
    }

    // 初始化游戏
    initialize() {
        try {
            // 创建核心组件实例
            this.gameEngine = new GameEngine();
            this.uiRenderer = new UIRenderer();
            this.animationSystem = new AnimationSystem();
            this.historyManager = new HistoryManager();
            this.aiEngine = new AIEngine();
            
            // 创建输入控制器（需要游戏引擎和UI渲染器）
            this.inputController = new InputController(this.gameEngine, this.uiRenderer);
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 初始化游戏状态
            this.gameEngine.initialize();
            
            // 初始化输入控制器
            this.inputController.initialize();
            
            this.isInitialized = true;
            console.log('2048游戏初始化完成！');
            
            // 显示欢迎信息
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('游戏初始化失败：', error);
            this.showErrorMessage('游戏初始化失败，请刷新页面重试。');
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 监听分数更新
        this.gameEngine.addEventListener('scoreUpdate', (data) => {
            this.uiRenderer.updateScore(data);
        });

        // 监听棋盘更新
        this.gameEngine.addEventListener('boardUpdate', (board) => {
            this.uiRenderer.renderBoard(board);
        });

        // 监听新方块添加
        this.gameEngine.addEventListener('tileAdded', (tileData) => {
            this.uiRenderer.addTile(tileData);
        });

        // 监听游戏获胜
        this.gameEngine.addEventListener('gameWon', (data) => {
            this.uiRenderer.showMessage('gameWon', data);
        });

        // 监听游戏结束
        this.gameEngine.addEventListener('gameOver', (data) => {
            this.uiRenderer.showMessage('gameOver', data);
            this.inputController.onGameStateChange({ gameOver: true });
        });

        // 监听页面可见性变化（用于暂停/恢复游戏）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameEngine.isAutoPlaying()) {
                // 页面隐藏时暂停自动游戏
                this.gameEngine.stopAutoPlay();
                this.inputController.updateUIState();
            }
        });

        // 监听窗口大小变化（响应式设计）
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // 显示欢迎信息
    showWelcomeMessage() {
        console.log(`
╔══════════════════════════════════════╗
║              欢迎来到 2048            ║
╠══════════════════════════════════════╣
║  使用方向键移动方块                   ║
║  相同数字的方块会合并                 ║
║  目标：创造 2048 方块！              ║
║                                      ║
║  快捷键：                            ║
║  R - 重新开始                        ║
║  空格 - 自动游戏                     ║
║  ESC - 停止自动游戏                  ║
╚══════════════════════════════════════╝
        `);
    }

    // 处理窗口大小变化
    handleResize() {
        // 可以在这里添加响应式逻辑
        // 目前CSS已经处理了响应式，这里预留给未来需求
    }

    // 显示错误信息
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 5px;
            z-index: 1000;
            text-align: center;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // 5秒后自动移除错误信息
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // 重新开始游戏
    restart() {
        if (this.isInitialized) {
            this.gameEngine.restart();
            this.inputController.updateUIState();
        }
    }

    // 获取游戏状态
    getGameState() {
        if (this.isInitialized) {
            return this.gameEngine.getGameState();
        }
        return null;
    }

    // 获取统计信息
    getGameStats() {
        if (!this.isInitialized) {
            return null;
        }

        const state = this.gameEngine.getGameState();
        return {
            score: state.score,
            bestScore: state.bestScore,
            maxTile: state.maxTile,
            emptyTiles: this.gameEngine.getEmptyTileCount(),
            gameOver: state.gameOver,
            hasWon: state.hasWon,
            isAutoPlay: state.isAutoPlay
        };
    }

    // 暂停/恢复游戏
    togglePause() {
        if (this.gameEngine.isAutoPlaying()) {
            this.gameEngine.stopAutoPlay();
        }
        // 手动游戏没有暂停功能，只有自动游戏可以暂停
    }

    // 销毁游戏实例
    destroy() {
        if (this.inputController) {
            this.inputController.destroy();
        }
        
        if (this.gameEngine && this.gameEngine.isAutoPlaying()) {
            this.gameEngine.stopAutoPlay();
        }
        
        this.isInitialized = false;
        console.log('游戏已销毁');
    }
}

// 全局游戏实例
let game2048 = null;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建并初始化游戏
    game2048 = new Game2048();
    game2048.initialize();
    
    // 将游戏实例暴露到全局，便于调试
    if (window.location.hash === '#debug') {
        window.game2048 = game2048;
        console.log('调试模式已启用，游戏实例可通过 window.game2048 访问');
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (game2048) {
        game2048.destroy();
    }
});

// 为了开发和调试方便，暴露一些工具函数
if (window.location.hash === '#debug') {
    window.gameUtils = {
        restart: () => game2048?.restart(),
        getStats: () => game2048?.getGameStats(),
        getState: () => game2048?.getGameState(),
        toggleAutoPlay: () => game2048?.inputController?.toggleAutoPlay()
    };
} 