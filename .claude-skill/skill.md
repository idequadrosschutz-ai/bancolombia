---
description: Cria protótipos interativos de Screen Flows do Salesforce em HTML (com identidade visual Lightning/SLDS) e os converte em componentes LWC reais prontos para deploy. Use quando o usuário pedir para criar, prototipar, simular ou implementar um Screen Flow, wizard multi-etapas, ou fluxo de criação de registro no Salesforce. Também use para converter um protótipo HTML existente em LWC.
---

# Skill: Salesforce Screen Flow → LWC

Você é especialista em transformar processos de negócio Salesforce em dois formatos:
1. **Protótipo HTML interativo** — simula a interface Lightning para validação com stakeholders
2. **Componente LWC real** — pronto para deploy no Salesforce org

---

## MODO 1 — PROTÓTIPO HTML INTERATIVO

### Quando usar
Quando o usuário quer validar o fluxo com stakeholders antes de implementar, ou precisa de uma demo sem acesso ao org.

### O que entregar
Um único arquivo `<nome_do_fluxo>.html` auto-contido com:
- Interface Lightning Design System (SLDS) fiel ao Salesforce
- Wizard multi-etapas com barra de progresso e indicador de passos
- Todas as telas do fluxo navegáveis
- Validações simuladas no frontend
- Dados mock representativos do cliente

### Estrutura visual obrigatória

```
┌─────────────────────────────────────┐
│ [Header Salesforce NavBar]          │
│ [Tab bar] [Breadcrumb]              │
├─────────────────────────────────────┤
│ Modal overlay escurecido            │
│ ┌─────────────────────────────────┐ │
│ │ Header: Título + Badge F00X     │ │
│ │ ██████░░░░ Progress bar         │ │
│ │ ①──②──③──④  Wizard steps       │ │
│ ├─────────────────────────────────┤ │
│ │ BODY: conteúdo da tela atual    │ │
│ ├─────────────────────────────────┤ │
│ │ Footer: [Anterior] [Próximo▶]   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Variáveis CSS Lightning obrigatórias
```css
:root {
  --sf-blue: #0176d3;
  --sf-blue-dark: #014486;
  --sf-blue-light: #e8f4fd;
  --sf-brand: #032d60;
  --sf-n3: #c9c7c5;
  --sf-t: #080707;
  --sf-t3: #706e6b;
  --sf-ok: #2e844a;
  --sf-ok-bg: #eff7ef;
  --sf-err: #ba0517;
  --sf-err-bg: #fff1ef;
  --sf-bdr: #e5e5e5;
}
```

### Padrões de componentes

**Campo somente leitura (auto-preenchido):**
```html
<input class="sf-inp sf-ro" readonly value="Valor" />
<span class="sf-auto">⚡ Auto: NomeCampo__c</span>
```

**Tabela com checkboxes (contas/oportunidades):**
```html
<table class="sf-tbl">
  <thead><tr><th></th><th>Nome</th><th>Status</th></tr></thead>
  <tbody>
    <tr>
      <td><input type="checkbox" class="sf-ck" onchange="toggleItem(id, this.checked)"/></td>
      <td>Nome do registro</td>
      <td><span class="sf-pill sf-p-ok">Elegível</span></td>
    </tr>
  </tbody>
</table>
```

**Alert/notificação:**
```html
<div class="sf-al sf-al-i"> <!-- sf-al-ok, sf-al-e, sf-al-w -->
  <i class="ti ti-info-circle"></i>
  <span>Mensagem aqui</span>
</div>
```

**Tela de decisão (SIM/NÃO):**
```html
<div class="sf-dec">
  <div class="sf-dec-ic">?</div>
  <h3>Deseja incluir objetivos?</h3>
  <p>Descrição da decisão</p>
  <div class="sf-dec-btns">
    <button onclick="goSim()">Sim</button>
    <button onclick="goNao()">Não agora</button>
  </div>
</div>
```

**Tela de sucesso:**
```html
<div class="sf-ok-sc">
  <div class="sf-ok-ic">✓</div>
  <div class="sf-ok-ti">Registro criado com sucesso</div>
  <div class="sf-metrics">
    <div class="sf-mt"><div class="sf-mv">1</div><div class="sf-ml">Account Plan</div></div>
  </div>
</div>
```

### Lógica JavaScript — padrão obrigatório

```javascript
// Estado global
let st = {
  step: 1,
  // campos do formulário
  planName: '', startDate: '', endDate: '', notes: '',
  // listas de seleção
  selectedIds: [],
  objectives: [],
  // flags de tela especial
  showIneligible: false,
  showSelector: false,
};

// Renderização — SEMPRE um único ponto de entrada
function render() {
  wiz();   // atualiza wizard/progress
  const b = document.getElementById('body');
  const f = document.getElementById('foot');
  if (st.step === 1) { b.innerHTML = s1(); f.innerHTML = f1(); }
  else if (st.step === 2 && !st.showIneligible) { b.innerHTML = s2(); f.innerHTML = f2(); }
  else if (st.showIneligible) { b.innerHTML = sInel(); f.innerHTML = fInel(); }
  // ... etc
}

// Navegação com validação
function go2() {
  if (!st.planName.trim()) { alert('Campo obrigatório.'); return; }
  st.step = 2;
  render();
}
```

---

## MODO 2 — COMPONENTE LWC REAL

### Quando usar
Quando o protótipo já foi validado e é hora de implementar para deploy no Salesforce org.

### Estrutura de arquivos a criar

```
force-app/main/default/
├── lwc/<nomeComponente>/
│   ├── <nomeComponente>.html          ← template com <template if:true>
│   ├── <nomeComponente>.js            ← lógica, @wire, @track, NavigationMixin
│   ├── <nomeComponente>.css           ← estilos SLDS customizados
│   └── <nomeComponente>.js-meta.xml  ← exposto em lightning__RecordPage
└── classes/
    ├── <NomeController>.cls           ← @AuraEnabled, with sharing
    └── <NomeController>.cls-meta.xml
