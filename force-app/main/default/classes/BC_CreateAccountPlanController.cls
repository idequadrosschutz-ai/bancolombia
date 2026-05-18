public with sharing class BC_CreateAccountPlanController {

    @AuraEnabled
    public static Id createAccountPlan(
        Id accountId,
        String planName,
        Date startDate,
        Date endDate,
        String notes,
        String tipoPlan,
        List<Id> selectedAccountIds,
        String objectives
    ) {
        // Validate custom permission for Grupo Regional
        if (tipoPlan == 'Grupo_Regional' &&
            !FeatureManagement.checkPermission('Pode_Estruturar_Estrategia_Regional')) {
            throw new AuraHandledException(
                'Você não tem permissão para criar planos de Grupo Regional.'
            );
        }

        // Create Account Plan
        bc_AccountPlan__c plan = new bc_AccountPlan__c(
            Name            = planName,
            bc_Account__c   = accountId,
            StartDate__c    = startDate,
            EndDate__c      = endDate,
            Notes__c        = notes,
            bc_TipoPlano__c = tipoPlan,
            Status__c       = 'Borrador'
        );
        insert plan;

        // Create Stakeholders
        if (selectedAccountIds != null && !selectedAccountIds.isEmpty()) {
            List<bc_AccountPlanStakeholder__c> stakeholders = new List<bc_AccountPlanStakeholder__c>();
            for (Id accId : selectedAccountIds) {
                stakeholders.add(new bc_AccountPlanStakeholder__c(
                    bc_AccountPlanId__c = plan.Id,
                    bc_AccountId__c     = accId
                ));
            }
            insert stakeholders;

            // Enable Account Plan tab on participant accounts
            List<Account> toUpdate = new List<Account>();
            for (Id accId : selectedAccountIds) {
                toUpdate.add(new Account(Id = accId, bc_HasAccountPlan__c = true));
            }
            update toUpdate;
        }

        // Create Objectives
        if (String.isNotBlank(objectives)) {
            List<Object> objList = (List<Object>) JSON.deserializeUntyped(objectives);
            List<bc_AccountPlanObjective__c> objRecords = new List<bc_AccountPlanObjective__c>();
            for (Object o : objList) {
                Map<String, Object> obj = (Map<String, Object>) o;
                objRecords.add(new bc_AccountPlanObjective__c(
                    bc_AccountPlanId__c    = plan.Id,
                    GoalDefinitionId__c    = (String) obj.get('goal'),
                    TargetValue__c         = Decimal.valueOf((String) obj.get('target')),
                    OpportunityId__c       = obj.containsKey('oppId') ? (Id) obj.get('oppId') : null
                ));
            }
            if (!objRecords.isEmpty()) insert objRecords;
        }

        return plan.Id;
    }
}
