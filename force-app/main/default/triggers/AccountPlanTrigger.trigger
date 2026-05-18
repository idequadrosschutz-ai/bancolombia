trigger AccountPlanTrigger on AccountPlan (before insert, before update) {
    AccountPlanTriggerHandler.handleBeforeInsertUpdate(Trigger.new, Trigger.oldMap);
}
