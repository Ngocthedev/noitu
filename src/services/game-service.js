/**
 * Game Service - Manages game state and logic
 * Implements Open/Closed Principle - extensible for new game modes
 */
class GameService {
    constructor(dictionaryService) {
        this.dictionaryService = dictionaryService;
        this.gameState = {
            currentWord: null,
            lastPlayer: null,
            usedWordPairs: new Set(),
            gameChannelId: null,
            checkDuplicates: true,
            cooldownTime: 3 // seconds
        };
        this.playerCooldowns = new Map();
    }

    /**
     * Start a new game with a random word pair
     */
    startNewGame() {
        try {
            const randomWordPair = this.dictionaryService.getRandomWordPair();
            const words = randomWordPair.split(' ');
            
            this.gameState.currentWord = words[1]; // Second word becomes the starting word
            this.gameState.lastPlayer = null;
            this.gameState.usedWordPairs.clear();
            this.gameState.usedWordPairs.add(randomWordPair.toLowerCase());
            
            console.log(`🎯 Ván mới bắt đầu với: "${randomWordPair}"`);
            return randomWordPair;
        } catch (error) {
            console.error('Error starting new game:', error);
            throw error;
        }
    }

    /**
     * Process a word chain attempt
     */
    async processWordChain(wordPair, playerId) {
        const result = {
            isValid: false,
            error: null,
            shouldRestart: false
        };

        // Check if player is trying to chain themselves
        if (this.gameState.lastPlayer === playerId) {
            result.error = '❌ Bạn không thể nối chính mình, hãy để người khác nối tiếp!';
            return result;
        }

        // Validate word pair exists in dictionary
        if (!this.dictionaryService.isValidWordPair(wordPair)) {
            result.error = '❌ Cụm từ không có trong từ điển!';
            return result;
        }

        const words = wordPair.toLowerCase().split(' ');
        const firstWord = words[0];

        // Check if first word matches current word
        if (!this.gameState.currentWord || firstWord !== this.gameState.currentWord.toLowerCase()) {
            result.error = `❌ Từ đầu tiên phải là "${this.gameState.currentWord}"!`;
            return result;
        }

        // Check for duplicates if enabled
        if (this.gameState.checkDuplicates && this.gameState.usedWordPairs.has(wordPair.toLowerCase())) {
            result.error = '❌ Cụm từ này đã được sử dụng trong ván này!';
            return result;
        }

        // Valid move
        this.gameState.currentWord = words[1];
        this.gameState.lastPlayer = playerId;
        this.gameState.usedWordPairs.add(wordPair.toLowerCase());
        this.setPlayerCooldown(playerId);

        // Check if there are any possible next moves
        const possibleMoves = this.dictionaryService.getWordPairsStartingWith(this.gameState.currentWord);
        const availableMoves = this.gameState.checkDuplicates 
            ? possibleMoves.filter(move => !this.gameState.usedWordPairs.has(move.toLowerCase()))
            : possibleMoves;

        if (availableMoves.length === 0) {
            result.shouldRestart = true;
        }

        result.isValid = true;
        return result;
    }

    /**
     * Get a hint for the current word
     */
    getHint() {
        if (!this.gameState.currentWord) {
            return null;
        }

        const possibleMoves = this.dictionaryService.getWordPairsStartingWith(this.gameState.currentWord);
        const availableMoves = this.gameState.checkDuplicates 
            ? possibleMoves.filter(move => !this.gameState.usedWordPairs.has(move.toLowerCase()))
            : possibleMoves;

        if (availableMoves.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }

    /**
     * Set cooldown for a player
     */
    setPlayerCooldown(playerId) {
        this.playerCooldowns.set(playerId, Date.now() + (this.gameState.cooldownTime * 1000));
    }

    /**
     * Check if a player is on cooldown
     */
    isUserOnCooldown(playerId) {
        const cooldownEnd = this.playerCooldowns.get(playerId);
        if (!cooldownEnd) return false;
        
        if (Date.now() < cooldownEnd) {
            return true;
        } else {
            this.playerCooldowns.delete(playerId);
            return false;
        }
    }

    /**
     * Get current game state
     */
    getCurrentWord() {
        return this.gameState.currentWord;
    }

    /**
     * Set game channel
     */
    setGameChannelId(channelId) {
        this.gameState.gameChannelId = channelId;
    }

    /**
     * Get game channel ID
     */
    getGameChannelId() {
        return this.gameState.gameChannelId;
    }

    /**
     * Reset game history
     */
    resetHistory() {
        this.gameState.usedWordPairs.clear();
        this.gameState.lastPlayer = null;
    }

    /**
     * Toggle duplicate checking
     */
    toggleDuplicateCheck(enabled) {
        this.gameState.checkDuplicates = enabled;
    }

    /**
     * Set cooldown time
     */
    setCooldownTime(seconds) {
        this.gameState.cooldownTime = Math.max(0, seconds);
    }

    /**
     * Get game statistics
     */
    getGameStats() {
        return {
            currentWord: this.gameState.currentWord,
            usedWordPairsCount: this.gameState.usedWordPairs.size,
            dictionarySize: this.dictionaryService.getDictionarySize(),
            checkDuplicates: this.gameState.checkDuplicates,
            cooldownTime: this.gameState.cooldownTime
        };
    }
}

module.exports = GameService;