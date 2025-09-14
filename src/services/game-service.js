/**
 * Game Service - Manages game state and logic per guild
 * Implements Open/Closed Principle - extensible for new game modes
 * Now supports multiple guilds with separate game states
 */
class GameService {
    constructor(dictionaryService) {
        this.dictionaryService = dictionaryService;
        // Map to store game state for each guild (server)
        this.guildGameStates = new Map();
        this.playerCooldowns = new Map(); // Keep global cooldowns for simplicity
    }

    /**
     * Get or create game state for a specific guild
     */
    getOrCreateGameState(guildId) {
        if (!this.guildGameStates.has(guildId)) {
            this.guildGameStates.set(guildId, {
                currentWord: null,
                lastPlayer: null,
                usedWordPairs: new Set(),
                gameChannelId: null,
                checkDuplicates: true,
                cooldownTime: 3 // seconds
            });
        }
        return this.guildGameStates.get(guildId);
    }

    /**
     * Start a new game with a random word pair for a specific guild
     */
    startNewGame(guildId) {
        try {
            const gameState = this.getOrCreateGameState(guildId);
            const randomWordPair = this.dictionaryService.getRandomWordPair();
            const words = randomWordPair.split(' ');
            
            gameState.currentWord = words[1]; // Second word becomes the starting word
            gameState.lastPlayer = null;
            gameState.usedWordPairs.clear();
            gameState.usedWordPairs.add(randomWordPair.toLowerCase());
            
            console.log(`🎯 Ván mới bắt đầu tại guild ${guildId} với: "${randomWordPair}"`);
            return randomWordPair;
        } catch (error) {
            console.error('Error starting new game:', error);
            throw error;
        }
    }

    /**
     * Process a word chain attempt for a specific guild
     */
    async processWordChain(wordPair, playerId, guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        const result = {
            isValid: false,
            error: null,
            shouldRestart: false
        };

        // Check if player is trying to chain themselves
        if (gameState.lastPlayer === playerId) {
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
        if (!gameState.currentWord || firstWord !== gameState.currentWord.toLowerCase()) {
            result.error = `❌ Từ đầu tiên phải là "${gameState.currentWord}"!`;
            return result;
        }

        // Check for duplicates if enabled
        if (gameState.checkDuplicates && gameState.usedWordPairs.has(wordPair.toLowerCase())) {
            result.error = '❌ Cụm từ này đã được sử dụng trong ván này!';
            return result;
        }

        // Valid move
        gameState.currentWord = words[1];
        gameState.lastPlayer = playerId;
        gameState.usedWordPairs.add(wordPair.toLowerCase());
        this.setPlayerCooldown(playerId);

        // Check if there are any possible next moves
        const possibleMoves = this.dictionaryService.getWordPairsStartingWith(gameState.currentWord);
        const availableMoves = gameState.checkDuplicates 
            ? possibleMoves.filter(move => !gameState.usedWordPairs.has(move.toLowerCase()))
            : possibleMoves;

        if (availableMoves.length === 0) {
            result.shouldRestart = true;
        }

        result.isValid = true;
        return result;
    }

    /**
     * Get a hint for the current word in a specific guild
     */
    getHint(guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        
        if (!gameState.currentWord) {
            return null;
        }

        const possibleMoves = this.dictionaryService.getWordPairsStartingWith(gameState.currentWord);
        const availableMoves = gameState.checkDuplicates 
            ? possibleMoves.filter(move => !gameState.usedWordPairs.has(move.toLowerCase()))
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
        // Use global cooldown map for simplicity across all guilds
        const gameState = this.guildGameStates.values().next().value || { cooldownTime: 3 };
        this.playerCooldowns.set(playerId, Date.now() + (gameState.cooldownTime * 1000));
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
     * Get current game state for a specific guild
     */
    getCurrentWord(guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        return gameState.currentWord;
    }

    /**
     * Set game channel for a specific guild
     */
    setGameChannelId(channelId, guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        gameState.gameChannelId = channelId;
    }

    /**
     * Get game channel ID for a specific guild
     */
    getGameChannelId(guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        return gameState.gameChannelId;
    }

    /**
     * Reset game history for a specific guild
     */
    resetHistory(guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        gameState.usedWordPairs.clear();
        gameState.lastPlayer = null;
    }

    /**
     * Toggle duplicate checking for a specific guild
     */
    toggleDuplicateCheck(enabled, guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        gameState.checkDuplicates = enabled;
    }

    /**
     * Set cooldown time for a specific guild
     */
    setCooldownTime(seconds, guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        gameState.cooldownTime = Math.max(0, seconds);
    }

    /**
     * Get game statistics for a specific guild
     */
    getGameStats(guildId) {
        const gameState = this.getOrCreateGameState(guildId);
        return {
            currentWord: gameState.currentWord,
            usedWordPairsCount: gameState.usedWordPairs.size,
            dictionarySize: this.dictionaryService.getDictionarySize(),
            checkDuplicates: gameState.checkDuplicates,
            cooldownTime: gameState.cooldownTime
        };
    }

    /**
     * Get total number of active guilds
     */
    getActiveGuildsCount() {
        return this.guildGameStates.size;
    }
}

module.exports = GameService;