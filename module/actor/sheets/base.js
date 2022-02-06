import ScoreConfig from "../../apps/score-config.js";
import { prepareActiveEffectCategories, onManagedActiveEffect } from "../../active-effects.js";
import { getMeasurement } from "../../measurements.js";
export default class ActorSheet3e extends ActorSheet {
    /**
     * @override
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['mnm3e', 'sheet', 'actor'],
            width: 662,
            height: 620,
            tabs: [{ navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'core' }]
        });
    }
    /**
     * @override
     */
    getData() {
        const sheetData = super.getData();
        sheetData.config = CONFIG.MNM3E;
        Object.entries(sheetData.data.data.abilities).forEach(([name, ability]) => {
            ability.label = CONFIG.MNM3E.abilities[name];
        });
        Object.entries(sheetData.data.data.skills).forEach(([name, skill]) => {
            skill.label = CONFIG.MNM3E.skills[name];
        });
        Object.entries(sheetData.data.data.defenses).forEach(([name, defense]) => {
            defense.label = CONFIG.MNM3E.defenses[name];
        });
        this.prepareItems(sheetData);
        const speedMeasurement = getMeasurement('distance', sheetData.data.data.attributes.movement.speed);
        sheetData.movement = {
            main: `${CONFIG.MNM3E.movement.speed} ${sheetData.data.data.attributes.movement.speed} (${speedMeasurement.value} ${speedMeasurement.units})`,
            special: Object.entries(sheetData.data.data.attributes.movement).map(([name, value]) => {
                if (name == 'speed' || value == 0) {
                    return undefined;
                }
                const measurement = getMeasurement('distance', value);
                return `${name.titleCase()} ${value} (${measurement.value} ${measurement.units})`;
            }).filter(m => m).reduce((prev, current) => prev ? `${prev}, ${current}` : current, ''),
        };
        sheetData.effects = prepareActiveEffectCategories(this.document.effects);
        sheetData.summary = [
            {
                name: 'data.info.identity',
                value: sheetData.data.data.info.identity,
                localizedKey: 'MNM3E.Identity',
            },
            {
                name: 'data.info.groupAffiliation',
                value: sheetData.data.data.info.groupAffiliation,
                localizedKey: 'MNM3E.GroupAffiliation',
            },
            {
                name: 'data.info.baseOfOperations',
                value: sheetData.data.data.info.baseOfOperations,
                localizedKey: 'MNM3E.BaseOfOperations',
            },
        ];
        return sheetData;
    }
    /**
     * @override
     */
    activateListeners(html) {
        html.find('.effect-control').on('click', ev => onManagedActiveEffect(ev, this.actor));
        html.find('.config-button').on('click', this.onConfigMenu.bind(this));
        html.find('.item .item-name h4').on('click', this.onItemSummary.bind(this));
        html.find('.ability-name').on('click', this.onRollAbilityCheck.bind(this));
        html.find('.defense-name').on('click', this.onRollDefenseCheck.bind(this));
        html.find('.skill-name, .subskill-name').on('click', this.onRollSkillCheck.bind(this));
        [
            'power',
            'advantage',
            'equipment',
        ].forEach(itemType => html.find(`.item-${itemType}-controls .item-control`).on('click', this.onEmbeddedItemEvent.bind(this)));
        if (this.actor.isOwner) {
            html.find('.item .item-image').on('click', this.onItemRoll.bind(this));
            html.find('.max-points .lock-button').on('click', this.onMaxPointsOverrideToggle.bind(this));
        }
        super.activateListeners(html);
    }
    prepareItems(incomingData) {
        const data = incomingData;
        const powers = [];
        const advantages = [];
        const equipment = [];
        data.items.reduce((arr, item) => {
            let targetArray;
            switch (item.type) {
                case 'power':
                    targetArray = arr[0];
                    break;
                case 'advantage':
                    targetArray = arr[1];
                    break;
                case 'equipment':
                    targetArray = arr[2];
            }
            if (!targetArray) {
                return arr;
            }
            targetArray.push(item);
            return arr;
        }, [powers, advantages, equipment]);
        // Additional headers for item lists
        const standardHeaders = ['MNM3E.Activation', 'MNM3E.Action'].map(l => game.i18n.localize(l));
        data.powers = powers;
        data.powerSections = {
            headers: standardHeaders,
            rows: powers.map(p => [
                CONFIG.MNM3E.activationTypes[p.data.effects[0]?.data.activation.type.value],
                CONFIG.MNM3E.actionTypes[p.data.effects[0]?.data.action.type.value],
            ]),
        };
        data.advantages = advantages;
        data.advantageSections = {
            headers: standardHeaders,
            rows: advantages.map(a => [
                CONFIG.MNM3E.activationTypes[a.data.activation.type.value],
                CONFIG.MNM3E.actionTypes[a.data.action.type.value],
            ]),
        };
        data.equipment = equipment;
        data.equipmentSections = {
            headers: standardHeaders,
            rows: equipment.map(e => [
                CONFIG.MNM3E.activationTypes[e.data.effects[0]?.data.activation.type.value],
                CONFIG.MNM3E.actionTypes[e.data.effects[0]?.data.action.type.value],
            ]),
        };
    }
    onItemRoll(event) {
        event.preventDefault();
        const itemID = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemID);
        item?.roll();
    }
    onEmbeddedItemEvent(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const closestItem = button.closest('li.item');
        let item;
        switch (button.dataset.action) {
            case 'create':
                const itemType = button.dataset.itemType;
                const itemData = {
                    name: game.i18n.format('MNM3E.ItemNewFormat', { type: itemType.capitalize() }),
                    img: 'icons/svg/upgrade.svg',
                    type: itemType,
                };
                this.actor.createOwnedItem(itemData);
                break;
            case 'edit':
                item = this.actor.items.get(closestItem?.dataset.itemId);
                item?.sheet.render(true);
                break;
            case 'delete':
                this.actor.deleteOwnedItem(closestItem?.dataset.itemId);
                break;
            case 'favorite':
                const favoriteKey = 'isFavorite';
                item = this.actor.items.get(closestItem?.dataset.itemId);
                item?.setFlag('mnm3e', favoriteKey, !(item.getFlag('mnm3e', favoriteKey) ?? false));
                break;
        }
    }
    async onConfigMenu(ev) {
        ev.preventDefault();
        const button = ev.currentTarget;
        let app;
        switch (button.dataset.action) {
            case 'score-config':
                app = new ScoreConfig(button.dataset.scorePath, button.dataset.scoreConfigPath, this.object);
                break;
            default:
                throw new Error(`unknown action: ${button.dataset.action}`);
        }
        app.render(true);
    }
    async onItemSummary(ev) {
        ev.preventDefault();
        const li = $(ev.currentTarget).parents('.item');
        const expandedClass = 'expanded';
        const summaryClass = 'list-item-summary';
        if (li.hasClass(expandedClass)) {
            const summary = li.children(`.${summaryClass}`);
            summary.slideUp(200, () => summary.remove());
        }
        else {
            const item = this.actor.items.get(li.data('item-id'));
            const div = await item.sheet.renderListItemContents();
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass(expandedClass);
    }
    async onRollAbilityCheck(ev) {
        ev.preventDefault();
        await this.actor.rollAbility(ev.currentTarget.parentElement.dataset.ability);
    }
    async onRollDefenseCheck(ev) {
        ev.preventDefault();
        await this.actor.rollDefense(ev.currentTarget.parentElement.dataset.defense);
    }
    async onRollSkillCheck(ev) {
        ev.preventDefault();
        const container = ev.currentTarget.parentElement;
        const skill = container.dataset.skill;
        const subskill = container.dataset.subskill;
        await this.actor.rollSkill(skill, subskill);
    }
    async onMaxPointsOverrideToggle(ev) {
        ev.preventDefault();
        await this.actor.setFlag('mnm3e', 'overrideMaxPoints', !this.actor.getFlag('mnm3e', 'overrideMaxPoints'));
    }
}
