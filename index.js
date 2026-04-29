const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is Online!'));
app.listen(3000, () => console.log('Server is ready!'));
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, InteractionType, ChannelType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

// --- Configuration ---
const CONFIG = {
    TOKEN: 'MTQ5ODc4MjM1MTI3MzA5OTMyNg.G96JCr.OMmxUMTnwjsxpVJuNPIAbePSHcEMuS2nF5k4Ug',
    FORUM_CHANNEL_ID: '1498771376511778898', // Forum channel er ID
    STAFF_ROLE_ID: '1498771511895658507',     // Server Staff role ID
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! Bot is ready.`);
});

// --- 1. Command to Send the Initial Report Buttons ---
// Message e "!setup" likhle ei button gulo ashbe
client.on('messageCreate', async (message) => {
    if (message.content === '!setup' && message.member.permissions.has('Administrator')) {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('Vertex | Management')
            .setDescription('This is Vertex Mobile Red Report | Using this you can Complaint against a Player/Admin or Bug.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('player_complaint').setLabel('Player Complaint').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('admin_complaint').setLabel('Admin Complaint').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('tech_bug').setLabel('Tech Bug').setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// --- 2. Interaction Handler ---
client.on('interactionCreate', async (interaction) => {

    // Button Click hole Modal (Form) dekhano
    if (interaction.isButton()) {
        const modal = new ModalBuilder().setCustomId('report_modal').setTitle('Submit Report');

        const nameInput = new TextInputBuilder().setCustomId('rp_name').setLabel("Your RP Name").setStyle(TextInputStyle.Short).setRequired(true);
        const violatorInput = new TextInputBuilder().setCustomId('violator_name').setLabel("Violator Name / Bug Subject").setStyle(TextInputStyle.Short).setRequired(true);
        const ruleInput = new TextInputBuilder().setCustomId('rule_violated').setLabel("Rule Violated / Bug Type").setStyle(TextInputStyle.Short).setRequired(true);
        const descInput = new TextInputBuilder().setCustomId('description').setLabel("Description").setStyle(TextInputStyle.Paragraph).setRequired(true);
        const proofInput = new TextInputBuilder().setCustomId('proof_link').setLabel("Proof (Link)").setStyle(TextInputStyle.Short).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(violatorInput),
            new ActionRowBuilder().addComponents(ruleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(proofInput)
        );

        await interaction.showModal(modal);
    }

    // Modal Submit hole Forum e Thread create kora
    if (interaction.type === InteractionType.ModalSubmit) {
        const rpName = interaction.fields.getTextInputValue('rp_name');
        const violator = interaction.fields.getTextInputValue('violator_name');
        const rule = interaction.fields.getTextInputValue('rule_violated');
        const desc = interaction.fields.getTextInputValue('description');
        const proof = interaction.fields.getTextInputValue('proof_link');

        const forumChannel = client.channels.cache.get(CONFIG.FORUM_CHANNEL_ID);
        if (!forumChannel) return interaction.reply({ content: 'Forum channel not found!', ephemeral: true });

        const caseId = Math.floor(1000 + Math.random() * 9000);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`New Case: #${caseId}`)
            .addFields(
                { name: 'User', value: `${interaction.user}`, inline: true },
                { name: 'Your Name', value: rpName, inline: true },
                { name: 'Violator/Subject', value: violator },
                { name: 'Rule/Type', value: rule },
                { name: 'Description', value: desc },
                { name: 'Evidence', value: proof }
            )
            .setTimestamp();

        const adminButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('approve').setLabel('Approve').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('reject').setLabel('Reject').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('amnesty').setLabel('Amnesty').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('duplicate').setLabel('Duplicate').setStyle(ButtonStyle.Secondary)
        );

        await forumChannel.threads.create({
            name: `#${caseId} | ${violator}`,
            message: { 
                content: `<@&${CONFIG.STAFF_ROLE_ID}> Administration required.`, 
                embeds: [embed], 
                components: [adminButtons] 
            }
        });

        await interaction.reply({ content: 'Report submitted successfully!', ephemeral: true });
    }

    // Forum er Button logic (Approve/Reject)
    if (interaction.isButton() && ['approve', 'reject', 'amnesty', 'duplicate'].includes(interaction.customId)) {
        if (!interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
            return interaction.reply({ content: "You don't have permission!", ephemeral: true });
        }

        const status = interaction.customId.toUpperCase();
        await interaction.message.edit({ components: [] }); // Button gulo soriye fela
        await interaction.reply(`This case has been **${status}** by ${interaction.user}.`);
        await interaction.channel.setArchived(true); // Thread ta close/archive kore deya
    }
});

client.login(CONFIG.TOKEN);
