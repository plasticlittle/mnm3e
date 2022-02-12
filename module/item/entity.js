import { getMeasurement } from "../measurements.js";
import { displayCard } from "../chat.js";
;
;
export default class Item3e extends Item {
    /**
     * @override
     */
    prepareData() {
        super.prepareData();
        this.prepareMNM3EData();
    }
    /**
     * @override
     */
    prepareEmbeddedEntities() {
        if (['power', 'equipment', 'vehicle', 'base'].includes(this.type)) {
            const data = this.data;
            data.effects = [];
            data.data.effects.forEach(effect => {
                data.effects = data.effects.concat(effect.effects);
            });
        }
        super.prepareEmbeddedEntities();
    }
    prepareMNM3EData() {
        this.fixArrays(this.data);
        switch (this.type) {
            case 'advantage':
                this.prepareAdvantageData(this.data);
                break;
            case 'modifier':
                this.prepareModifierData(this.data);
                break;
            case 'effect':
                this.preparePowerEffectData(this.data);
                break;
            case 'equipment':
                this.prepareEquipmentData(this.data);
                break;
            case 'power':
                this.preparePowerData(this.data);
                break;
        }
        this.parseSummary(this.data);
    }
    parseSummary(data) {
        const summary = this.data.data.summary;
        if (summary) {
            summary.parsed = Roll.replaceFormulaData(summary.format, Object.assign({}, {
                name: data.name,
                type: data.type,
                flags: data.flags,
                ...data.data,
                ...summary.data,
            }));
        }
    }
    async roll({ rollMode, powerArrayIndex } = {}) {
        let rollData = {};
        if (this.isOwned) {
            rollData = this.actor?.data.data;
        }
        let cardItem = this.data;
        let effects = [];
        if (['power', 'equipment'].includes(this.data.type)) {
            const config = CONFIG.MNM3E;
            const powerData = this.data.data;
            let needsUpdate = false;
            let targetPower = powerData;
            if (powerArrayIndex !== undefined) {
                cardItem = powerData.powerArray[powerArrayIndex];
                targetPower = cardItem.data;
            }
            effects = (await Promise.all(targetPower.effects.map(async (effect) => {
                this.preparePowerEffectData(effect);
                const result = {
                    canRoll: true,
                    effect,
                    tags: [
                        config.activationTypes[effect.data.activation.type.value],
                        config.actionTypes[effect.data.action.type.value],
                        config.durationTypes[effect.data.activation.duration.type.value],
                    ].filter(t => t),
                };
                if (effect.data.activation.uses.max.value > 0) {
                    if (typeof effect.data.activation.uses.remaining !== 'number') {
                        effect.data.activation.uses.remaining = effect.data.activation.uses.max.value;
                    }
                    needsUpdate = true;
                    const remaining = Math.max(--effect.data.activation.uses.remaining, 0);
                    result.tags.push(game.i18n.format('MNM3E.UsesRemainingFormat', { remaining }));
                    if (remaining <= 0) {
                        effect.data.activation.uses.remaining = remaining;
                        result.canRoll = false;
                        return result;
                    }
                }
                const prepareFormula = (detail) => {
                    const parts = duplicate(detail.formula.value);
                    for (let i = 0; i < detail.formula.numOverrides; i++) {
                        let dataSource = parts[i].dataPath;
                        if (dataSource == 'formula') {
                            dataSource = parts[i].value;
                        }
                        else {
                            dataSource = `@${dataSource}`;
                        }
                        parts[i].value = Roll.replaceFormulaData(dataSource, {
                            ...rollData,
                            rank: detail.formula.overrideRanks[i],
                        });
                    }
                    return parts.map(pair => `${pair.op} ${pair.value || '@' + pair.dataPath}`).join(' ');
                };
                const getRoll = async (detail) => {
                    const formula = prepareFormula(detail);
                    const roll = new Roll(`1d20 ${formula}`, { ...rollData, rank: effect.data.rank });
                    roll.template = await roll.render();
                    return roll;
                };
                if (effect.data.activation.check.rollType.value == 'required') {
                    result.activationRoll = await getRoll(effect.data.activation.check);
                }
                if (effect.data.action.roll.attack.rollType.value == 'required') {
                    result.attackRoll = await getRoll(effect.data.action.roll.attack);
                }
                let rangeTag = CONFIG.MNM3E.rangeTypes[effect.data.activation.range.type.value];
                if (effect.data.activation.range.type.value == 'ranged') {
                    let rank = 0;
                    switch (effect.data.activation.range.multiplier.value) {
                        case 'positive':
                            rank = effect.data.activation.range.multiplier.overrideRank;
                            break;
                        case 'negative':
                            rank = -effect.data.activation.range.multiplier.overrideRank;
                            break;
                        default:
                            break;
                    }
                    const ranges = [
                        getMeasurement('attack-distance', rank++),
                        getMeasurement('attack-distance', rank++),
                        getMeasurement('attack-distance', rank),
                    ];
                    rangeTag += ` ${ranges.map(r => r.value).join('/')} ${ranges[0].units}`;
                }
                result.tags.push(rangeTag);
                if (effect.data.activation.range.area.value) {
                    result.tags.push(config.areaTypes[effect.data.activation.range.area.value]);
                }
                if (effect.data.action.roll.resist.rollType.value == 'required') {
                    let formula = prepareFormula(effect.data.action.roll.resist);
                    formula = Roll.replaceFormulaData(formula, { ...rollData, rank: effect.data.rank });
                    result.resistInfo = {
                        dc: Math.safeEval(formula),
                        rollDetail: effect.data.action.roll.resist,
                    };
                }
                return result;
            }))).filter(d => d);
            if (needsUpdate) {
                this.update({ data: { powerArray: powerData.powerArray, effects: powerData.effects } });
            }
        }
        const token = this.actor?.token;
        const templateData = {
            actor: this.actor,
            config: CONFIG.MNM3E,
            sceneTokenId: token ? `${token.scene._id}.${token.id}` : null,
            item: cardItem,
            data: cardItem.data,
            effects: effects,
        };
        return displayCard('effects', ChatMessage.getSpeaker({
            actor: this.actor,
            token,
        }), templateData, {
            rollMode,
            flags: { 'mnm3e.effectInfo': effects },
        });
    }
    prepareAdvantageData(data) {
        data.data.summary.data = {
            cost: data.data.cost.value,
        };
        if (data.data.summary.format == '') {
            data.data.summary.format = `@name @rank`;
        }
    }
    prepareModifierData(data) {
        data.data.summary.data = {
            cost: data.data.cost.value,
        };
        if (data.data.summary.format == '') {
            data.data.summary.format = `@name @rank`;
        }
    }
    preparePowerEffectData(data) {
        const overrideValues = [
            'data.activation.check.rollType',
            'data.activation.check.targetScore.type',
            'data.activation.check.targetScore.custom',
            'data.activation.consume.type',
            'data.activation.consume.target',
            'data.activation.consume.amount',
            'data.activation.duration.type',
            'data.activation.range.area',
            'data.activation.range.type',
            'data.activation.range.multiplier',
            'data.activation.uses.amount',
            'data.activation.uses.max',
            'data.activation.uses.per',
            'data.activation.type',
            'data.action.roll.attack.rollType',
            'data.action.roll.attack.targetScore.type',
            'data.action.roll.attack.targetScore.custom',
            'data.action.roll.resist.rollType',
            'data.action.roll.resist.targetScore.type',
            'data.action.roll.resist.targetScore.custom',
            'data.action.type',
        ];
        overrideValues.forEach(key => {
            if (getProperty(data, `${key}.override`)) {
                setProperty(data, key, {
                    override: false,
                    value: getProperty(data, `${key}.originalValue`),
                    originalValue: undefined,
                    overrideRank: undefined,
                });
            }
        });
        const overrideArrayValues = [
            'data.activation.check.formula',
            'data.action.roll.attack.formula',
            'data.action.roll.resist.formula',
        ];
        overrideArrayValues.forEach(key => {
            if (getProperty(data, `${key}.override`)) {
                const offset = getProperty(data, `${key}.numOverrides`) || 0;
                setProperty(data, key, {
                    override: false,
                    value: getProperty(data, `${key}.value`).slice(offset),
                    numOverrides: undefined,
                    overrideRanks: undefined,
                });
            }
        });
        if (data.data.summary.format == '') {
            data.data.summary.format = `@prefix @name @rank @suffix`;
        }
        const prefix = [];
        const suffix = [];
        data.data.modifiers.forEach(modifier => {
            overrideValues.forEach(key => {
                const value = getProperty(modifier, `${key}.value`);
                if (value) {
                    setProperty(data, key, {
                        override: true,
                        value,
                        originalValue: getProperty(data, `${key}.originalValue`) || getProperty(data, `${key}.value`),
                        overrideRank: modifier.data.rank,
                    });
                }
            });
            overrideArrayValues.forEach(key => {
                const value = getProperty(modifier, `${key}.value`);
                if (value && value.length > 0) {
                    const currentValue = getProperty(data, `${key}.value`);
                    const offset = getProperty(data, `${key}.numOverrides`) || 0;
                    const overrideRanks = (getProperty(data, `${key}.overrideRanks`) || []);
                    overrideRanks.push(modifier.data.rank);
                    setProperty(data, key, {
                        override: true,
                        numOverrides: offset + 1,
                        overrideRanks,
                        value: duplicate(value).concat(currentValue),
                    });
                }
            });
            let targetList = prefix;
            if (modifier.data.summary.position == 'suffix') {
                targetList = suffix;
            }
            if (modifier.data.summary.parsed) {
                targetList.push(modifier.data.summary.parsed);
            }
        });
        if (data.data.activation.uses.max.value > 0 && typeof data.data.activation.uses.remaining !== 'number') {
            data.data.activation.uses.remaining = data.data.activation.uses.max.value;
        }
        data.data.summary.data = {
            prefix: prefix.join(' '),
            suffix: suffix.join(' '),
        };
        [
            data.data.activation.check,
            data.data.action.roll.attack,
            data.data.action.roll.resist,
        ].forEach(rollDetail => {
            if (rollDetail.targetScore.type.value == 'custom') {
                rollDetail.targetScore.label = rollDetail.targetScore.custom.value;
            }
            else {
                const scoreParts = rollDetail.targetScore.type.value.split('.');
                const baseScore = `${scoreParts[0]}.${scoreParts[1]}`;
                rollDetail.targetScore.label = getProperty(CONFIG.MNM3E, baseScore);
            }
        });
    }
    preparePowerData(data) {
        const totalPowerCost = this.calculateEffectCost(data);
        data.data.totalCost = totalPowerCost + data.data.powerArray.length;
    }
    prepareEquipmentData(data) {
        data.data.totalCost = Math.max(1, this.calculateEffectCost(data));
    }
    calculateEffectCost(data) {
        let totalPowerCost = 0;
        const deferredCosts = [];
        data.data.effects.forEach(effect => {
            let perRankCost = 0;
            let flatCost = 0;
            const evaluateCostType = (costType, rank, cost, discountPer) => {
                switch (costType) {
                    case 'flat':
                        flatCost += cost * rank;
                        break;
                    case 'perRank':
                        perRankCost += cost;
                        break;
                    case 'discount':
                        deferredCosts.push({ modifier: cost, discountPer: !discountPer || discountPer < 1 ? 1 : discountPer });
                        break;
                }
            };
            evaluateCostType(effect.data.cost.type, effect.data.rank, effect.data.cost.value, effect.data.cost.discountPer);
            effect.data.modifiers.forEach(modifier => evaluateCostType(modifier.data.cost.type, modifier.data.rank, modifier.data.cost.value, modifier.data.cost.discountPer));
            if (perRankCost < 1) {
                perRankCost = 1 / (Math.abs(perRankCost) + 2);
            }
            let totalRankCost = perRankCost * effect.data.rank;
            if (totalRankCost + flatCost >= 1) {
                totalRankCost += flatCost;
            }
            else {
                totalRankCost = Math.min(totalRankCost, 1);
            }
            totalPowerCost = totalPowerCost + totalRankCost;
        });
        deferredCosts.forEach(dc => {
            const quotient = totalPowerCost / dc.discountPer;
            totalPowerCost += quotient * dc.modifier;
        });
        return totalPowerCost;
    }
    fixArrays(data) {
        [
            'data.expressions',
            'data.activation.check.formula.value',
            'data.action.roll.attack.formula.value',
            'data.action.roll.resist.formula.value',
            'data.effects',
            'data.modifiers',
        ].forEach(dataPath => {
            const value = getProperty(data, dataPath);
            if (value && !Array.isArray(value)) {
                setProperty(data, dataPath, Object.values(value).map(v => v));
            }
        });
    }
    static activateChatListeners(html) {
        html.on('click', '.card-content button', this.onChatCardAction.bind(this));
        html.on('click', '.hidable-toggle, .hidable', this.onChatCardToggleHidable.bind(this));
    }
    static onChatCardToggleHidable(ev) {
        ev.preventDefault();
        const toggle = $(ev.currentTarget);
        let hidable = toggle;
        if (!hidable.hasClass('hidable')) {
            hidable = toggle.siblings('.hidable');
        }
        hidable.slideToggle();
    }
    static async onChatCardAction(ev) {
        ev.preventDefault();
        const button = ev.currentTarget;
        button.disabled = true;
        const card = button.closest('.chat-card');
        const messageId = card.closest('.message').dataset.messageId;
        const message = game.messages.get(messageId);
        const actor = this.getChatCardActor(card);
        if (!actor) {
            return;
        }
        const effectInfo = message.getFlag('mnm3e', 'effectInfo')[button.dataset.effectIndex];
        switch (button.dataset.action) {
            case 'resist':
                if (!effectInfo.resistInfo) {
                    return;
                }
                this.getCurrentTargets().forEach(t => t.actor.rollResist(effectInfo.resistInfo.dc, effectInfo.resistInfo.rollDetail.targetScore));
                break;
            default:
                throw new Error(`unknown action: ${button.dataset.action}`);
        }
        button.disabled = false;
    }
    static getChatCardActor(card) {
        const sceneTokenKey = card.dataset.sceneTokenId;
        if (sceneTokenKey) {
            const [sceneId, tokenId] = sceneTokenKey.split('.');
            const scene = game.scenes.get(sceneId);
            if (!scene) {
                return null;
            }
            const tokenData = scene.getEmbeddedEntity("Token", tokenId);
            if (!tokenData) {
                return null;
            }
            return new Token(tokenData).actor;
        }
        return game.actors.get(card.dataset.actorId) || null;
    }
    static getCurrentTargets() {
        let targets = canvas.tokens.controlled.filter((t) => !!t.actor);
        if (targets.length == 0 && game.user.character) {
            targets = game.user.character.getActiveTokens();
        }
        if (targets.length == 0) {
            ui.notifications.warn(game.i18n.localize('MNM3E.ActionWarningNoToken'));
        }
        return targets;
    }
}
