import ActorSheet3e from "./base.js";
export default class ActorSheet3eCharacter extends ActorSheet3e {
    /**
     * @override
     */
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.classes?.push('character');
        return mergeObject(opts, {
            template: 'systems/mnm3e/templates/actors/character-sheet.html',
        });
    }
    /**
     * @override
     */
    getData() {
        const sheetData = super.getData();
        return sheetData;
    }
    /**
     * @override
     */
    prepareItems(incomingData) {
        super.prepareItems(incomingData);
        const data = incomingData;
        const isFavorite = (item) => item.flags.mnm3e?.isFavorite;
        data.favoritePowers = data.powers.filter(isFavorite);
        data.favoriteAdvantages = data.advantages.filter(isFavorite);
        data.favoriteEquipment = data.equipment.filter(isFavorite);
        data.favoriteVehicle = data.vehicle.filter(isFavorite);
        data.favoriteBase = data.base.filter(isFavorite);
        data.favorites = [
            { label: 'MNM3E.FavoritePowers', items: data.favoritePowers, type: 'power' },
            { label: 'MNM3E.FavoriteAdvantages', items: data.favoriteAdvantages, type: 'advantage' },
            { label: 'MNM3E.FavoriteEquipment', items: data.favoriteEquipment, type: 'equipment' },
            { label: 'MNM3E.FavoriteVehicle', items: data.favoriteVehicle, type: 'vehicle' },
            { label: 'MNM3E.FavoriteBase', items: data.favoriteBase, type: 'base' },
        ];
    }
}
