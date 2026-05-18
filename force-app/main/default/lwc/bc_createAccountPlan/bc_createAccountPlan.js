import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createAccountPlan from '@salesforce/apex/BC_CreateAccountPlanController.createAccountPlan';
import searchAccounts from '@salesforce/apex/BC_CreateAccountPlanController.searchAccounts';

import ACCOUNT_NAME_FIELD from '@salesforce/schema/Account.Name';
import ACCOUNT_TYPE_FIELD from '@salesforce/schema/Account.bc_TipoGrupo__c';

const ACCOUNT_FIELDS = [ACCOUNT_NAME_FIELD, ACCOUNT_TYPE_FIELD];
const STEP_NAMES = ['Datos del plan', 'Participantes', 'Objetivos', 'Confirmación'];

export default class Bc_createAccountPlan extends NavigationMixin(LightningElement) {
    @api recordId;

    @track currentStep = 1;
    @track isSaving = false;

    // Tela 1 — basic
    @track planName = '';
    @track startDate = '';
    @track endDate = '';
    @track notes = '';
    @track accountVision = '';
    @track callingStrategy = '';

    // Tela 1 — SWOT
    @track swotF = '';
    @track swotD = '';
    @track swotO = '';
    @track swotA = '';

    // Tela 1 — Competitive
    @track compStrengths = '';
    @track compWeaknesses = '';
    @track competitors = '';

    // Tela 2 — Participantes
    @track searchTerm = '';
    @track searchResults = [];
    @track selectedAccounts = [];
    @track isSearching = false;

    // Tela 3 — Objetivos
    @track showObjForm = false;
    @track objectives = [];
    @track objName = '';
    @track objDescription = '';

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

    get isGroupPlan() {
        const t = this.accountTypeRaw;
        return t === 'Grupo_Local' || t === 'Grupo_Regional';
    }

    get progressStyle() {
        return `width: ${(this.currentStep / 4) * 100}%`;
    }

    get wizardSteps() {
        return STEP_NAMES.map((name, i) => {
            const n = i + 1;
            const done = n < this.currentStep;
            const active = n === this.currentStep;
            return {
                id: n, name,
                label: done ? '✓' : String(n),
                dotClass: `flow-wd ${done ? 'flow-wd-done' : active ? 'flow-wd-active' : ''}`,
                textClass: `flow-wl ${active ? 'flow-wl-active' : ''}`,
                connClass: `flow-wc ${done ? 'flow-wc-done' : ''}`,
                connKey: `conn-${n}`,
                isLast: n === 4,
            };
        });
    }

