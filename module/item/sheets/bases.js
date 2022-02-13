import ItemSheet3e from "./base.js";
export default class ItemSheet3eAdvantage extends ItemSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('vehicle');
        return mergeObject(opts, {
            template: 'systems/mnm3e/templates/items/base-sheet.html',
        });
    }
    /**
     * @override
     */
    getData(options = {}) {
        const sheetData = super.getData(options);
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
