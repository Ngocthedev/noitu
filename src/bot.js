require('dotenv').config();

const { Client, GatewayIntentBits, Collection, ApplicationCommandOptionType } = require('discord.js');
const { InteractionResponseFlags } = require('discord.js');
const fs = require('fs-extra');
const cron = require('node-cron');

const DictionaryService = require('./services/dictionary-service');
const GameService = require('./services/game-service');
const HelpService = require('./services/help-service');
const StatsService = require('./services/stats-service');
const PlayerCommands = require('./commands/player-commands');
const OwnerCommands = require('./commands/owner-commands');
const MessageValidator = require('./utils/message-validator');

// Slash commands data
const commandsData = [
    // Player commands
    {
        name: 'help',
        description: 'Nhận gợi ý từ hợp lệ để nối tiếp (5 lần/ngày)'
    },
    {
        name: 'checkhelp',
        description: 'Kiểm tra số lượt trợ giúp còn lại'
    },
    // Owner commands
    {
        name: 'setnoitu',
        description: 'Thiết lập kênh chơi nối từ (chỉ owner)',
        options: [
            {
                name: 'channel',
                description: 'Kênh để chơi nối từ',
                type: ApplicationCommandOptionType.Channel,
                required: true
            }
        ]
    },
    {
        name: 'setmaxhelp',
        description: 'Đặt giới hạn trợ giúp/ngày (chỉ owner)',
        options: [
            {
                name: 'amount',
                description: 'Số lượt trợ giúp tối đa/ngày',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 1
            }
        ]
    },
    {
        name: 'givehelp',
        description: 'Tặng thêm lượt trợ giúp cho user (chỉ owner)',
        options: [
            {
                name: 'user',
                description: 'User được tặng trợ giúp',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'amount',
                description: 'Số lượt trợ giúp muốn tặng',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 1
            }
        ]
    },
    {
        name: 'resethistory',
        description: 'Xóa lịch sử từ đã dùng trong ván hiện tại (chỉ owner)'
    },
    {
        name: 'forcenew',
        description: 'Bắt đầu ván mới ngay lập tức (chỉ owner)'
    },
    {
        name: 'togglewords',
        description: 'Bật/tắt kiểm tra trùng lặp từ (chỉ owner)',
        options: [
            {
                name: 'setting',
                description: 'Bật hoặc tắt kiểm tra trùng lặp',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Bật', value: 'on' },
                    { name: 'Tắt', value: 'off' }
                ]
            }
        ]
    },
    {
        name: 'setcooldown',
        description: 'Đặt thời gian chờ giữa các lượt (chỉ owner)',
        options: [
            {
                name: 'seconds',
                description: 'Thời gian chờ tính bằng giây',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 0
            }
        ]
    },
    {
        name: 'stats',
        description: 'Xem thống kê chi tiết bot (chỉ owner)'
    }
];

/**
 * Main Discord Bot Class for Nối Từ Game
 * Implements Single Responsibility Principle by delegating specific tasks to services
 */
class NoiTuBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
        
        this.initializeServices();
        this.setupEventHandlers();
        this.setupDailyReset();
    }

    /**
     * Initialize all services following Dependency Injection pattern
     */
    initializeServices() {
        this.dictionaryService = new DictionaryService();
        this.gameService = new GameService(this.dictionaryService);
        this.helpService = new HelpService();
        this.statsService = new StatsService();
        
        this.playerCommands = new PlayerCommands(this.helpService, this.gameService, this.statsService);
        this.ownerCommands = new OwnerCommands(this.gameService, this.helpService, this.statsService);
        
        this.messageValidator = new MessageValidator();
    }

    /**
     * Setup Discord event handlers
     */
    setupEventHandlers() {
        this.client.once('ready', async () => {
            console.log(`🤖 Bot ${this.client.user.tag} đã sẵn sàng!`);
            
            // Register slash commands
            try {
                console.log('📝 Đang đăng ký slash commands...');
                await this.client.application.commands.set(commandsData);
                console.log('✅ Đã đăng ký thành công slash commands!');
            } catch (error) {
                console.error('❌ Lỗi khi đăng ký slash commands:', error);
            }
            
            await this.dictionaryService.loadDictionary();
            console.log('✅ Bot đã sẵn sàng phục vụ nhiều server!');
        });

        this.client.on('messageCreate', async (message) => {
            await this.handleMessage(message);
        });
        
        this.client.on('interactionCreate', async (interaction) => {
            await this.handleInteraction(interaction);
        });

        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
        });
    }

    /**
     * Setup daily reset for help counters
     */
    setupDailyReset() {
        // Reset help counters at midnight Vietnamese time (UTC+7)
        cron.schedule('0 0 * * *', () => {
            this.helpService.resetDailyHelp();
            console.log('🔄 Đã reset lượt trợ giúp hàng ngày');
        }, {
            timezone: "Asia/Ho_Chi_Minh"
        });
    }

    /**
     * Handle slash command interactions
     */
    async handleInteraction(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const guildId = interaction.guild?.id;
        if (!guildId) {
            await interaction.reply({ 
                content: '❌ Bot chỉ hoạt động trong server, không hỗ trợ DM!', 
                flags: [InteractionResponseFlags.Ephemeral] 
            });
            return;
        }

        const command = interaction.commandName;
        
        try {
            // Player commands
            if (this.playerCommands.hasCommand(command)) {
                await this.playerCommands.executeSlashCommand(command, interaction, guildId);
                return;
            }

            // Owner commands (check permissions)
            if (this.ownerCommands.hasCommand(command)) {
                if (!this.isOwner(interaction.user.id)) {
                    await interaction.reply({ 
                        content: '❌ Chỉ owner bot mới có thể sử dụng lệnh này!', 
                        flags: [InteractionResponseFlags.Ephemeral] 
                    });
                    return;
                }
                await this.ownerCommands.executeSlashCommand(command, interaction, guildId);
                return;
            }

            // Unknown command
            await interaction.reply({ 
                content: '❓ Lệnh không tồn tại!', 
                flags: [InteractionResponseFlags.Ephemeral] 
            });
        } catch (error) {
            console.error('Slash command execution error:', error);
            const errorMessage = '❌ Có lỗi xảy ra khi thực hiện lệnh!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ 
                    content: errorMessage, 
                    flags: [InteractionResponseFlags.Ephemeral] 
                });
            }
        }
    }

    /**
     * Handle incoming messages (including legacy commands and game input)
     */
    async handleMessage(message) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Only work in guilds, not DMs
        if (!message.guild) return;
        
        const guildId = message.guild.id;

        // Handle commands
        if (message.content.startsWith('/')) {
            await this.handleCommand(message, guildId);
            return;
        }

        // Handle game messages only in designated channel
        const gameChannelId = this.gameService.getGameChannelId(guildId);
        if (!gameChannelId || message.channel.id !== gameChannelId) return;

        await this.handleGameMessage(message, guildId);
    }

    /**
     * Handle slash commands
     */
    async handleCommand(message, guildId) {
        const args = message.content.slice(1).split(' ');
        const command = args[0].toLowerCase();

        try {
            // Player commands
            if (this.playerCommands.hasCommand(command)) {
                await this.playerCommands.executeCommand(command, message, args, guildId);
                return;
            }

            // Owner commands (check permissions)
            if (this.ownerCommands.hasCommand(command)) {
                if (!this.isOwner(message.author.id)) {
                    await message.reply('❌ Chỉ owner bot mới có thể sử dụng lệnh này!');
                    return;
                }
                await this.ownerCommands.executeCommand(command, message, args, guildId);
                return;
            }

            // Unknown command
            await message.reply('❓ Lệnh không tồn tại. Gõ `/help` để xem hướng dẫn.');
        } catch (error) {
            console.error('Command execution error:', error);
            await message.reply('❌ Có lỗi xảy ra khi thực hiện lệnh!');
        }
    }

    /**
     * Handle game messages (word chain inputs)
     */
    async handleGameMessage(message, guildId) {
        try {
            // Pre-check: Only validate if message has exactly 2 words
            // This prevents bot from reacting to normal chat messages
            const words = message.content.trim().split(/\s+/);
            if (words.length !== 2) {
                // Silently ignore messages that are not exactly 2 words
                // This allows normal conversation without bot interference
                return;
            }

            // Validate message format
            const validationResult = this.messageValidator.validateGameInput(message.content);
            if (!validationResult.isValid) {
                await message.react('❌');
                if (validationResult.error) {
                    await message.reply(validationResult.error);
                }
                return;
            }

            const wordPair = validationResult.wordPair;

            // Check cooldown
            if (this.gameService.isUserOnCooldown(message.author.id)) {
                await message.react('⏰');
                return;
            }

            // Process the word chain attempt
            const result = await this.gameService.processWordChain(wordPair, message.author.id, guildId);
            
            if (result.isValid) {
                await message.react('✅');
                this.statsService.incrementDailyWords();
                
                // Check if game should end and restart
                if (result.shouldRestart) {
                    await message.channel.send('🎮 Trò chơi kết thúc, không còn từ nào hợp lệ để nối tiếp!');
                    const newWord = this.gameService.startNewGame(guildId);
                    await message.channel.send(`🎯 Ván mới bắt đầu với: **${newWord}**`);
                }
            } else {
                await message.react('❌');
                if (result.error) {
                    await message.reply(result.error);
                }
            }
        } catch (error) {
            console.error('Game message handling error:', error);
            await message.react('❌');
        }
    }

    /**
     * Check if user is bot owner
     */
    isOwner(userId) {
        // You should set your Discord user ID here
        const ownerIds = process.env.OWNER_IDS?.split(',') || [];
        return ownerIds.includes(userId);
    }

    /**
     * Start the bot
     */
    start() {
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            console.error('❌ DISCORD_TOKEN environment variable is required!');
            process.exit(1);
        }
        this.client.login(token);
    }
}

// Start the bot
const bot = new NoiTuBot();
bot.start();

module.exports = NoiTuBot;