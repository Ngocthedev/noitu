/**
 * Owner Commands Handler
 * Implements Interface Segregation Principle - only owner-specific commands
 */
class OwnerCommands {
    constructor(gameService, helpService, statsService) {
        this.gameService = gameService;
        this.helpService = helpService;
        this.statsService = statsService;
        
        this.commands = new Set([
            'setnoitu', 'setmaxhelp', 'givehelp', 'resethistory', 
            'forcenew', 'togglewords', 'setcooldown', 'stats'
        ]);
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
            case 'setnoitu':
                await this.handleSetNoiTuSlashCommand(interaction, guildId);
                break;
            case 'setmaxhelp':
                await this.handleSetMaxHelpSlashCommand(interaction, guildId);
                break;
            case 'givehelp':
                await this.handleGiveHelpSlashCommand(interaction, guildId);
                break;
            case 'resethistory':
                await this.handleResetHistoryCommand(interaction, guildId);
                break;
            case 'forcenew':
                await this.handleForceNewCommand(interaction, guildId);
                break;
            case 'togglewords':
                await this.handleToggleWordsSlashCommand(interaction, guildId);
                break;
            case 'setcooldown':
                await this.handleSetCooldownSlashCommand(interaction, guildId);
                break;
            case 'stats':
                await this.handleStatsCommand(interaction, guildId);
                break;
            default:
                await interaction.reply({ content: '❓ Lệnh owner không hợp lệ!' });
        }
    }

    /**
     * Execute owner command
     */
    async executeCommand(command, message, args, guildId) {
        switch (command) {
            case 'setnoitu':
                await this.handleSetNoiTuCommand(message, args, guildId);
                break;
            case 'setmaxhelp':
                await this.handleSetMaxHelpCommand(message, args, guildId);
                break;
            case 'givehelp':
                await this.handleGiveHelpCommand(message, args, guildId);
                break;
            case 'resethistory':
                await this.handleResetHistoryCommand(message, guildId);
                break;
            case 'forcenew':
                await this.handleForceNewCommand(message, guildId);
                break;
            case 'togglewords':
                await this.handleToggleWordsCommand(message, args, guildId);
                break;
            case 'setcooldown':
                await this.handleSetCooldownCommand(message, args, guildId);
                break;
            case 'stats':
                await this.handleStatsCommand(message, guildId);
                break;
            default:
                await message.reply('❓ Lệnh owner không hợp lệ!');
        }
    }

    /**
     * Handle /setnoitu slash command
     */
    async handleSetNoiTuSlashCommand(interaction, guildId) {
        try {
            const channel = interaction.options.getChannel('channel');
            
            if (!channel) {
                await interaction.reply({ content: '❌ Không tìm thấy kênh!' });
                return;
            }

            this.gameService.setGameChannelId(channel.id, guildId);
            await interaction.reply({ content: `✅ Đã thiết lập kênh nối từ: ${channel}` });
            
            // Start new game in the channel
            const newWord = this.gameService.startNewGame(guildId);
            await channel.send(`🎯 Trò chơi nối từ bắt đầu! Từ đầu tiên: **${newWord}**`);
        } catch (error) {
            console.error('Set noitu slash command error:', error);
            await interaction.reply({ content: '❌ Có lỗi xảy ra khi thiết lập kênh!' });
        }
    }

    /**
     * Handle /setnoitu command
     */
    async handleSetNoiTuCommand(message, args, guildId) {
        try {
            if (args.length < 2) {
                await message.reply('❌ Sử dụng: `/setnoitu channel:#tên-kênh`');
                return;
            }

            const channelMention = args[1];
            const channelMatch = channelMention.match(/^channel:<#(\d+)>$/) || channelMention.match(/^<#(\d+)>$/);
            
            if (!channelMatch) {
                await message.reply('❌ Định dạng không đúng. Sử dụng: `/setnoitu channel:#tên-kênh`');
                return;
            }

            const channelId = channelMatch[1];
            const channel = message.guild.channels.cache.get(channelId);
            
            if (!channel) {
                await message.reply('❌ Không tìm thấy kênh!');
                return;
            }

            this.gameService.setGameChannelId(channelId, guildId);
            await message.reply(`✅ Đã thiết lập kênh nối từ: ${channel}`);
            
            // Start new game in the channel
            const newWord = this.gameService.startNewGame(guildId);
            await channel.send(`🎯 Trò chơi nối từ bắt đầu! Từ đầu tiên: **${newWord}**`);
        } catch (error) {
            console.error('Set noitu command error:', error);
            await message.reply('❌ Có lỗi xảy ra khi thiết lập kênh!');
        }
    }

    /**
     * Handle /setmaxhelp slash command
     */
    async handleSetMaxHelpSlashCommand(interaction, guildId) {
        try {
            const maxHelp = interaction.options.getInteger('amount');
            
            if (maxHelp < 1) {
                await interaction.reply({ content: '❌ Số lượt trợ giúp phải là số nguyên dương!' });
                return;
            }

            await this.helpService.setMaxHelpPerDay(maxHelp);
            await interaction.reply({ content: `✅ Đã đặt số lượt trợ giúp tối đa/ngày: **${maxHelp}**` });
        } catch (error) {
            console.error('Set max help slash command error:', error);
            await interaction.reply({ content: '❌ Có lỗi xảy ra khi thiết lập!' });
        }
    }

    /**
     * Handle /setmaxhelp command
     */
    async handleSetMaxHelpCommand(message, args, guildId) {
        try {
            if (args.length < 2) {
                await message.reply('❌ Sử dụng: `/setmaxhelp <số>`');
                return;
            }

            const maxHelp = parseInt(args[1]);
            if (isNaN(maxHelp) || maxHelp < 1) {
                await message.reply('❌ Số lượt trợ giúp phải là số nguyên dương!');
                return;
            }

            await this.helpService.setMaxHelpPerDay(maxHelp);
            await message.reply(`✅ Đã đặt số lượt trợ giúp tối đa/ngày: **${maxHelp}**`);
        } catch (error) {
            console.error('Set max help command error:', error);
            await message.reply('❌ Có lỗi xảy ra khi thiết lập!');
        }
    }

    /**
     * Handle /givehelp slash command
     */
    async handleGiveHelpSlashCommand(interaction, guildId) {
        try {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            
            if (amount < 1) {
                await interaction.reply({ content: '❌ Số lượng phải là số nguyên dương!' });
                return;
            }

            await this.helpService.giveHelp(user.id, amount);
            await interaction.reply({ content: `✅ Đã tặng **${amount}** lượt trợ giúp cho ${user}!` });
        } catch (error) {
            console.error('Give help slash command error:', error);
            await interaction.reply({ content: '❌ Có lỗi xảy ra khi tặng trợ giúp!' });
        }
    }

    /**
     * Handle /givehelp command
     */
    async handleGiveHelpCommand(message, args, guildId) {
        try {
            if (args.length < 3) {
                await message.reply('❌ Sử dụng: `/givehelp @user <số>`');
                return;
            }

            const userMention = args[1];
            const amount = parseInt(args[2]);
            
            const userMatch = userMention.match(/^<@!?(\d+)>$/);
            if (!userMatch) {
                await message.reply('❌ Phải mention (@) một user!');
                return;
            }

            if (isNaN(amount) || amount < 1) {
                await message.reply('❌ Số lượng phải là số nguyên dương!');
                return;
            }

            const userId = userMatch[1];
            const user = await message.client.users.fetch(userId);
            
            await this.helpService.giveHelp(userId, amount);
            await message.reply(`✅ Đã tặng **${amount}** lượt trợ giúp cho ${user}!`);
        } catch (error) {
            console.error('Give help command error:', error);
            await message.reply('❌ Có lỗi xảy ra khi tặng trợ giúp!');
        }
    }

    /**
     * Handle /resethistory command
     */
    async handleResetHistoryCommand(context, guildId) {
        try {
            this.gameService.resetHistory(guildId);
            await this.statsService.incrementGameResets();
            
            await context.reply('✅ Đã xóa lịch sử cụm từ trong ván hiện tại!');
        } catch (error) {
            console.error('Reset history command error:', error);
            await context.reply('❌ Có lỗi xảy ra khi reset lịch sử!');
        }
    }

    /**
     * Handle /forcenew command
     */
    async handleForceNewCommand(context, guildId) {
        try {
            const newWord = this.gameService.startNewGame(guildId);
            await this.statsService.incrementGamesPlayed();
            
            const channelId = this.gameService.getGameChannelId(guildId);
            if (channelId) {
                const guild = context.guild || context.message?.guild;
                const channel = guild?.channels.cache.get(channelId);
                if (channel) {
                    await channel.send(`🎯 Ván mới được bắt đầu bởi Owner! Từ đầu tiên: **${newWord}**`);
                }
            }
            
            await context.reply('✅ Đã bắt đầu ván mới!');
        } catch (error) {
            console.error('Force new command error:', error);
            await context.reply('❌ Có lỗi xảy ra khi bắt đầu ván mới!');
        }
    }

    /**
     * Handle /togglewords slash command
     */
    async handleToggleWordsSlashCommand(interaction, guildId) {
        try {
            const setting = interaction.options.getString('setting');
            const enabled = setting === 'on';
            
            this.gameService.toggleDuplicateCheck(enabled, guildId);
            
            const status = enabled ? '✅ BẬT' : '❌ TẮT';
            await interaction.reply({ content: `${status} kiểm tra trùng lặp cụm từ!` });
        } catch (error) {
            console.error('Toggle words slash command error:', error);
            await interaction.reply({ content: '❌ Có lỗi xảy ra khi thay đổi cài đặt!' });
        }
    }

    /**
     * Handle /togglewords command
     */
    async handleToggleWordsCommand(message, args, guildId) {
        try {
            if (args.length < 2) {
                await message.reply('❌ Sử dụng: `/togglewords on/off`');
                return;
            }

            const setting = args[1].toLowerCase();
            if (setting !== 'on' && setting !== 'off') {
                await message.reply('❌ Chỉ chấp nhận `on` hoặc `off`!');
                return;
            }

            const enabled = setting === 'on';
            this.gameService.toggleDuplicateCheck(enabled, guildId);
            
            const status = enabled ? '✅ BẬT' : '❌ TẮT';
            await message.reply(`${status} kiểm tra trùng lặp cụm từ!`);
        } catch (error) {
            console.error('Toggle words command error:', error);
            await message.reply('❌ Có lỗi xảy ra khi thay đổi cài đặt!');
        }
    }

    /**
     * Handle /setcooldown slash command
     */
    async handleSetCooldownSlashCommand(interaction, guildId) {
        try {
            const seconds = interaction.options.getInteger('seconds');
            
            if (seconds < 0) {
                await interaction.reply({ content: '❌ Thời gian phải là số nguyên không âm!' });
                return;
            }

            this.gameService.setCooldownTime(seconds, guildId);
            await interaction.reply({ content: `✅ Đã đặt thời gian chờ: **${seconds}** giây` });
        } catch (error) {
            console.error('Set cooldown slash command error:', error);
            await interaction.reply({ content: '❌ Có lỗi xảy ra khi thiết lập cooldown!' });
        }
    }

    /**
     * Handle /setcooldown command
     */
    async handleSetCooldownCommand(message, args, guildId) {
        try {
            if (args.length < 2) {
                await message.reply('❌ Sử dụng: `/setcooldown <giây>`');
                return;
            }

            const seconds = parseInt(args[1]);
            if (isNaN(seconds) || seconds < 0) {
                await message.reply('❌ Thời gian phải là số nguyên không âm!');
                return;
            }

            this.gameService.setCooldownTime(seconds, guildId);
            await message.reply(`✅ Đã đặt thời gian chờ: **${seconds}** giây`);
        } catch (error) {
            console.error('Set cooldown command error:', error);
            await message.reply('❌ Có lỗi xảy ra khi thiết lập cooldown!');
        }
    }

    /**
     * Handle /stats command
     */
    async handleStatsCommand(context, guildId) {
        try {
            const gameStats = this.gameService.getGameStats(guildId);
            const allStats = this.statsService.getAllStats();
            const helpStats = this.helpService.getHelpStats();
            const activeGuilds = this.gameService.getActiveGuildsCount();

            const embed = {
                title: '📊 Thống Kê Bot Nối Từ',
                color: 0x00ff00,
                fields: [
                    {
                        name: '🎮 Trạng thái game',
                        value: `Từ hiện tại: **${gameStats.currentWord || 'Chưa bắt đầu'}**\n` +
                               `Từ đã dùng: **${gameStats.usedWordPairsCount}**\n` +
                               `Từ điển: **${gameStats.dictionarySize}** cụm từ\n` +
                               `Kiểm tra trùng: **${gameStats.checkDuplicates ? 'Bật' : 'Tắt'}**\n` +
                               `Cooldown: **${gameStats.cooldownTime}s**`,
                        inline: true
                    },
                    {
                        name: '📈 Thống kê hôm nay',
                        value: `Từ đã nối: **${allStats.today.wordsToday}**\n` +
                               `Người dùng trợ giúp: **${helpStats.totalUsersToday}**\n` +
                               `Trợ giúp đã dùng: **${helpStats.totalHelpUsedToday}**`,
                        inline: true
                    },
                    {
                        name: '🏆 Tổng quan',
                        value: `Ván đã chơi: **${allStats.allTime.gamesPlayed}**\n` +
                               `Lần reset: **${allStats.allTime.gameResets}**\n` +
                               `Từ tuần này: **${allStats.thisWeek.totalWords}**\n` +
                               `Server đang chơi: **${activeGuilds}**`,
                        inline: true
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Bot Nối Từ Việt Nam 🇻🇳'
                }
            };

            await context.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Stats command error:', error);
            await context.reply('❌ Có lỗi xảy ra khi lấy thống kê!');
        }
    }
}

module.exports = OwnerCommands;