export const displayCard = async (cardType, speaker, templateData, { rollMode, flags } = {}) => {
    const messageTemplate = `systems/mnm3e/templates/chat/${cardType}-card.html`
    renderTemplate(messageTemplate, {         
        templateContent: templateData
    }).then((data) => {
        console.log(data)
        const chatFlags = {
            'core.canPopout': true,
            ...Object.assign({}, flags),
        };

        const chatOptions = {
            speaker: ChatMessage.getSpeaker(),
            content: data              
          };
        ChatMessage.create(chatOptions)
        //ChatMessage.applyRollMode(chatData, rollMode || game.settings.get('core', 'rollMode'));
    });

   
};