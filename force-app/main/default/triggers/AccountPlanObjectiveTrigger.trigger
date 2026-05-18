trigger AccountPlanObjectiveTrigger on AccountPlanObjective (before delete) {
    AccountPlanObjectiveTriggerHandler.handleBeforeDelete(Trigger.old);
}
