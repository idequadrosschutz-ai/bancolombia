/**
 * OpportunityAccountPlanTriggerHandler
 * When bc_AccountPlanObjectiveId__c is set on an Opportunity,
 * auto-fills bc_AccountPlanId__c from the parent AccountPlanObjective.
 */
public with sharing class OpportunityAccountPlanTriggerHandler {

    public static void handleBeforeUpsert(List<Opportunity> opps) {
        Set<Id> objectiveIds = new Set<Id>();
        for (Opportunity o : opps) {
            if (o.bc_AccountPlanObjectiveId__c != null) {
                objectiveIds.add(o.bc_AccountPlanObjectiveId__c);
            }
        }

        if (objectiveIds.isEmpty()) return;

        Map<Id, AccountPlanObjective> objMap = new Map<Id, AccountPlanObjective>([
            SELECT Id, AccountPlanId
            FROM AccountPlanObjective
            WHERE Id IN :objectiveIds
        ]);

        for (Opportunity o : opps) {
            if (o.bc_AccountPlanObjectiveId__c != null && objMap.containsKey(o.bc_AccountPlanObjectiveId__c)) {
                o.bc_AccountPlanId__c = objMap.get(o.bc_AccountPlanObjectiveId__c).AccountPlanId;
            }
        }
    }
}
