/**
 * BC_CreateAccountPlanController
 * AuraEnabled controller for bc_createAccountPlan LWC — Screen Flow F001.
 * Uses FSC standard objects: AccountPlan, AccountPlanObjective, bc_AccountPlanRelationship__c.
 */
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
            !FeatureManagement.checkPermission('Puede_Estructurar_Estrategia_Regional')) {
            throw new AuraHandledException(
                'Você não tem permissão para criar planos de Grupo Regional.'
            );
        }

        // Create Account Plan (FSC standard object)
        AccountPlan plan = new AccountPlan(
            Name          = planName,
            AccountId     = accountId,
            StartDate     = startDate,
            EndDate       = endDate,
            Status        = 'Draft',
            bc_TipoPlano__c = tipoPlan
        );
        insert plan;

        // Create bc_AccountPlanRelationship__c records for participating accounts
        if (selectedAccountIds != null && !selectedAccountIds.isEmpty()) {
            List<bc_AccountPlanRelationship__c> relationships = new List<bc_AccountPlanRelationship__c>();
            for (Id accId : selectedAccountIds) {
                relationships.add(new bc_AccountPlanRelationship__c(
                    bc_AccountPlanId__c = plan.Id,
                    bc_AccountId__c     = accId,
                    bc_Role__c          = 'Participante',
                    bc_IsActive__c      = true
                ));
            }
            insert relationships;

            // Enable Account Plan tab on participant accounts
            List<Account> toUpdate = new List<Account>();
            for (Id accId : selectedAccountIds) {
                toUpdate.add(new Account(Id = accId, bc_HasAccountPlan__c = true));
            }
            update toUpdate;
        }

        // Create AccountPlanObjective records (FSC standard object)
        if (String.isNotBlank(objectives)) {
            List<Object> objList = (List<Object>) JSON.deserializeUntyped(objectives);
            List<AccountPlanObjective> objRecords = new List<AccountPlanObjective>();
            for (Object o : objList) {
                Map<String, Object> obj = (Map<String, Object>) o;
                AccountPlanObjective apo = new AccountPlanObjective(
                    AccountPlanId = plan.Id,
                    Name          = (String) obj.get('name')
                );
                objRecords.add(apo);
            }
            if (!objRecords.isEmpty()) {
                insert objRecords;
            }
        }

        return plan.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<AccountPlan> getAccountPlans(Id accountId) {
        return [
            SELECT Id, Name, StartDate, EndDate, Status, bc_TipoPlano__c
            FROM AccountPlan
            WHERE AccountId = :accountId
            ORDER BY StartDate DESC
            LIMIT 50
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<bc_AccountPlanRelationship__c> getAccountPlanRelationships(Id accountPlanId) {
        return [
            SELECT Id, bc_AccountId__c, bc_AccountId__r.Name, bc_Role__c, bc_IsActive__c
            FROM bc_AccountPlanRelationship__c
            WHERE bc_AccountPlanId__c = :accountPlanId
              AND bc_IsActive__c = true
        ];
    }
}
