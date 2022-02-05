export const onActiveEffect = (actor, change) => {
    const itemIdInActor = change.effect.data.origin.slice(change.effect.data.origin.lastIndexOf('.') + 1);
    const item = actor.items.get(itemIdInActor);
    const parent = change.effect.parent;
    let data;
    if (item) {
        data = item.data;
    }
    else if (['advantage', 'power', 'equipment'].includes(parent.data.type)) {
        data = change.effect.parent.data.data.effects.find((mnmEffect) => mnmEffect.effects.find((e) => e._id == change.effect.data._id));
    }
    else {
        return true;
    }
    let value = change.value.replace('@rank', data.data.rank);
    const parsed = Math.safeEval(value);
    if (Number.isNumeric(parsed)) {
        value = parsed;
    }
    setProperty(actor.data, change.key, value);
};
export const onManagedActiveEffect = (event, owner) => {
    event.preventDefault();
    const target = event.currentTarget;
    const listElement = target.closest('li');
    const effect = listElement.dataset.effectId ? owner.effects.get(listElement.dataset.effectId) : null;
    switch (target.dataset.action) {
        case 'create':
            /*return ActiveEffect.create({
                label: game.i18n.localize('MNM3E.ActiveEffectNew'),
                icon: 'icons/svg/aura.svg',
                origin: owner.uuid,
                'duration.rounds': listElement.dataset.effectType === 'temporary' ? 1 : undefined,
                disabled: listElement.dataset.effectType === 'inactive',
            }, owner)//.create(); */
            return owner.createEmbeddedDocuments("ActiveEffect", [{
                label: game.i18n.localize('MNM3E.ActiveEffectNew'),
                icon: 'icons/svg/aura.svg',
                origin: owner.uuid,
                'duration.rounds': listElement.dataset.effectType === 'temporary' ? 1 : undefined,
                disabled: listElement.dataset.effectType === 'inactive',
            }]);              
        case 'edit':
            return effect.sheet.render(true);
        case 'delete':
            return effect.delete();
        case 'toggle':
            return effect.update({ disabled: !effect.data.disabled });
    }
};

export const prepareActiveEffectCategories = (activeEffects) => {
    const categories = {
        temporary: {
            type: 'temporary',
            label: game.i18n.localize('MNM3E.ActiveEffectTemporary'),
            effects: [],
        },
        passive: {
            type: 'passive',
            label: game.i18n.localize('MNM3E.ActiveEffectPassive'),
            effects: [],
        },
        inactive: {
            type: 'inactive',
            label: game.i18n.localize('MNM3E.ActiveEffectInactive'),
            effects: [],
        },
    };
    activeEffects.forEach(e => {
        e._getSourceName();
        let targetEffect = categories.passive.effects;
        if (e.data.disabled) {
            targetEffect = categories.inactive.effects;
        }
        else if (e.isTemporary) {
            targetEffect = categories.temporary.effects;
        }
        targetEffect.push(e);
    });
    return categories;
};
