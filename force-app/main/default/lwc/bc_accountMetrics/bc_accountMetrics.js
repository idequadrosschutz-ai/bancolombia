import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getAccountMetrics from '@salesforce/apex/BC_AccountMetricsController.getAccountMetrics';

export default class Bc_accountMetrics extends LightningElement {
    @api recordId;

    accountId;
    accountName = '—';
    openOpportunities = 0;
    revenueLastQuarter = '$0';
    revenueThisQuarter = '$0';
    winRateLastQuarter = '0%';
    winRateThisQuarter = '0%';

    @wire(getRecord, { recordId: '$recordId', fields: ['AccountPlan.AccountId', 'AccountPlan.Account.Name'] })
    wiredPlan({ data }) {
        if (data) {
            this.accountName = data.fields?.Account?.value?.fields?.Name?.value || '—';
            this.accountId   = data.fields?.AccountId?.value;
        }
    }

    @wire(getAccountMetrics, { accountId: '$accountId' })
    wiredMetrics({ data }) {
        if (data) {
            this.openOpportunities  = data.openOpportunities  ?? 0;
            this.revenueLastQuarter = this._fmt(data.revenueLastQuarter);
            this.revenueThisQuarter = this._fmt(data.revenueThisQuarter);
            this.winRateLastQuarter = (data.winRateLastQuarter ?? 0) + '%';
            this.winRateThisQuarter = (data.winRateThisQuarter ?? 0) + '%';
        }
    }

    get opportunitiesUrl() {
        return this.accountId
            ? `/lightning/r/Account/${this.accountId}/related/Opportunities/view`
            : '#';
    }

    _fmt(val) {
        if (!val) return '$0';
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000)    return `$${(val / 1000).toFixed(0)}K`;
        return `$${val}`;
    }
}
