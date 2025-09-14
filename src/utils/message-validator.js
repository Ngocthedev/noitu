/**
 * Message Validator - Validates user input messages
 * Implements Single Responsibility Principle
 */
class MessageValidator {
    /**
     * Validate game input message
     */
    validateGameInput(content) {
        const result = {
            isValid: false,
            wordPair: null,
            error: null
        };

        // Clean and normalize input
        const cleanContent = this.normalizeVietnamese(content.trim());
        
        if (!cleanContent) {
            result.error = '❌ Tin nhắn trống!';
            return result;
        }

        // Split into words
        const words = cleanContent.split(/\s+/);
        
        // Check if exactly 2 words
        if (words.length !== 2) {
            result.error = 'Bạn chỉ có thể chọn một cụm từ gồm **2 từ**!';
            return result;
        }

        // Validate each word is not empty
        if (!words[0] || !words[1]) {
            result.error = '❌ Cả hai từ phải có nội dung!';
            return result;
        }

        // Check for minimum word length
        if (words[0].length < 2 || words[1].length < 2) {
            result.error = '❌ Mỗi từ phải có ít nhất 2 ký tự!';
            return result;
        }

        result.isValid = true;
        result.wordPair = words.join(' ');
        return result;
    }

    /**
     * Normalize Vietnamese text
     */
    normalizeVietnamese(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .toLowerCase();
    }

    /**
     * Validate command arguments
     */
    validateCommandArgs(command, args, requiredArgs) {
        const result = {
            isValid: false,
            error: null
        };

        if (args.length < requiredArgs) {
            result.error = `❌ Lệnh /${command} cần ${requiredArgs} tham số!`;
            return result;
        }

        result.isValid = true;
        return result;
    }

    /**
     * Validate user mention
     */
    validateUserMention(mention) {
        const result = {
            isValid: false,
            userId: null,
            error: null
        };

        const userMatch = mention.match(/^<@!?(\d+)>$/);
        if (!userMatch) {
            result.error = '❌ Phải mention (@) một user hợp lệ!';
            return result;
        }

        result.isValid = true;
        result.userId = userMatch[1];
        return result;
    }

    /**
     * Validate channel mention
     */
    validateChannelMention(mention) {
        const result = {
            isValid: false,
            channelId: null,
            error: null
        };

        // Support both "channel:#name" and direct "#name" formats
        const channelMatch = mention.match(/^channel:<#(\d+)>$/) || 
                           mention.match(/^<#(\d+)>$/);
        
        if (!channelMatch) {
            result.error = '❌ Phải mention (#) một kênh hợp lệ!';
            return result;
        }

        result.isValid = true;
        result.channelId = channelMatch[1];
        return result;
    }

    /**
     * Validate positive integer
     */
    validatePositiveInteger(value, fieldName = 'Giá trị') {
        const result = {
            isValid: false,
            number: null,
            error: null
        };

        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
            result.error = `❌ ${fieldName} phải là số nguyên dương!`;
            return result;
        }

        result.isValid = true;
        result.number = num;
        return result;
    }

    /**
     * Validate non-negative integer
     */
    validateNonNegativeInteger(value, fieldName = 'Giá trị') {
        const result = {
            isValid: false,
            number: null,
            error: null
        };

        const num = parseInt(value);
        if (isNaN(num) || num < 0) {
            result.error = `❌ ${fieldName} phải là số nguyên không âm!`;
            return result;
        }

        result.isValid = true;
        result.number = num;
        return result;
    }
}

module.exports = MessageValidator;