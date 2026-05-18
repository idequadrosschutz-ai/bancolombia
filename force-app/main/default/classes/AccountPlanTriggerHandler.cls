/**
 * AccountPlanTriggerHandler
 * Handler for AccountPlan trigger — C001, C001b, C002 validations.
 * Uses bc_TipoPlano__c to compare only within the same plan typology.
 */
public with sharing class AccountPlanTriggerHandler {

    /**
     * Called on before insert / before update.
     * Validates date overlap rules C001 / C001b / C002.
     */
    public static void handleBeforeInsertUpdate(List<AccountPlan> newPlans, Map<Id, AccountPlan> oldMap) {
        Set<Id> accountIds = new Set<Id>();
        for (AccountPlan ap : newPlans) {
            if (ap.AccountId != null) {
                accountIds.add(ap.AccountId);
            }
        }

        if (accountIds.isEmpty()) {
            return;
        }

        // Load existing active plans for the same accounts
        List<AccountPlan> existingPlans = [
            SELECT Id, AccountId, StartDate, EndDate, bc_TipoPlano__c
            FROM AccountPlan
            WHERE AccountId IN :accountIds
              AND Status = 'Active'
        ];

        // Build a map: AccountId + TipoPlano -> list of active plans
        Map<String, List<AccountPlan>> keyToPlans = new Map<String, List<AccountPlan>>();
        for (AccountPlan ep : existingPlans) {
            String key = String.valueOf(ep.AccountId) + '|' + ep.bc_TipoPlano__c;
            if (!keyToPlans.containsKey(key)) {
                keyToPlans.put(key, new List<AccountPlan>());
            }
            keyToPlans.get(key).add(ep);
        }

        for (AccountPlan ap : newPlans) {
            // Skip if updating — do not compare against itself
            String apId = ap.Id != null ? String.valueOf(ap.Id) : null;

            if (ap.AccountId == null || ap.StartDate == null || ap.EndDate == null) {
                continue;
            }

            String key = String.valueOf(ap.AccountId) + '|' + ap.bc_TipoPlano__c;
            List<AccountPlan> peers = keyToPlans.containsKey(key) ? keyToPlans.get(key) : new List<AccountPlan>();

            for (AccountPlan peer : peers) {
                // Skip self-comparison on update
                if (apId != null && peer.Id == ap.Id) {
                    continue;
                }
                if (peer.StartDate == null || peer.EndDate == null) {
                    continue;
                }

                // C001 / C001b / C002: date overlap check
                Boolean overlaps = !(ap.EndDate < peer.StartDate || ap.StartDate > peer.EndDate);
                if (overlaps) {
                    ap.addError(
                        'C001 — Já existe um plano ativo do tipo "' + ap.bc_TipoPlano__c +
                        '" para esta conta com datas sobrepostas (' +
                        peer.StartDate.format() + ' a ' + peer.EndDate.format() + '). ' +
                        'Por favor, ajuste as datas antes de salvar.'
                    );
                }
            }
        }
    }
}
