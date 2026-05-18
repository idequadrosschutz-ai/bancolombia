import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'AccountPlan.Account.Name',
    'AccountPlan.RelationshipStrengths',
    'AccountPlan.RelationshipWeaknesses',
    'AccountPlan.RelationshipOpportunities',
    'AccountPlan.RelationshipThreats',
    'AccountPlan.AccountCompetitiveStrengths',
    'AccountPlan.AccountCmptvWeaknesses',
    'AccountPlan.AccountCompetitors'
];

export default class Bc_DOFAMatriz extends LightningElement {
    @api recordId;

    accountName   = '—';
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
            this.accountName    = f?.Account?.value?.fields?.Name?.value || '—';
            this._debilidades   = f?.RelationshipWeaknesses?.value   || '';
            this._oportunidades = f?.RelationshipOpportunities?.value || '';
            this._fortalezas    = f?.RelationshipStrengths?.value     || '';
            this._amenazas      = f?.RelationshipThreats?.value       || '';
            this._compStrengths = f?.AccountCompetitiveStrengths?.value || '';
            this._compWeaknesses= f?.AccountCmptvWeaknesses?.value    || '';
            this._competitors   = f?.AccountCompetitors?.value        || '';
            this.isLoading = false;
        } else if (error) {
            this.hasError  = true;
            this.isLoading = false;
        }
    }

    get hasDebilidades()    { return !!this._debilidades; }
    get hasOportunidades()  { return !!this._oportunidades; }
    get hasFortalezas()     { return !!this._fortalezas; }
    get hasAmenazas()       { return !!this._amenazas; }
    get hasCompStrengths()  { return !!this._compStrengths; }
    get hasCompWeaknesses() { return !!this._compWeaknesses; }
    get hasCompetitors()    { return !!this._competitors; }
}
