import ItemSheet3e from "./base.js";
export default class ItemSheet3eEffect extends ItemSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('effect');
        return mergeObject(opts, {
            template: 'systems/mnm3e/templates/items/effect-sheet.html',
        });
    }
    /**
     * @override
     */
    getData(options = {}) {
        const sheetData = super.getData(options);
        if (sheetData.data.data.action.type.value) {
            sheetData.itemSubtitles = [game.i18n.localize(`MNM3E.EffectType${sheetData.data.action.type.value.titleCase()}`)];
        }
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        html.find('.item-modifier-controls .item-control').on('click', ev => this.onItemListActionHandler(ev, 'data.modifiers'));
        new DragDrop({
            dragSelector: '.item',
            dropSelector: '.sheet-body .modifiers',
            permissions: { dragstart: () => true, drop: () => true },
            callbacks: { drop: (ev) => this.handleDroppedData(ev, [{ expectedType: 'modifier', destinationPath: 'modifiers' }]) },
        }).bind($('form.editable.item-sheet-effect')[0]);
        super.activateListeners(html);
    }
}
