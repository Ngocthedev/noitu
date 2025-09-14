const fs = require('fs-extra');
const path = require('path');

/**
 * Dictionary Service - Handles dictionary loading and word validation
 * Implements Single Responsibility Principle
 */
class DictionaryService {
    constructor() {
        this.dictionary = new Set(); // Use Set for O(1) lookup
        this.dictionaryPath = path.join(process.cwd(), 'tudien');
        this.isLoaded = false;
    }

    /**
     * Load dictionary from tudien folder
     * Filters only 2-word phrases
     */
    async loadDictionary() {
        try {
            console.log('📚 Đang tải từ điển...');
            
            if (!await fs.pathExists(this.dictionaryPath)) {
                console.warn('⚠️ Thư mục tudien không tồn tại, tạo mới...');
                await fs.ensureDir(this.dictionaryPath);
                await this.createSampleDictionary();
            }

            const files = await fs.readdir(this.dictionaryPath);
            const txtFiles = files.filter(file => file.endsWith('.txt'));

            if (txtFiles.length === 0) {
                console.warn('⚠️ Không tìm thấy file từ điển, tạo file mẫu...');
                await this.createSampleDictionary();
                txtFiles.push('vietdict.txt');
            }

            let totalWords = 0;
            for (const file of txtFiles) {
                const filePath = path.join(this.dictionaryPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
                
                for (const line of lines) {
                    const words = this.normalizeVietnamese(line).split(/\s+/);
                    if (words.length === 2) {
                        this.dictionary.add(line.toLowerCase());
                        totalWords++;
                    }
                }
            }

            this.isLoaded = true;
            console.log(`✅ Đã tải ${totalWords} cụm từ từ ${txtFiles.length} file(s)`);
        } catch (error) {
            console.error('❌ Lỗi khi tải từ điển:', error);
            throw error;
        }
    }

    /**
     * Create a sample dictionary file if none exists
     */
    async createSampleDictionary() {
        const sampleWords = [
            'xanh lá', 'lá cây', 'cây cao', 'cao ráo', 'ráo riết',
            'riết mình', 'mình tôi', 'tôi đây', 'đây rồi', 'rồi sao',
            'sao đây', 'đây đó', 'đó đây', 'đây kìa', 'kìa này',
            'này nọ', 'nọ kia', 'kia này', 'này rồi', 'rồi nhé',
            'nhé anh', 'anh ơi', 'ơi là', 'là gì', 'gì đây',
            'đây mà', 'mà sao', 'sao vậy', 'vậy à', 'à ủa',
            'ủa gì', 'gì vậy', 'vậy thôi', 'thôi được', 'được rồi',
            'lung linh', 'linh tinh', 'tinh nghịch', 'nghịch ngợm', 'ngợm tính',
            'tính toán', 'toán học', 'học hành', 'hành động', 'động lực',
            'lực lượng', 'lượng từ', 'từ ngữ', 'ngữ pháp', 'pháp luật'
        ];

        const filePath = path.join(this.dictionaryPath, 'vietdict.txt');
        await fs.writeFile(filePath, sampleWords.join('\n'), 'utf-8');
        console.log('✅ Đã tạo file từ điển mẫu');
    }

    /**
     * Normalize Vietnamese text for better matching
     */
    normalizeVietnamese(text) {
        return text.trim().replace(/\s+/g, ' ');
    }

    /**
     * Check if a word pair exists in dictionary
     */
    isValidWordPair(wordPair) {
        if (!this.isLoaded) {
            throw new Error('Dictionary not loaded yet');
        }
        return this.dictionary.has(wordPair.toLowerCase());
    }

    /**
     * Get all word pairs that start with a specific word
     */
    getWordPairsStartingWith(word) {
        if (!this.isLoaded) return [];
        
        const results = [];
        const searchTerm = word.toLowerCase();
        
        for (const wordPair of this.dictionary) {
            const words = wordPair.split(' ');
            if (words[0] === searchTerm) {
                results.push(wordPair);
            }
        }
        
        return results;
    }

    /**
     * Get a random word pair from dictionary
     */
    getRandomWordPair() {
        if (!this.isLoaded || this.dictionary.size === 0) {
            throw new Error('Dictionary not available');
        }
        
        const wordPairs = Array.from(this.dictionary);
        const randomIndex = Math.floor(Math.random() * wordPairs.length);
        return wordPairs[randomIndex];
    }

    /**
     * Get dictionary size
     */
    getDictionarySize() {
        return this.dictionary.size;
    }
}

module.exports = DictionaryService;