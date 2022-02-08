export class rollClass {
    constructor() {
        this.rollFormular = ""
        console.log("Construct Rollobject")
        this.succ = 0
    }    

    toConsole() {
        console.log(
            game.i18n.localize(this.attrName) + ": " + this.attrValue,
            game.i18n.localize(this.skillName) + ": " + this.skillValue,
            "Roll: " + this.rollFormula + 
            " diff: " + this.difficulty +             
            " Bonus: " + this.bonus
            )
    }
    
    rollDices() {
        this.rollObject = new Roll(this.rollFormula, {prof: 0, strMod: 0});
        this.rollObject.evaluate();
        return this.rollObject;
    }    
}