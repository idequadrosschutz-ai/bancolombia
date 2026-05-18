# Projeto Bancolombia — Account Plan (F001)

## Contexto do projeto

Implementação Salesforce para **Bancolombia** — módulo de Account Plan.
Este repositório contém os artefatos de um Screen Flow (F001) convertido em componente LWC real.

Documentação de referência do fluxo: `~/Downloads/f001_account_plan_flow.html`  
Protótipo interativo HTML original: `~/Downloads/index.html`

---

## Objetos Salesforce envolvidos

| API Name | Label | Descrição |
|---|---|---|
| `bc_AccountPlan__c` | Account Plan | Registro principal do plano |
| `bc_AccountPlanStakeholder__c` | Account Plan Stakeholder | Contas participantes do plano |
| `bc_AccountPlanObjective__c` | Account Plan Objective | Objetivos vinculados ao plano |
| `bc_AccountPlanRelationship__c` | Account Plan Relationship | Relaciona Account Plan com Account (para related list) |

### Campos principais — bc_AccountPlan__c

| Campo | Tipo | Observação |
|---|---|---|
| `Name` | Text | Nome do plano — obrigatório |
| `StartDate__c` | Date | Data início — obrigatório |
| `EndDate__c` | Date | Data fim — obrigatório |
| `Status__c` | Picklist | Borrador / Active — auto preenchido |
| `Notes__c` | TextArea | Observações — opcional |
| `bc_TipoPlano__c` | Picklist | Individual / Grupo_Local / Grupo_Regional — auto |
| `bc_Account__c` | Lookup(Account) | Conta principal |
| `PreviousPlanId__c` | Lookup(bc_AccountPlan__c) | Plano anterior (pré-carga) |
| `OwnerId` | Lookup(User) | Dono do registro |

### Campos principais — Account (campos adicionados)

| Campo | Tipo | Observação |
|---|---|---|
| `bc_TipoGrupo__c` | Picklist | Individual / Grupo_Local / Grupo_Regional |
| `bc_HasAccountPlan__c` | Checkbox | Controla visibilidade da aba "Plano de Negócio" |

---

## Regras de negócio (validações C001/C002)

**C001 — Sobreposição de datas:**  
Nenhuma conta pode ter dois Account Plans com datas sobrepostas.

**C002 — Mínimo de planos vigentes:**  
- Conta Individual: mínimo 1 plano ativo
- Conta Grupo: mínimo 1 plano de grupo ativo + 1 plano individual por membro

**Custom Permission — Grupo Regional:**  
Somente usuários com `Pode_Estruturar_Estrategia_Regional` podem criar planos de tipo Grupo Regional.

---

## Fluxo F001 — bc_CreateAccountPlan (13 passos)

```
START
  1. Tela 1 — Dados do plano (Name, StartDate, EndDate, Status, TipoPlan, Notes)
  2. Validação Custom Permission (se Grupo Regional)
  3. Auto: preenchimento bc_TipoPlano__c baseado no tipo de conta
  4. Tela 2 — Contas participantes (tabela com checkbox, pré-seleção do grupo)
  5. Validação C001/C002 via Apex Trigger
  6. Tela elegibilidade — contas não elegíveis (remover ou encerrar)
  7. Auto: pré-carga dados do plano anterior (se existir)
  8. Auto: cria Account Plan Stakeholders para contas selecionadas
  9. Tela 3 — Objetivos (incluir agora? SIM → Tela 4 | NÃO → salvar)
 10. Tela 4 — Criação de objetivo (GoalDefinitionId__c, TargetValue__c, OpportunityId)
 11. Auto: atribuição campos de sistema + Create Records sequencial
 12. Auto: habilita aba Plan de Negocio (bc_HasAccountPlan__c = true) em cada conta
END — Account Plan visível na related list de todas as contas participantes
```

---

## Estado atual do LWC

**Componente:** `bc_createAccountPlan`  
**Localização:** `force-app/main/default/lwc/bc_createAccountPlan/`

| Tela | Status |
|---|---|
| Tela 1 — Dados do plano | ✅ Implementada (wire Account, validações, campos auto) |
| Tela 2 — Contas participantes | ⏳ Pendente (precisa: wire bc_AccountPlanRelationship__c, tabela com checkbox) |
| Tela 3 — Objetivos | ⏳ Pendente (adicionar/remover objetivos, selector de oportunidades) |
| Tela 4 — Confirmação | ⏳ Estrutura pronta, dados reais pendentes |
| Apex controller | ✅ BC_CreateAccountPlanController.cls criado (createAccountPlan method) |

---

## Próximos passos

1. **Tela 2:** Wire para buscar membros do grupo via `bc_AccountPlanRelationship__c`, renderizar tabela com checkboxes, validação C001/C002 chamando Apex
2. **Tela 3:** Componente de objetivos com `lightning-combobox` para GoalDefinition, campo de meta, selector de oportunidades filtradas (excluindo Closed Won/Lost)
3. **Apex:** Adicionar `@AuraEnabled` para buscar membros do grupo e oportunidades elegíveis
4. **Deploy:** `sf org push -o <alias>` após autenticar com `sf org login web`

---

## Comandos úteis

```bash
# Autenticar no org
sf org login web --alias bancolombia-sandbox

# Deploy do componente
sf project deploy start --source-dir force-app --target-org bancolombia-sandbox

# Abrir org
sf org open --target-org bancolombia-sandbox
```

---

## Arquivos de referência

- `~/Downloads/index.html` — protótipo interativo completo das 4 telas (HTML+JS)
- `~/Downloads/f001_account_plan_flow.html` — documentação do fluxo (13 passos)
- `~/Downloads/f001_account_plan_flow_es.html` — versão em espanhol do fluxo
- `~/Downloads/bancolombia_account_plan_flow_v2_reference.html` — referência v2
