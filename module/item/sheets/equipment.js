import ItemSheet3e from "./base.js";
export default class ItemSheet3eEquipment extends ItemSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('power', 'equipment', 'vehicle', 'base');
        return mergeObject(opts, {
            template: 'systems/mnm3e/templates/items/power-sheet.html',
        });
    }
    /**
     * @override
     */
    getData(options = {}) {
        const sheetData = super.getData(options);
        sheetData.data.summary = '';
        sheetData.data.effects.forEach(effect => {
            if (effect.data.summary.parsed) {
                sheetData.data.summary += effect.data.summary.parsed;
            }
        });
        sheetData.attributes = [{
                label: game.i18n.localize('MNM3E.Descriptor'),
                name: 'data.descriptor',
                value: sheetData.data.descriptor,
            }];
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        html.find('.item-effect-controls .item-control').on('click', ev => this.onItemListActionHandler(ev, 'data.effects'));
        new DragDrop({
            dragSelector: '.item',
            dropSelector: '.sheet-body .details',
            permissions: { dragstart: () => true, drop: () => true },
            callbacks: { drop: (ev) => this.handleDroppedData(ev, [{ expectedType: 'effect', destinationPath: 'effects' }]) },
        }).bind($('form.editable.item-sheet-equipment')[0]);
        super.activateListeners(html);
    }
}
