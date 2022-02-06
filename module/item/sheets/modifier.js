import ItemSheet3e from "./base.js";
export default class ItemSheet3eEffect extends ItemSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('modifier');
        return mergeObject(opts, {
            template: 'systems/mnm3e/templates/items/modifier-sheet.html',
        });
    }
    /**
     * @override
     */
    getData(options = {}) {
        const sheetData = super.getData(options);
        sheetData.itemSubtitles = [game.i18n.localize(sheetData.data.data.cost.value >= 0 ? 'MNM3E.ModifierExtra' : 'MNM3E.ModifierFlaw')];
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.expression-control').on('click', this.expressionControlHandler.bind(this));
    }
    expressionControlHandler(ev) {
        const e = ev;
        e.preventDefault();
        const target = e.currentTarget;
        const expressions = this.item.data.data.expressions;
        switch (target.dataset.action) {
            case 'create':
                expressions.push({ key: '', formula: '' });
                break;
            case 'delete':
                expressions.splice(target.dataset.index, 1);
                break;
        }
        this.item.update({ data: { expressions: expressions } }, {});
    }
}
