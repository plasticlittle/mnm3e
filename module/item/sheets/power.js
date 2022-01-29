import ItemSheet3e from "./base.js";
export default class ItemSheet3ePower extends ItemSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('power');
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
        sheetData.itemSubtitles = [game.i18n.format('MNM3E.TotalCostFormat', { amount: sheetData.data.totalCost })];
        sheetData.effectSummaries = [];
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        const itemData = this.item.data;
        [
            { selector: '.item-effect-controls .item-control', dataPath: 'data.effects' },
            { selector: '.item-power-controls .item-control', dataPath: 'data.powerArray' },
        ].forEach(opts => html.find(opts.selector).on('click', ev => this.onItemListActionHandler(ev, opts.dataPath)));
        new DragDrop({
            dragSelector: '.item',
            dropSelector: '.sheet-body .details',
            permissions: { dragstart: () => true, drop: () => true },
            callbacks: { drop: (ev) => this.handleDroppedData(ev, [
                    { expectedType: 'effect', destinationPath: 'effects' },
                    { expectedType: 'power', destinationPath: 'powerArray' },
                ])
            },
        }).bind($('form.editable.item-sheet-power')[0]);
        itemData.data.powerArray.forEach((alternativePower, index) => {
            if (!alternativePower.data.totalCost || !itemData.data.totalCost) {
                return;
            }
            if (alternativePower.data.totalCost > itemData.data.totalCost) {
                const listSelector = '.items-list power-list .item';
                const listElements = html.find(listSelector);
                if (!listElements) {
                    throw new Error(`Couldn't find elements with selector '${listSelector}'`);
                }
                listElements[index].classList.add('invalid-power');
            }
        });
        super.activateListeners(html);
    }
    /**
     * @override
     */
    async renderListItemContents() {
        const html = await super.renderListItemContents();
        html.find('.item .item-name .item-image').on('click', ev => {
            ev.preventDefault();
            const powerIndex = ev.currentTarget.closest('.item').dataset.powerIndex;
            this.item.roll({ powerArrayIndex: powerIndex });
        });
        return html;
    }
}
