export const displayCard = async (cardType, speaker, templateData, { rollMode, flags } = {}) => {
    const html = await renderTemplate(`systems/mnm3e/templates/chat/${cardType}-card.html`, templateData);
    const chatFlags = {
        'core.canPopout': true,
        ...Object.assign({}, flags),
    };
    const chatData = {
        user: game.user._id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        content: html,
        speaker,
        sound: CONFIG.sounds.dice,
        flags: chatFlags,
    };
    ChatMessage.applyRollMode(chatData, rollMode || game.settings.get('core', 'rollMode'));
    return ChatMessage.create(chatData);
};
