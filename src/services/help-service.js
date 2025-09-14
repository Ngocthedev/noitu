const fs = require('fs-extra');
const path = require('path');

/**
 * Help Service - Manages user help requests and daily limits
 * Implements Single Responsibility Principle
 */
class HelpService {
    constructor() {
        this.dataPath = path.join(process.cwd(), 'src/data');
        this.helpDataFile = path.join(this.dataPath, 'help-data.json');
        this.maxHelpPerDay = 5;
        this.helpData = {};
        this.loadHelpData();
    }

    /**
     * Load help data from file
     */
    async loadHelpData() {
        try {
            await fs.ensureDir(this.dataPath);
            
            if (await fs.pathExists(this.helpDataFile)) {
                this.helpData = await fs.readJson(this.helpDataFile);
            } else {
                this.helpData = {};
                await this.saveHelpData();
            }
        } catch (error) {
            console.error('Error loading help data:', error);
            this.helpData = {};
        }
    }

    /**
     * Save help data to file
     */
    async saveHelpData() {
        try {
            await fs.writeJson(this.helpDataFile, this.helpData, { spaces: 2 });
        } catch (error) {
            console.error('Error saving help data:', error);
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
     * Initialize user help data for current date
     */
    initializeUserData(userId) {
        const dateString = this.getCurrentDateString();
        
        if (!this.helpData[userId]) {
            this.helpData[userId] = {};
        }
        
        if (!this.helpData[userId][dateString]) {
            this.helpData[userId][dateString] = {
                helpUsed: 0,
                maxHelp: this.maxHelpPerDay
            };
        }
    }

    /**
     * Check if user can use help
     */
    canUseHelp(userId) {
        this.initializeUserData(userId);
        const dateString = this.getCurrentDateString();
        const userData = this.helpData[userId][dateString];
        
        return userData.helpUsed < userData.maxHelp;
    }

    /**
     * Use one help for a user
     */
    async useHelp(userId) {
        if (!this.canUseHelp(userId)) {
            return false;
        }

        this.initializeUserData(userId);
        const dateString = this.getCurrentDateString();
        this.helpData[userId][dateString].helpUsed++;
        
        await this.saveHelpData();
        return true;
    }

    /**
     * Get remaining help count for user
     */
    getRemainingHelp(userId) {
        this.initializeUserData(userId);
        const dateString = this.getCurrentDateString();
        const userData = this.helpData[userId][dateString];
        
        return {
            remaining: userData.maxHelp - userData.helpUsed,
            total: userData.maxHelp
        };
    }

    /**
     * Give additional help to a user
     */
    async giveHelp(userId, amount) {
        this.initializeUserData(userId);
        const dateString = this.getCurrentDateString();
        this.helpData[userId][dateString].maxHelp += amount;
        
        await this.saveHelpData();
    }

    /**
     * Set maximum help per day
     */
    async setMaxHelpPerDay(maxHelp) {
        this.maxHelpPerDay = maxHelp;
        await this.saveHelpData();
    }

    /**
     * Reset daily help counters (called at midnight)
     */
    async resetDailyHelp() {
        // We don't need to do anything here since we use date-based keys
        // Old data will naturally become irrelevant
        console.log('Daily help reset completed');
    }

    /**
     * Get help statistics
     */
    getHelpStats() {
        const dateString = this.getCurrentDateString();
        const stats = {
            totalUsersToday: 0,
            totalHelpUsedToday: 0,
            mostActiveUser: null,
            mostHelpUsed: 0
        };

        for (const userId in this.helpData) {
            if (this.helpData[userId][dateString]) {
                stats.totalUsersToday++;
                const helpUsed = this.helpData[userId][dateString].helpUsed;
                stats.totalHelpUsedToday += helpUsed;
                
                if (helpUsed > stats.mostHelpUsed) {
                    stats.mostHelpUsed = helpUsed;
                    stats.mostActiveUser = userId;
                }
            }
        }

        return stats;
    }
}

module.exports = HelpService;