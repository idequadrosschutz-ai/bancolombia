import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'AccountPlan.Name',
    'AccountPlan.StartDate',
    'AccountPlan.EndDate',
    'AccountPlan.Owner.Name',
    'AccountPlan.Account.Name',
    'AccountPlan.RelationshipStrengths',
    'AccountPlan.RelationshipWeaknesses',
    'AccountPlan.RelationshipOpportunities',
    'AccountPlan.RelationshipThreats',
    'AccountPlan.AccountCompetitiveStrengths',
    'AccountPlan.AccountCmptvWeaknesses',
    'AccountPlan.AccountCompetitors'
];

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

export default class Bc_DOFAMatriz extends LightningElement {
    @api recordId;

    planName      = '—';
    accountName   = '—';
    ownerName     = '—';
    startDate     = '';
    endDate       = '';
    isLoading     = true;
    hasError      = false;

    _debilidades   = '';
    _oportunidades = '';
    _fortalezas    = '';
    _amenazas      = '';
    _compStrengths = '';
    _compWeaknesses= '';
    _competitors   = '';

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ data, error }) {
        if (data) {
            const f = data.fields;
            this.planName     = f?.Name?.value || '—';
            this.accountName  = f?.Account?.value?.fields?.Name?.value || '—';
            this.ownerName    = f?.Owner?.value?.fields?.Name?.value || '—';
            this.startDate    = this._formatDate(f?.StartDate?.value);
            this.endDate      = this._formatDate(f?.EndDate?.value);
            this._debilidades   = this._sanitize(f?.RelationshipWeaknesses?.value);
            this._oportunidades = this._sanitize(f?.RelationshipOpportunities?.value);
            this._fortalezas    = this._sanitize(f?.RelationshipStrengths?.value);
            this._amenazas      = this._sanitize(f?.RelationshipThreats?.value);
            this._compStrengths = this._sanitize(f?.AccountCompetitiveStrengths?.value);
            this._compWeaknesses= this._sanitize(f?.AccountCmptvWeaknesses?.value);
            this._competitors   = this._sanitize(f?.AccountCompetitors?.value);
            this.isLoading = false;
        } else if (error) {
            this.hasError  = true;
            this.isLoading = false;
        }
    }

    // Remove inline background-color and color that clash with the dark theme
    _sanitize(html) {
        if (!html) return '';
        return html
            .replace(/background-color\s*:\s*[^;"]*/gi, 'background-color: transparent')
            .replace(/\bcolor\s*:\s*(?!white|#fff|rgb\(255)[^;"]*/gi, 'color: inherit');
    }

    _formatDate(raw) {
        if (!raw) return '—';
        const d = new Date(raw + 'T00:00:00');
        return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
    }

    get vigencia() {
        return `${this.startDate} → ${this.endDate}`;
    }

    get hasDebilidades()    { return !!this._debilidades; }
    get hasOportunidades()  { return !!this._oportunidades; }
    get hasFortalezas()     { return !!this._fortalezas; }
    get hasAmenazas()       { return !!this._amenazas; }
    get hasCompStrengths()  { return !!this._compStrengths; }
    get hasCompWeaknesses() { return !!this._compWeaknesses; }
    get hasCompetitors()    { return !!this._competitors; }
}
