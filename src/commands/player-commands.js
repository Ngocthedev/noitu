/**
 * Player Commands Handler
 * Implements Interface Segregation Principle - only player-specific commands
 */
class PlayerCommands {
    constructor(helpService, gameService, statsService) {
        this.helpService = helpService;
        this.gameService = gameService;
        this.statsService = statsService;
        
        this.commands = new Set(['help', 'checkhelp']);
    }

    /**
     * Check if command exists
     */
    hasCommand(command) {
        return this.commands.has(command);
    }

    /**
     * Execute slash command
     */
    async executeSlashCommand(command, interaction, guildId) {
        switch (command) {
            case 'help':
                await this.handleHelpCommand(interaction, guildId);
                break;
            case 'checkhelp':
                await this.handleCheckHelpCommand(interaction, guildId);
                break;
            default:
                await interaction.reply({ content: '❓ Lệnh không hợp lệ!' });
        }
    }

    /**
     * Execute player command
     */
    async executeCommand(command, message, args, guildId) {
        switch (command) {
            case 'help':
                await this.handleHelpCommand(message, guildId);
                break;
            case 'checkhelp':
                await this.handleCheckHelpCommand(message, guildId);
                break;
            default:
                await message.reply('❓ Lệnh không hợp lệ!');
        }
    }

    /**
     * Handle /help command - provide game hint
     */
    async handleHelpCommand(context, guildId) {
        try {
            const userId = context.user?.id || context.author?.id;
            
            // Check if user can use help
            if (!this.helpService.canUseHelp(userId)) {
                await context.reply('❌ Bạn đã dùng hết lượt trợ giúp hôm nay. Hãy quay lại sau 00:00 nhé!');
                return;
            }

            // Get hint
            const hint = this.gameService.getHint(guildId);
            if (!hint) {
                // Auto-skip: Start new game when no valid words found
                const gameChannelId = this.gameService.getGameChannelId(guildId);
                const newWord = this.gameService.startNewGame(guildId);
                await this.statsService.incrementGamesPlayed();
                
                // Notify in game channel if available
                if (gameChannelId) {
                    try {
                        // Get channel from context (works for both message and interaction)
                        const guild = context.guild || context.message?.guild;
                        if (guild) {
                            const channel = guild.channels.cache.get(gameChannelId);
                            if (channel) {
                                await channel.send(
                                    `🔄 Không còn từ nào hợp lệ để nối tiếp! Bot tự động bắt đầu ván mới.\n` +
                                    `🎯 Từ mới: **${newWord}**`
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error sending auto-restart message:', error);
                    }
                }
                
                // Reply to user who used /help
                await context.reply({
                    content: '🔄 Không có gợi ý khả dụng, bot đã tự động bắt đầu ván mới! Hãy kiểm tra kênh chơi để xem từ mới.',
                    flags: context.user ? [require('discord.js').InteractionResponseFlags.Ephemeral] : undefined
                });
                return;
            }

            // Use help
            const success = await this.helpService.useHelp(userId);
            if (!success) {
                await context.reply('❌ Không thể sử dụng trợ giúp lúc này!');
                return;
            }

            // Send hint
            const remainingHelp = this.helpService.getRemainingHelp(userId);
            await context.reply(
                `💡 Gợi ý: **${hint}**\n` +
                `📊 Còn lại: ${remainingHelp.remaining}/${remainingHelp.total} lượt trợ giúp hôm nay.`
            );
        } catch (error) {
            console.error('Help command error:', error);
            await context.reply('❌ Có lỗi xảy ra khi lấy gợi ý!');
        }
    }

    /**
     * Handle /checkhelp command - show remaining help count
     */
    async handleCheckHelpCommand(context, guildId) {
        try {
            const userId = context.user?.id || context.author?.id;
            const helpInfo = this.helpService.getRemainingHelp(userId);
            
            await context.reply(
                `📊 Bạn còn **${helpInfo.remaining}/${helpInfo.total}** lượt trợ giúp hôm nay.\n` +
                `🌙 Lượt sẽ được làm mới vào 00:00 (giờ Việt Nam).`
            );
        } catch (error) {
            console.error('Check help command error:', error);
            await context.reply('❌ Có lỗi xảy ra khi kiểm tra trợ giúp!');
        }
    }
}

module.exports = PlayerCommands;