import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getAccountMetrics from '@salesforce/apex/BC_AccountMetricsController.getAccountMetrics';

import ACCOUNT_NAME from '@salesforce/schema/bc_AccountPlan__c.bc_Account__r.Name';
import ACCOUNT_ID   from '@salesforce/schema/bc_AccountPlan__c.bc_Account__c';

const FIELDS = [ACCOUNT_NAME, ACCOUNT_ID];
const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

export default class Bc_accountMetrics extends LightningElement {
    @api recordId;

    accountId;
    accountName = '—';
    openOpportunities = 0;
    revenueLastQuarter = '$0';
    revenueThisQuarter = '$0';
    winRateLastQuarter = '0%';
    winRateThisQuarter = '0%';

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredPlan({ data, error }) {
        if (data) {
            this.accountName = getFieldValue(data, ACCOUNT_NAME) || '—';
            this.accountId   = getFieldValue(data, ACCOUNT_ID);
        }
    }

    @wire(getAccountMetrics, { accountPlanId: '$recordId' })
    wiredMetrics({ data, error }) {
        if (data) {
            this.openOpportunities  = data.openOpportunities  ?? 0;
            this.revenueLastQuarter = this._fmt(data.revenueLastQuarter);
            this.revenueThisQuarter = this._fmt(data.revenueThisQuarter);
            this.winRateLastQuarter = (data.winRateLastQuarter ?? 0) + '%';
            this.winRateThisQuarter = (data.winRateThisQuarter ?? 0) + '%';
        }
    }

    get hasOpportunities() {
        return this.openOpportunities > 0;
    }

    get donutDash() {
        const pct = Math.min(this.openOpportunities / 20, 1); // 20 = max visual
        return `${CIRCUMFERENCE * pct} ${CIRCUMFERENCE}`;
    }

    get opportunitiesUrl() {
        return this.accountId
            ? `/lightning/r/Account/${this.accountId}/related/Opportunities/view`
            : '#';
    }

    _fmt(val) {
        if (!val && val !== 0) return '$0';
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`;
        return `$${val}`;
    }
}
