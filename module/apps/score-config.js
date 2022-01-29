export default class ScoreConfig extends BaseEntitySheet {
    constructor(dataPath, configPath, ...args) {
        super(...args);
        this._dataPath = dataPath;
        this._configPath = configPath;
        this.options.closeOnSubmit = false;
        this.options.submitOnChange = true;
        this.options.submitOnClose = true;
    }
    /**
     * @override
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'systems/mnm3e/templates/apps/score-config.html',
            classes: ['mnm3e', 'sheet', 'app', 'score-config'],
            width: 300,
            height: 'auto',
        });
    }
    /**
     * @override
     */
    get title() {
        return `${game.i18n.localize('MNM3E.ScoreConfig')}: ${this.entity.name}`;
    }
    /**
     * @override
     */
    getData() {
        const scores = getProperty(this.entity.data, this._dataPath);
        Object.entries(scores).forEach(([name, score]) => {
            score.label = getProperty(CONFIG.MNM3E, this._configPath)[name];
        });
        return {
            config: CONFIG.MNM3E,
            scores: scores,
            dataPath: this._dataPath,
        };
    }
    /**
     * @override
     */
    activateListeners(html) {
        html.find('.score-control').on('click', this.onScoreControlClick.bind(this));
        super.activateListeners(html);
    }
    /**
     * @override
     */
    async _updateObject(event, formData) {
        const allScores = getProperty(this.entity.data, this._dataPath);
        const expandedFormData = expandObject(formData);
        Object.entries(allScores).forEach(([scoreName, score]) => {
            if (Array.isArray(score)) {
                for (let i = 0; i < score.length; i++) {
                    const key = `${this._dataPath}.${scoreName}.${i}`;
                    mergeObject(getProperty(expandedFormData, key), score[i], { overwrite: false });
                }
            }
        });
        return super._updateObject(event, expandedFormData);
    }
    async onScoreControlClick(ev) {
        ev.preventDefault();
        const button = ev.currentTarget;
        const scoreType = button.dataset.scoreType;
        const allScores = getProperty(this.entity.data, this._dataPath);
        const targetEntry = Object.entries(allScores).find(([name]) => name == scoreType);
        if (!targetEntry) {
            throw new Error(`Could not find type '${scoreType}'`);
        }
        const targetScore = targetEntry[1];
        if (!targetScore) {
            throw new Error(`targetScore is not defined`);
        }
        switch (button.dataset.action) {
            case 'create':
                const scoreName = await new Promise((resolve) => {
                    new Dialog({
                        title: game.i18n.localize('MNM3E.ScoreNew'),
                        content: `<div class="new-score-dialog">
                                    <label>${game.i18n.localize('MNM3E.ScoreName')}</label>
                                    <input type="text" maxlength="25" autocomplete="new-password" />
                                </div>`,
                        buttons: {
                            ok: {
                                label: game.i18n.localize('MNM3E.OK'),
                                callback: html => resolve(html.find('input')[0].value),
                            },
                            cancel: {
                                label: game.i18n.localize('MNM3E.Cancel'),
                                callback: () => resolve(null),
                            },
                        },
                        close: () => resolve(null),
                        default: 'ok',
                    }, {
                        width: 200,
                        classes: ['dialog', 'new-score'],
                    }).render(true);
                });
                if (!scoreName) {
                    return;
                }
                const newScore = {
                    rank: 0,
                    displayName: scoreName,
                };
                const cleanedName = scoreName.replace(/\s/g, '');
                targetScore.data[cleanedName] = newScore;
                await this.entity.update({ [`${this._dataPath}.${scoreType}`]: targetScore });
                break;
            case 'delete':
                const name = button.dataset.subscoreName;
                delete targetScore.data[name];
                await this.entity.update({ [`${this._dataPath}.${scoreType}.data.-=${name}`]: null });
                break;
            default:
                throw new Error(`Unknown score action: ${button.dataset.action}`);
        }
    }
}
