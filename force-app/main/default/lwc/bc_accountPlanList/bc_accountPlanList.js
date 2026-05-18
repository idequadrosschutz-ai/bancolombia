import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getAccountPlans from '@salesforce/apex/BC_CreateAccountPlanController.getAccountPlans';

import ACCOUNT_NAME_FIELD   from '@salesforce/schema/Account.Name';
import ACCOUNT_TYPE_FIELD   from '@salesforce/schema/Account.bc_TipoGrupo__c';
import ACCOUNT_HAS_PLAN     from '@salesforce/schema/Account.bc_HasAccountPlan__c';

const ACCOUNT_FIELDS = [ACCOUNT_NAME_FIELD, ACCOUNT_TYPE_FIELD, ACCOUNT_HAS_PLAN];

const STATUS_LABEL = {
    'Active':       { label: 'Activo',       cls: 'plan-status-active'  },
    'Draft':        { label: 'Borrador',      cls: 'plan-status-draft'   },
    'Not Started':  { label: 'No iniciado',   cls: 'plan-status-draft'   },
    'Completed':    { label: 'Completado',    cls: 'plan-status-done'    },
    'Cancelled':    { label: 'Cancelado',     cls: 'plan-status-cancel'  },
};

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

export default class Bc_accountPlanList extends LightningElement {
    @api recordId;

    plans        = [];
    isLoading    = true;
    hasError     = false;
    showWizard   = false;
    _wiredPlans;

    @wire(getRecord, { recordId: '$recordId', fields: ACCOUNT_FIELDS })
    account;

    @wire(getAccountPlans, { accountId: '$recordId' })
    wiredPlans(result) {
        this._wiredPlans = result;
        const { data, error } = result;
        if (data) {
            this.plans = data.map(p => ({
                ...p,
                startFmt:    this._fmtDate(p.StartDate),
                endFmt:      this._fmtDate(p.EndDate),
                statusLabel: (STATUS_LABEL[p.Status] || { label: p.Status, cls: 'plan-status-draft' }).label,
                statusCls:   (STATUS_LABEL[p.Status] || { cls: 'plan-status-draft' }).cls,
                tipoCls:     p.bc_TipoPlano__c === 'Grupo_Regional' ? 'plan-tipo-regional'
                           : p.bc_TipoPlano__c === 'Grupo_Local'    ? 'plan-tipo-local'
                           : 'plan-tipo-individual',
                tipoLabel:   p.bc_TipoPlano__c === 'Grupo_Regional' ? 'Grupo Regional'
                           : p.bc_TipoPlano__c === 'Grupo_Local'    ? 'Grupo Local'
                           : 'Individual',
            }));
            this.isLoading = false;
        } else if (error) {
            this.hasError = true;
            this.isLoading = false;
        }
    }

    get accountName() {
        return getFieldValue(this.account.data, ACCOUNT_NAME_FIELD) || '—';
    }

    get accountType() {
        return getFieldValue(this.account.data, ACCOUNT_TYPE_FIELD) || 'Individual';
    }

    get isEligible() {
        // Account is eligible if it has no active plan with overlapping dates for today
        const today = new Date().toISOString().slice(0, 10);
        const hasActiveOverlap = this.plans.some(
            p => p.Status === 'Active' && p.StartDate <= today && p.EndDate >= today
        );
        return !hasActiveOverlap;
    }

    get hasPlans() { return this.plans.length > 0; }
    get plansCount() { return this.plans.length; }

    get eligibilityMsg() {
        return this.isEligible
            ? 'Esta cuenta puede crear un nuevo plan de negocio.'
            : 'Esta cuenta ya tiene un plan activo vigente.';
    }

    get eligibilityClass() {
        return this.isEligible ? 'eligibility-ok' : 'eligibility-blocked';
    }

    get eligibilityIcon() {
        return this.isEligible ? 'utility:check' : 'utility:info';
    }

    handleNewPlan() {
        this.showWizard = true;
    }

    handleViewPlan(event) {
        const id = event.currentTarget.dataset.id;
        window.open(`/${id}`, '_blank');
    }

    handleBackdropClick() {
        this.showWizard = false;
    }

    stopProp(event) {
        event.stopPropagation();
    }

    handleWizardClose() {
        this.showWizard = false;
        refreshApex(this._wiredPlans);
    }

    _fmtDate(raw) {
        if (!raw) return '—';
        const d = new Date(raw + 'T00:00:00');
        return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
    }
}