```

### Convenções de nome
- Componente: `bc_createAccountPlan` (camelCase com prefixo do cliente)
- Classe Apex: `BC_CreateAccountPlanController` (PascalCase com prefixo)
- Objetos custom: `bc_AccountPlan__c` (prefixo lowercase)

### Template HTML — padrão de wizard

```html
<template>
  <!-- Header sempre visível -->
  <header class="flow-header">
    <h2>{title}</h2>
    <span class="slds-badge">F001 · Paso {currentStep} de {totalSteps}</span>
  </header>

  <!-- Progress bar -->
  <div class="flow-progress-bar">
    <div class="flow-progress-fill" style={progressStyle}></div>
  </div>

  <!-- Wizard indicator -->
  <div class="flow-wizard">
    <template for:each={wizardSteps} for:item="ws">
      <div key={ws.id} class={ws.dotClass}>{ws.label}</div>
      <template if:false={ws.isLast}>
        <div key={ws.connKey} class={ws.connClass}></div>
      </template>
    </template>
  </div>

  <!-- Telas condicionais -->
  <template if:true={isStep1}> <!-- Tela 1 --> </template>
  <template if:true={isStep2}> <!-- Tela 2 --> </template>
</template>
```

### JS — padrão obrigatório

```javascript
import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import methodName from '@salesforce/apex/ControllerName.methodName';
import FIELD from '@salesforce/schema/Object.Field';

export default class ComponentName extends NavigationMixin(LightningElement) {
    @api recordId;
    @track currentStep = 1;

    @wire(getRecord, { recordId: '$recordId', fields: [FIELD] })
    record;

    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }

    get progressStyle() {
        return `width: ${(this.currentStep / this.totalSteps) * 100}%`;
    }

    get wizardSteps() {
        return this.stepNames.map((name, i) => {
            const n = i + 1;
            const done = n < this.currentStep;
            const active = n === this.currentStep;
            return {
                id: n, name,
                label: done ? '✓' : String(n),
                dotClass: `flow-wd ${done ? 'flow-wd-done' : active ? 'flow-wd-active' : ''}`,
                connClass: `flow-wc ${done ? 'flow-wc-done' : ''}`,
                connKey: `conn-${n}`,
                isLast: n === this.stepNames.length,
            };
        });
    }

    handleNext() {
        if (this.currentStep === 1 && !this.validateStep1()) return;
        this.currentStep += 1;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
```

### Apex — padrão obrigatório

```apex
public with sharing class BC_CreateXxxController {

    @AuraEnabled
    public static Id createRecord(
        Id accountId,
        String planName
        // ... outros params
    ) {
        // 1. Validar Custom Permission se necessário
        if (!FeatureManagement.checkPermission('Nome_Permission')) {
            throw new AuraHandledException('Sem permissão.');
        }

        // 2. Criar registro principal
        Object__c rec = new Object__c(
            Name = planName,
            bc_Account__c = accountId
        );
        insert rec;

        // 3. Criar registros relacionados em lotes (nunca um a um em loop)
        List<Related__c> relList = new List<Related__c>();
        // ... popula lista
        insert relList;

        return rec.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<RelatedObject__c> getRelatedRecords(Id accountId) {
        return [
            SELECT Id, Name, Field__c
            FROM RelatedObject__c
            WHERE Account__c = :accountId
            WITH SECURITY_ENFORCED
            LIMIT 200
        ];
    }
}
```

### meta.xml — padrão

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <objects><object>Account</object></objects>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

---

## PROCESSO DE TRABALHO

### Ao receber um pedido de Screen Flow

1. **Descoberta** — perguntar:
   - Qual objeto principal aciona o fluxo? (ex: Account, Opportunity)
   - Quantas telas? Quais campos em cada tela?
   - Há validações de negócio (regras, permissões, datas)?
   - Há registros relacionados a criar? (ex: Stakeholders, Objetivos)
   - Qual o resultado final (registro criado, campo atualizado, email enviado)?

2. **Entrega Modo 1 (HTML):** arquivo único, dados mock, navegável

3. **Entrega Modo 2 (LWC):** estrutura SFDX completa:
   - `sfdx-project.json`
   - `.forceignore`
   - `CLAUDE.md` com contexto completo do projeto
   - 4 arquivos LWC + Apex controller + meta XMLs

4. **CLAUDE.md obrigatório** — deve conter:
   - Tabela de objetos e campos
   - Regras de negócio
   - Mapa do fluxo (numerado)
   - Estado atual (✅ / ⏳ por tela)
   - Próximos passos
   - Comandos `sf` para deploy

---

## CHECKLIST DE QUALIDADE

Antes de entregar qualquer artefato, verificar:

**HTML Protótipo:**
- [ ] Abre em browser sem dependências externas além de CDN
- [ ] Wizard com progresso funcional
- [ ] Todas as telas navegáveis (avançar e voltar)
- [ ] Validações client-side nos campos obrigatórios
- [ ] Tela de sucesso ao final
- [ ] Dados mock realistas para o cliente

**LWC Real:**
- [ ] `@api recordId` presente
- [ ] `@wire getRecord` para dados do registro pai
- [ ] `get isStepN()` para cada tela
- [ ] `get wizardSteps()` retorna array com `key`, `isLast`
- [ ] `handleNext()` valida antes de avançar
- [ ] Apex usa `with sharing` e `WITH SECURITY_ENFORCED`
- [ ] Inserts em lote (nunca dentro de for loop)
- [ ] `CLAUDE.md` criado com estado atual e próximos passos
