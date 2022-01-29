import Item3e from "./item/entity.js";
import { onActiveEffect } from "./active-effects.js";
import { calculateDegrees } from "./dice.js";
Hooks.on('applyActiveEffect', onActiveEffect);
Hooks.on('renderChatLog', (app, html, data) => Item3e.activateChatListeners(html));
Hooks.on('renderChatPopout', (app, html, data) => Item3e.activateChatListeners(html));
Hooks.on('renderChatMessage', (app, html, data) => {
    html.find('.initially-hidden').hide();
});
Hooks.on('renderSidebarTab', async (app, html, data) => {
    if (!game.settings.get('mnm3e', 'enableDegreeCalculator')) {
        return;
    }
    const template = 'systems/mnm3e/templates/apps/degree-calculator.html';
    const renderedTemplate = $(await renderTemplate(template, {}));
    const chatForm = html.find('#chat-form');
    chatForm.after(renderedTemplate);
    renderedTemplate.find('input').on('change', ev => {
        const rollInput = renderedTemplate.find('.roll');
        const dcInput = renderedTemplate.find('.dc');
        const degreesOutput = renderedTemplate.find('.degrees');
        const result = calculateDegrees(parseInt(dcInput.val()), parseInt(rollInput.val()));
        if (Number.isNaN(result.degrees)) {
            degreesOutput.text('');
            degreesOutput.attr('class', 'degrees no-input');
        }
        else {
            degreesOutput.text(Math.abs(result.degrees));
            degreesOutput.attr('class', `degrees ${result.cssClass}`);
        }
    });
});