    get saveBtnLabel() { return this.isSaving ? 'Guardando...' : 'Guardar plan'; }
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }

    get selectedAccountsCount() { return this.selectedAccounts.length; }
    get objectivesCount() { return this.objectives.length; }
    get hasObjectives() { return this.objectives.length > 0; }
    get hasSelectedAccounts() { return this.selectedAccounts.length > 0; }
    get hasSearchResults() { return this.searchResults.length > 0; }
    get noSearchResults() {
        return !this.isSearching && this.searchTerm.length >= 2 && this.searchResults.length === 0;
    }

    // ── Field handlers ──

    handleFieldChange(event) {
        const { name, value } = event.target;
        switch (name) {
            case 'planName':       this.planName       = value; break;
            case 'startDate':      this.startDate      = value; break;
            case 'endDate':        this.endDate        = value; break;
            case 'notes':          this.notes          = value; break;
            case 'accountVision':  this.accountVision  = value; break;
            case 'callingStrategy':this.callingStrategy= value; break;
            case 'swotF':          this.swotF          = value; break;
            case 'swotD':          this.swotD          = value; break;
            case 'swotO':          this.swotO          = value; break;
            case 'swotA':          this.swotA          = value; break;
            case 'compStrengths':  this.compStrengths  = value; break;
            case 'compWeaknesses': this.compWeaknesses = value; break;
            case 'competitors':    this.competitors    = value; break;
            default: break;
        }
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
            this.showToast('Error', 'La fecha de fin debe ser posterior a la de inicio.', 'error');
            return false;
        }
        return true;
    }

    // ── Tela 2: search participants ──

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm.length >= 2) {
            this.isSearching = true;
            searchAccounts({ searchTerm: this.searchTerm, excludeId: this.recordId })
                .then(results => {
                    const selectedIds = new Set(this.selectedAccounts.map(a => a.id));
                    this.searchResults = results
                        .filter(r => !selectedIds.has(r.Id))
                        .map(r => ({
                            id: r.Id,
                            Name: r.Name,
                            tipo: r.bc_TipoGrupo__c || 'Individual',
                        }));
                    this.isSearching = false;
                })
                .catch(() => { this.isSearching = false; });
        } else {
            this.searchResults = [];
        }
    }

    handleAddAccount(event) {
        const { id, name, tipo } = event.currentTarget.dataset;
        if (!this.selectedAccounts.some(a => a.id === id)) {
            this.selectedAccounts = [...this.selectedAccounts, { id, Name: name, tipo }];
        }
        this.searchResults = [];
        this.searchTerm = '';
    }

    handleRemoveAccount(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedAccounts = this.selectedAccounts.filter(a => a.id !== id);
    }

    // ── Tela 3: objectives ──

    handleToggleObjForm() {
        this.showObjForm = !this.showObjForm;
        this.objName = '';
        this.objDescription = '';
    }

    handleObjFieldChange(event) {
        const { name, value } = event.target;
        if (name === 'objName') this.objName = value;
        else if (name === 'objDescription') this.objDescription = value;
    }

    handleAddObjective() {
        if (!this.objName.trim()) {
            this.showToast('Error', 'El nombre del objetivo es obligatorio.', 'error');
            return;
        }
        this.objectives = [...this.objectives, {
            id: Date.now(),
            name: this.objName.trim(),
            description: this.objDescription.trim(),
        }];
        this.objName = '';
        this.objDescription = '';
        this.showObjForm = false;
    }

    handleRemoveObjective(event) {
        const id = Number(event.currentTarget.dataset.id);
        this.objectives = this.objectives.filter(o => o.id !== id);
    }

    // ── Save ──

    async handleSave() {
        this.isSaving = true;
        try {
            this.createdPlanId = await createAccountPlan({
                accountId: this.recordId,
                planName: this.planName,
                startDate: this.startDate,
                endDate: this.endDate,
                notes: this.notes,
                accountVision: this.accountVision,
                callingStrategy: this.callingStrategy,
                relStrengths: this.swotF,
                relWeaknesses: this.swotD,
                relOpportunities: this.swotO,
                relThreats: this.swotA,
                compStrengths: this.compStrengths,
                compWeaknesses: this.compWeaknesses,
                competitors: this.competitors,
                tipoPlan: this.accountTypeRaw,
                selectedAccountIds: this.selectedAccounts.map(a => a.id),
                objectives: JSON.stringify(this.objectives),
            });
            this.currentStep = 4;
        } catch (error) {
            this.showToast('Error', error?.body?.message || 'Error al guardar el plan.', 'error');
        } finally {
            this.isSaving = false;
        }
    }

    // ── Reset / View ──

    handleReset() {
        this.currentStep = 1;
        this.planName = ''; this.startDate = ''; this.endDate = ''; this.notes = '';
        this.accountVision = ''; this.callingStrategy = '';
        this.swotF = ''; this.swotD = ''; this.swotO = ''; this.swotA = '';
        this.compStrengths = ''; this.compWeaknesses = ''; this.competitors = '';
        this.selectedAccounts = []; this.objectives = [];
        this.createdPlanId = null; this.showObjForm = false;
        this.searchTerm = ''; this.searchResults = [];
    }

    handleViewRecord() {
        if (!this.createdPlanId) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.createdPlanId, actionName: 'view' },
        });
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.recordId, actionName: 'view' },
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
