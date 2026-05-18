import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createAccountPlan from '@salesforce/apex/BC_CreateAccountPlanController.createAccountPlan';

import ACCOUNT_NAME_FIELD from '@salesforce/schema/Account.Name';
import ACCOUNT_TYPE_FIELD from '@salesforce/schema/Account.bc_TipoGrupo__c';
import ACCOUNT_HAS_PLAN_FIELD from '@salesforce/schema/Account.bc_HasAccountPlan__c';

const ACCOUNT_FIELDS = [ACCOUNT_NAME_FIELD, ACCOUNT_TYPE_FIELD, ACCOUNT_HAS_PLAN_FIELD];

const STEP_NAMES = ['Datos del plan', 'Participantes', 'Objetivos', 'Confirmación'];

export default class Bc_createAccountPlan extends NavigationMixin(LightningElement) {
    @api recordId;

    @track currentStep = 1;
    @track planName = '';
    @track startDate = '';
    @track endDate = '';
    @track notes = '';
    @track selectedAccounts = [];
    @track objectives = [];
    @track createdPlanId = null;
    @track hasPreviousPlan = false;
    @track previousPlanName = '';

    @wire(getRecord, { recordId: '$recordId', fields: ACCOUNT_FIELDS })
    account;

    get accountName() {
        return getFieldValue(this.account.data, ACCOUNT_NAME_FIELD) || '—';
    }

    get accountTypeRaw() {
        return getFieldValue(this.account.data, ACCOUNT_TYPE_FIELD) || 'Individual';
    }

    get tipoPlanLabel() {
        const t = this.accountTypeRaw;
        if (t === 'Grupo_Local') return 'Grupo Local';
        if (t === 'Grupo_Regional') return 'Grupo Regional';
        return 'Individual';
    }

    get tipoPlanPillClass() {
        const t = this.accountTypeRaw;
        if (t === 'Grupo_Local') return 'slds-badge flow-pill-blue';
        if (t === 'Grupo_Regional') return 'slds-badge flow-pill-orange';
        return 'slds-badge flow-pill-purple';
    }

    // ── Wizard computed props ──

    get progressStyle() {
        return `width: ${(this.currentStep / 4) * 100}%`;
    }

    get wizardSteps() {
        return STEP_NAMES.map((name, i) => {
            const n = i + 1;
            const done = n < this.currentStep;
            const active = n === this.currentStep;
            return {
                id: n,
                name,
                label: done ? '✓' : String(n),
                dotClass: `flow-wd ${done ? 'flow-wd-done' : active ? 'flow-wd-active' : ''}`,
                textClass: `flow-wl ${active ? 'flow-wl-active' : ''}`,
                connClass: `flow-wc ${done ? 'flow-wc-done' : ''}`,
                connKey: `conn-${n}`,
                isLast: n === 4,
            };
        });
    }

    // ── Step visibility ──

    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }

    get selectedAccountsCount() { return this.selectedAccounts.length; }
    get objectivesCount() { return this.objectives.length; }

    // ── Field change handler ──

    handleFieldChange(event) {
        const { name, value } = event.target;
        if (name === 'planName') this.planName = value;
        else if (name === 'startDate') this.startDate = value;
        else if (name === 'endDate') this.endDate = value;
        else if (name === 'notes') this.notes = value;
    }

    // ── Navigation ──

    handleNext() {
        if (this.currentStep === 1 && !this.validateStep1()) return;
        this.currentStep += 1;
    }

    handleBack() {
        if (this.currentStep > 1) this.currentStep -= 1;
    }

    validateStep1() {
        if (!this.planName.trim()) {
            this.showToast('Error', 'El nombre del plan es obligatorio.', 'error');
            return false;
        }
        if (!this.startDate) {
            this.showToast('Error', 'La fecha de inicio es obligatoria.', 'error');
            return false;
        }
        if (!this.endDate) {
            this.showToast('Error', 'La fecha de fin es obligatoria.', 'error');
            return false;
        }
        if (this.startDate >= this.endDate) {
            this.showToast('Error', 'La fecha de fin debe ser posterior a la fecha de inicio.', 'error');
            return false;
        }
        return true;
    }

    // ── Save ──

    async handleSave() {
        try {
            this.createdPlanId = await createAccountPlan({
                accountId: this.recordId,
                planName: this.planName,
                startDate: this.startDate,
                endDate: this.endDate,
                notes: this.notes,
                tipoPlan: this.accountTypeRaw,
                selectedAccountIds: this.selectedAccounts,
                objectives: JSON.stringify(this.objectives),
            });
            this.currentStep = 4;
        } catch (error) {
            this.showToast('Error', error?.body?.message || 'Error al guardar el plan.', 'error');
        }
    }

    // ── Reset / View ──

    handleReset() {
        this.currentStep = 1;
        this.planName = '';
        this.startDate = '';
        this.endDate = '';
        this.notes = '';
        this.selectedAccounts = [];
        this.objectives = [];
        this.createdPlanId = null;
    }

    handleViewRecord() {
        if (!this.createdPlanId) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.createdPlanId,
                actionName: 'view',
            },
        });
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view',
            },
        });
    }

    // ── Utils ──

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
