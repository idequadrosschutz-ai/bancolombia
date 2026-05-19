trigger OpportunityAccountPlanTrigger on Opportunity (before insert, before update) {
    OpportunityAccountPlanTriggerHandler.handleBeforeUpsert(Trigger.new);
}
