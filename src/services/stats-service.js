const fs = require('fs-extra');
const path = require('path');

/**
 * Stats Service - Manages game statistics and analytics
 * Implements Single Responsibility Principle
 */
class StatsService {
    constructor() {
        this.dataPath = path.join(process.cwd(), 'src/data');
        this.statsFile = path.join(this.dataPath, 'stats.json');
        this.stats = {};
        this.loadStats();
    }

    /**
     * Load statistics from file
     */
    async loadStats() {
        try {
            await fs.ensureDir(this.dataPath);
            
            if (await fs.pathExists(this.statsFile)) {
                this.stats = await fs.readJson(this.statsFile);
            } else {
                this.stats = {
                    dailyWords: {},
                    gameResets: 0,
                    totalGamesPlayed: 0
                };
                await this.saveStats();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = {
                dailyWords: {},
                gameResets: 0,
                totalGamesPlayed: 0
            };
        }
    }

    /**
     * Save statistics to file
     */
    async saveStats() {
        try {
            await fs.writeJson(this.statsFile, this.stats, { spaces: 2 });
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    /**
     * Get current date string for Vietnam timezone
     */
    getCurrentDateString() {
        const now = new Date();
        const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
        return vietnamTime.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    /**
     * Increment daily word count
     */
    async incrementDailyWords() {
        const dateString = this.getCurrentDateString();
        
        if (!this.stats.dailyWords[dateString]) {
            this.stats.dailyWords[dateString] = 0;
        }
        
        this.stats.dailyWords[dateString]++;
        await this.saveStats();
    }

    /**
     * Increment game reset counter
     */
    async incrementGameResets() {
        this.stats.gameResets++;
        await this.saveStats();
    }

    /**
     * Increment total games played
     */
    async incrementGamesPlayed() {
        this.stats.totalGamesPlayed++;
        await this.saveStats();
    }

    /**
     * Get daily statistics
     */
    getDailyStats() {
        const dateString = this.getCurrentDateString();
        return {
            wordsToday: this.stats.dailyWords[dateString] || 0,
            totalGameResets: this.stats.gameResets,
            totalGamesPlayed: this.stats.totalGamesPlayed
        };
    }

    /**
     * Get comprehensive statistics
     */
    getAllStats() {
        const dateString = this.getCurrentDateString();
        const dailyStats = this.getDailyStats();
        
        // Calculate weekly stats
        const weeklyWords = this.getWeeklyWordCount();
        
        return {
            today: dailyStats,
            thisWeek: {
                totalWords: weeklyWords
            },
            allTime: {
                gameResets: this.stats.gameResets,
                gamesPlayed: this.stats.totalGamesPlayed
            }
        };
    }

    /**
     * Get word count for the past 7 days
     */
    getWeeklyWordCount() {
        const now = new Date();
        let total = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000) + (7 * 60 * 60 * 1000)); // UTC+7
            const dateString = date.toISOString().split('T')[0];
            total += this.stats.dailyWords[dateString] || 0;
        }
        
        return total;
    }
}

module.exports = StatsService;