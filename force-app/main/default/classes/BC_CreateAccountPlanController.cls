/**
 * BC_CreateAccountPlanController
 * AuraEnabled controller for bc_createAccountPlan LWC — Screen Flow F001.
 */
public with sharing class BC_CreateAccountPlanController {

    @AuraEnabled
    public static Id createAccountPlan(
        Id accountId,
        String planName,
        Date startDate,
        Date endDate,
        String notes,
        String accountVision,
        String callingStrategy,
        String relStrengths,
        String relWeaknesses,
        String relOpportunities,
        String relThreats,
        String compStrengths,
        String compWeaknesses,
        String competitors,
        String tipoPlan,
        List<Id> selectedAccountIds,
        String objectives
    ) {
        if (tipoPlan == 'Grupo_Regional' &&
            !FeatureManagement.checkPermission('Puede_Estructurar_Estrategia_Regional')) {
            throw new AuraHandledException(
                'No tienes permiso para crear planes de Grupo Regional.'
            );
        }

        AccountPlan plan = new AccountPlan(
            Name                          = planName,
            AccountId                     = accountId,
            StartDate                     = startDate,
            EndDate                       = endDate,
            Status                        = 'Draft',
            bc_TipoPlano__c               = tipoPlan,
            Notes                         = notes,
            AccountVision                 = accountVision,
            CallingStrategy               = callingStrategy,
            RelationshipStrengths         = relStrengths,
            RelationshipWeaknesses        = relWeaknesses,
            RelationshipOpportunities     = relOpportunities,
            RelationshipThreats           = relThreats,
            AccountCompetitiveStrengths   = compStrengths,
            AccountCmptvWeaknesses        = compWeaknesses,
            AccountCompetitors            = competitors
        );
        insert plan;

        // For group plans: auto-load group members from bc_GrupoEconomico__c
        Set<Id> allParticipantIds = new Set<Id>();
        if (selectedAccountIds != null) {
            allParticipantIds.addAll(selectedAccountIds);
        }

        if (tipoPlan == 'Grupo_Local' || tipoPlan == 'Grupo_Regional') {
            List<Account> groupMembers = getGroupMembers(accountId);
            for (Account member : groupMembers) {
                allParticipantIds.add(member.Id);
            }
        }

        if (!allParticipantIds.isEmpty()) {
            List<bc_AccountPlanRelationship__c> rels = new List<bc_AccountPlanRelationship__c>();
            for (Id accId : allParticipantIds) {
                rels.add(new bc_AccountPlanRelationship__c(
                    bc_AccountPlanId__c = plan.Id,
                    bc_AccountId__c     = accId,
                    bc_Role__c          = 'Participante',
                    bc_IsActive__c      = true
                ));
            }
            insert rels;

            List<Account> toUpdate = new List<Account>();
            for (Id accId : allParticipantIds) {
                toUpdate.add(new Account(Id = accId, bc_HasAccountPlan__c = true));
            }
            update toUpdate;
        }

        // Create AccountPlanObjective records
        if (String.isNotBlank(objectives)) {
            List<Object> objList = (List<Object>) JSON.deserializeUntyped(objectives);
            List<AccountPlanObjective> objRecords = new List<AccountPlanObjective>();
            for (Object o : objList) {
                Map<String, Object> obj = (Map<String, Object>) o;
                objRecords.add(new AccountPlanObjective(
                    AccountPlanId = plan.Id,
                    Name          = (String) obj.get('name')
                ));
            }
            if (!objRecords.isEmpty()) insert objRecords;
        }

        return plan.Id;
    }

    /**
     * Returns accounts that belong to the same economic group as the given account.
     * Uses bc_GrupoEconomico__c lookup on Account.
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> getGroupMembers(Id accountId) {
        // Find the group this account belongs to
        List<Account> mainAccount = [
            SELECT Id, bc_GrupoEconomico__c, bc_TipoGrupo__c
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];

        if (mainAccount.isEmpty() || mainAccount[0].bc_GrupoEconomico__c == null) {
            return new List<Account>();
        }

        Id grupoId = mainAccount[0].bc_GrupoEconomico__c;

        return [
            SELECT Id, Name, bc_TipoGrupo__c
            FROM Account
            WHERE bc_GrupoEconomico__c = :grupoId
              AND Id != :accountId
            ORDER BY Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String searchTerm, Id excludeId) {
        String q = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        return [
            SELECT Id, Name, bc_TipoGrupo__c
            FROM Account
            WHERE Name LIKE :q
              AND Id != :excludeId
            ORDER BY Name
            LIMIT 10
        ];
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
