trigger AccountPlanStakeholderTrigger on bc_AccountPlanRelationship__c (after insert, after delete) {
    if (Trigger.isAfter && Trigger.isInsert) {
        AccountPlanStakeholderTriggerHandler.handleAfterInsert(Trigger.new);
    }
    if (Trigger.isAfter && Trigger.isDelete) {
        AccountPlanStakeholderTriggerHandler.handleAfterDelete(Trigger.old);
    }
}
