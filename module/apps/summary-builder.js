export default class SummaryBuilder extends FormApplication {
    /**
     * @override
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'systems/mnm3e/templates/apps/summary-builder.html',
            classes: ['mnm3e', 'sheet', 'app', 'summary-builder'],
            width: 300,
            height: 'auto',
        });
    }
    /**
     * @override
     */
    get title() {
        return `${game.i18n.localize('MNM3E.SummaryBuilder')}: ${this.object.name}`;
    }
    /**
     * @override
     */
    getData() {
        this.object.data.config = CONFIG.MNM3E;
        return this.object.data;
    }
    /**
     * @override
     */
    activateListeners(html) {
        html.find('.save-control').on('click', this.onSave.bind(this));
        super.activateListeners(html);
    }
    async onSave(ev) {
        ev.preventDefault();
        const itemData = this.object.data;
        const summary = itemData.data.summary;
        const form = $(this.form);
        const position = form.find('select[name="data.summary.position');
        if (position.length > 0) {
            summary.position = position.val();
        }
        summary.format = form.find('input[name="data.summary.format"]').val();
        this.object.parseSummary(this.object.data);
        const parseUpdate = { data: { summary } };
        await this._onSubmit(ev, { updateData: parseUpdate });
    }
}
