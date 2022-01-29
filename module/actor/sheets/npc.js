import ActorSheet3e from "./base.js";
export default class ActorSheet3eNPC extends ActorSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('npc');
        return mergeObject(opts, {
            template: 'systems/mnm3e/templates/actors/npc-sheet.html',
            width: 700,
            height: 500,
        });
    }
    /**
     * @override
     */
    getData() {
        const sheetData = super.getData();
        return sheetData;
    }
}
