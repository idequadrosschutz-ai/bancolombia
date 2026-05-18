/**
 * AccountPlanObjectiveTriggerHandler
 * Handler for AccountPlanObjective trigger — C003 validation.
 */
public with sharing class AccountPlanObjectiveTriggerHandler {

    /**
     * Called on before delete.
     * C003: Cannot delete the only active objective of a plan.
     */
    public static void handleBeforeDelete(List<AccountPlanObjective> oldObjectives) {
        Set<Id> planIds = new Set<Id>();
        for (AccountPlanObjective obj : oldObjectives) {
            if (obj.AccountPlanId != null) {
                planIds.add(obj.AccountPlanId);
            }
        }

        if (planIds.isEmpty()) {
            return;
        }

        // Count active objectives per plan
        Map<Id, Integer> planActiveCount = new Map<Id, Integer>();
        for (AggregateResult ar : [
            SELECT AccountPlanId, COUNT(Id) cnt
            FROM AccountPlanObjective
            WHERE AccountPlanId IN :planIds
              AND Status != 'Completed'
            GROUP BY AccountPlanId
        ]) {
            planActiveCount.put((Id) ar.get('AccountPlanId'), (Integer) ar.get('cnt'));
        }

        // Build set of plan IDs being deleted from
        Map<Id, List<AccountPlanObjective>> planToDeletedObjs = new Map<Id, List<AccountPlanObjective>>();
        for (AccountPlanObjective obj : oldObjectives) {
            if (obj.AccountPlanId != null) {
                if (!planToDeletedObjs.containsKey(obj.AccountPlanId)) {
                    planToDeletedObjs.put(obj.AccountPlanId, new List<AccountPlanObjective>());
                }
                planToDeletedObjs.get(obj.AccountPlanId).add(obj);
            }
        }

        for (Id planId : planToDeletedObjs.keySet()) {
            Integer activeCount = planActiveCount.containsKey(planId) ? planActiveCount.get(planId) : 0;
            List<AccountPlanObjective> toDelete = planToDeletedObjs.get(planId);

            // If all active objectives of this plan are being deleted at once
            if (activeCount <= toDelete.size()) {
                for (AccountPlanObjective obj : toDelete) {
                    obj.addError(
                        'C003 — Não é possível excluir o único objetivo ativo do plano. ' +
                        'O plano deve ter pelo menos um objetivo ativo.'
                    );
                }
            }
        }
    }
}
