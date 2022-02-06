import { onManagedActiveEffect, prepareActiveEffectCategories } from "../../active-effects.js";
import SummaryBuilder from "../../apps/summary-builder.js";
export default class ItemSheet3e extends ItemSheet {
    constructor(...args) {
        super(...args);
        this._childItems = new Map();
    }
    /**
     * @override
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['mnm3e', 'sheet', 'item'],
            width: 600,
            height: 600,
            tabs: [{ navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'description' }],
        });
    }
    /**
     * @override
     */
    getData(options = {}) {
        const sheetData = super.getData();
        sheetData.config = CONFIG.MNM3E;
        console.log(this.item)
        //sheetData.item.isOwner = this.item.isOwned;
        sheetData.parentItem = this._parentItem;
        sheetData.itemType = game.i18n.localize(`ITEM.Type${this.item.type.titleCase()}`);
        let actorData = undefined;
        if (this.actor) {
            actorData = this.actor.data;
        }
        sheetData.formulaOptions = [
            { label: 'MNM3E.Abilities', score: 'abilities' },
            { label: 'MNM3E.Defenses', score: 'defenses' },
            { label: 'MNM3E.Skills', score: 'skills' },
        ].map(opts => ({
            label: game.i18n.localize(opts.label),
            entries: Object.entries(sheetData.config[opts.score]).reduce((agg, entry) => {
                const [scoreName, scoreLabel] = entry;
                let key = `${opts.score}.${scoreName}`;
                const subCategories = {};
                if (opts.score == 'skills') {
                    if (['cco', 'exp', 'rco'].includes(scoreName)) {
                        key += `.base`;
                        if (actorData) {
                            Object.entries(actorData.data.skills[scoreName].data).forEach(customSkill => {
                                subCategories[`skills.${scoreName}.data.${customSkill[0]}.total`] = `➥ ${customSkill[1].displayName}`;
                            });
                        }
                    }
                    else {
                        key += '.data.total';
                    }
                }
                else {
                    key += '.total';
                }
                agg[key] = scoreLabel;
                Object.entries(subCategories).forEach(([dataPath, customLabel]) => agg[dataPath] = customLabel);
                return agg;
            }, {}),
        }));
        sheetData.effects = prepareActiveEffectCategories(this.document.effects);
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        html.find('.effect-control').on('click', ev => onManagedActiveEffect(ev, this.item));
        html.find('.check-control').on('click', this.onCheckControl.bind(this));
        html.find('.app-button').on('click', this.onAppMenu.bind(this));
        html.find('.item .item-name h4').on('click', this.onItemSummary.bind(this));
        const originalClose = this.close.bind(this);
        this.close = async () => {
            this._childItems.forEach(async (value) => await value.sheet.close());
            await originalClose();
        };
        super.activateListeners(html);
    }
    async renderListItemContents() {
        return $(await renderTemplate('systems/mnm3e/templates/items/parts/list-item-sheet.html', this.item.data));
    }
    async onItemListActionHandler(ev, key) {
        ev.preventDefault();
        const target = ev.currentTarget;
        const list = getProperty(this.item.data, key);
        const subItemIndex = target.dataset.index;
        switch (target.dataset.action) {
            case 'create':
                const newItem = await Item.create({
                    name: `New ${target.dataset.itemType.titleCase()}`,
                    img: 'icons/svg/upgrade.svg',
                    type: target.dataset.itemType
                }, { temporary: true });
                newItem.data._id = `${randomID(8)}-temp`;
                list.push(newItem.data);
                await this.updateItem(ev, key, list);
                break;
            case 'edit':
                await this.handleListItemEdit(ev, key, list, subItemIndex);
                break;
            case 'delete':
                const subItemData = list[subItemIndex];
                this._childItems.get(subItemData)?.sheet.close();
                this._childItems.delete(subItemData);
                list.splice(subItemIndex, 1);
                await this.updateItem(ev, key, list);
                break;
        }
    }
    async handleDroppedData(event, selectors) {
        event.preventDefault();
        if (!event.dataTransfer) {
            return;
        }
        const dropData = JSON.parse(event.dataTransfer?.getData('text/plain'));
        if (dropData.type != 'Item') {
            return;
        }
        const droppedItem = game.items.get(dropData.id);
        const selector = selectors.find(s => s.expectedType == droppedItem.data.type);
        if (!selector) {
            return;
        }
        const copiedItem = duplicate(droppedItem.data);
        copiedItem._id = `${randomID(8)}-temp`;
        const dataList = getProperty(this.item.data.data, selector.destinationPath);
        dataList.push(copiedItem);
        this.item.sheet._onSubmit(event, { updateData: { [`data.${selector.destinationPath}`]: dataList } });
    }
    /**
     * @override
     */
    async _updateObject(ev, flattenedObject) {
        ev.preventDefault();
        if (this._parentItem) {
            const updatedItem = this._parentList.find(data => data._id == this._sourceItem._id);
            if (!updatedItem) {
                return;
            }
            this.item.data = mergeObject(updatedItem, flattenedObject);
            this.item.parseSummary(this.item.data);
            await this.updateItem(ev, this._childDataPath, this._parentList);
        }
        else {
            const summary = this.item.data.data.summary;
            if (summary) {
                this.item.parseSummary(mergeObject(this.item.data, flattenedObject, { inplace: false }));
                flattenedObject = flattenObject(mergeObject(flattenedObject, { data: { summary } }));
            }
            await super._updateObject(ev, flattenedObject);
        }
    }
    initializeChildData(sourceItem, parentItem, childDataPath, parentList) {
        this._parentItem = parentItem;
        this._sourceItem = sourceItem;
        this._parentList = parentList;
        this._childDataPath = childDataPath;
    }
    async handleListItemEdit(ev, key, list, index) {
        const sourceItem = list[index];
        if (!sourceItem) {
            return;
        }
        let childItem = this._childItems.get(sourceItem);
        if (!childItem) {
            const newItem = await this.newChildItem(sourceItem);
            const rawSheet = newItem.sheet;
            rawSheet.initializeChildData(sourceItem, this.item, key, list);
            childItem = newItem;
            this._childItems.set(sourceItem, newItem);
        }
        childItem.render(true);
    }
    async updateItem(ev, key, list) {
        if (this._parentItem) {
            const parentList = getProperty(this._parentItem.data, this._childDataPath);
            const itemToUpdateIndex = parentList.findIndex((data) => data._id == this.item._id);
            if (itemToUpdateIndex >= 0) {
                parentList[itemToUpdateIndex] = this.item.data;
            }
            this.item.prepareMNM3EData();
            this.item.sheet.render(false);
            await this._parentItem.sheet._onSubmit(ev, { updateData: { [this._childDataPath]: parentList } });
        }
        else {
            this.item.update({ [key]: list }, {});
        }
    }
    async newChildItem(sourceItem) {
        // https://foundryvtt.com/api/Item.html - actor in initialization vector
        const newItem = await Item.create(sourceItem, { temporary: true });
        newItem.options.actor = this.item.actor;
        newItem.data._id = sourceItem._id;
        return newItem;
    }
    async onAppMenu(ev) {
        ev.preventDefault();
        const button = ev.currentTarget;
        let app;
        switch (button.dataset.action) {
            case 'summary-builder':
                app = new SummaryBuilder(this.item);
                break;
            default:
                throw new Error(`unknown action: ${button.dataset.action}`);
        }
        app._updateObject = this.item.sheet._updateObject.bind(this);
        app.render(true);
    }
    async onCheckControl(ev) {
        ev.preventDefault();
        const button = ev.currentTarget;
        const dataPath = button.dataset.dataPath;
        const targetArray = getProperty(this.item.data, dataPath);
        switch (button.dataset.action) {
            case 'create':
                const newFormula = { op: '', value: '', dataPath: '' };
                targetArray.push(newFormula);
                break;
            case 'delete':
                targetArray.splice(Number(button.dataset.index), 1);
                break;
            default:
                throw new Error(`unknown action: ${button.dataset.action}`);
        }
        await this._onSubmit(ev, { updateData: { [dataPath]: targetArray } });
    }
    async onItemSummary(ev) {
        ev.preventDefault();
        const li = $(ev.currentTarget).closest('.item');
        const expandedClass = 'expanded';
        const summaryClass = 'list-item-summary';
        if (li.hasClass(expandedClass)) {
            const summary = li.children(`.${summaryClass}`);
            summary.slideUp(200, () => summary.remove());
        }
        else {
            const dataPath = li.closest('.item-list').data('data-path');
            const sourceItem = getProperty(this.item.data, dataPath)[li.data('item-index')];
            let item = this._childItems.get(sourceItem);
            if (!item) {
                item = await this.newChildItem(sourceItem);
            }
            const div = await item.sheet.renderListItemContents();
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass(expandedClass);
    }
}
