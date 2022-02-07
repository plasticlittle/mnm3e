export const preloadTemplates = async function () {
    const templatePaths = [
        // Add paths to "systems/foundryvtt-mutants-and-masterminds/templates"
        // Actor
        "systems/mnm3e/templates/actors/parts/character-core.html",
        "systems/mnm3e/templates/actors/parts/character-catalog.html",
        "systems/mnm3e/templates/actors/parts/character-origins.html",
        "systems/mnm3e/templates/actors/parts/character-notes.html",
        "systems/mnm3e/templates/actors/parts/actor-effects.html",
        "systems/mnm3e/templates/actors/parts/actor-notes.html",
        "systems/mnm3e/templates/actors/parts/npc-core.html",
        // Item
        "systems/mnm3e/templates/items/parts/header-sheet.html",
        "systems/mnm3e/templates/items/parts/expressions-sheet.html",
        "systems/mnm3e/templates/items/parts/actions-sheet.html",
        "systems/mnm3e/templates/items/parts/activations-sheet.html",
        "systems/mnm3e/templates/items/parts/list-sheet.html",
        "systems/mnm3e/templates/items/parts/list-item-sheet.html",
        "systems/mnm3e/templates/items/parts/cost-sheet.html",
    ];
    return loadTemplates(templatePaths);
};
