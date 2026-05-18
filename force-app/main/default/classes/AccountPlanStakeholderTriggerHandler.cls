/**
 * AccountPlanStakeholderTriggerHandler
 * Handler for bc_AccountPlanRelationship__c trigger.
 * After insert: set bc_HasAccountPlan__c = true on associated Account.
 * After delete: verifies if any active relationship remains; if not, sets bc_HasAccountPlan__c = false.
 */
public with sharing class AccountPlanStakeholderTriggerHandler {

    /**
     * Called on after insert.
     * Sets bc_HasAccountPlan__c = true for linked Accounts.
     */
    public static void handleAfterInsert(List<bc_AccountPlanRelationship__c> newRecords) {
        Set<Id> accountIds = new Set<Id>();
        for (bc_AccountPlanRelationship__c s : newRecords) {
            if (s.bc_AccountId__c != null) {
                accountIds.add(s.bc_AccountId__c);
            }
        }

        if (accountIds.isEmpty()) {
            return;
        }

        List<Account> toUpdate = new List<Account>();
        for (Id accId : accountIds) {
            toUpdate.add(new Account(Id = accId, bc_HasAccountPlan__c = true));
        }

        update toUpdate;
    }

    /**
     * Called on after delete.
     * If no active relationship remains for an Account, sets bc_HasAccountPlan__c = false.
     */
    public static void handleAfterDelete(List<bc_AccountPlanRelationship__c> oldRecords) {
        Set<Id> accountIds = new Set<Id>();
        for (bc_AccountPlanRelationship__c s : oldRecords) {
            if (s.bc_AccountId__c != null) {
                accountIds.add(s.bc_AccountId__c);
            }
        }

        if (accountIds.isEmpty()) {
            return;
        }

        // Find accounts that still have at least one active relationship
        Set<Id> accountsWithActivePlan = new Set<Id>();
        for (bc_AccountPlanRelationship__c s : [
            SELECT bc_AccountId__c
            FROM bc_AccountPlanRelationship__c
            WHERE bc_AccountId__c IN :accountIds
              AND bc_IsActive__c = true
        ]) {
            accountsWithActivePlan.add(s.bc_AccountId__c);
        }

        List<Account> toUpdate = new List<Account>();
        for (Id accId : accountIds) {
            if (!accountsWithActivePlan.contains(accId)) {
                toUpdate.add(new Account(Id = accId, bc_HasAccountPlan__c = false));
            }
        }

        if (!toUpdate.isEmpty()) {
            update toUpdate;
        }
    }
}
