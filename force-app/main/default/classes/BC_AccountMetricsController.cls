public with sharing class BC_AccountMetricsController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getAccountMetrics(Id accountPlanId) {
        Map<String, Object> result = new Map<String, Object>{
            'openOpportunities'  => 0,
            'revenueLastQuarter' => 0,
            'revenueThisQuarter' => 0,
            'winRateLastQuarter' => 0,
            'winRateThisQuarter' => 0
        };

        bc_AccountPlan__c plan = [
            SELECT bc_Account__c
            FROM bc_AccountPlan__c
            WHERE Id = :accountPlanId
            LIMIT 1
        ];
        Id accountId = plan.bc_Account__c;
        if (accountId == null) return result;

        // Open opportunities
        result.put('openOpportunities', [
            SELECT COUNT() FROM Opportunity
            WHERE AccountId = :accountId
            AND IsClosed = false
        ]);

        // Revenue this quarter
        Date startQ  = Date.today().toStartOfMonth().addMonths(-(Math.mod(Date.today().month()-1,3)));
        Date endQ    = startQ.addMonths(3).addDays(-1);
        Date startLQ = startQ.addMonths(-3);
        Date endLQ   = startQ.addDays(-1);

        AggregateResult[] thisQ = [
            SELECT SUM(Amount) total FROM Opportunity
            WHERE AccountId = :accountId
            AND StageName = 'Closed Won'
            AND CloseDate >= :startQ AND CloseDate <= :endQ
        ];
        AggregateResult[] lastQ = [
            SELECT SUM(Amount) total FROM Opportunity
            WHERE AccountId = :accountId
            AND StageName = 'Closed Won'
            AND CloseDate >= :startLQ AND CloseDate <= :endLQ
        ];

        Decimal revThis = (Decimal)(thisQ[0].get('total') ?? 0);
        Decimal revLast = (Decimal)(lastQ[0].get('total') ?? 0);
        result.put('revenueThisQuarter', revThis);
        result.put('revenueLastQuarter', revLast);

        // Win rate this quarter
        Integer closedThis = [SELECT COUNT() FROM Opportunity WHERE AccountId=:accountId AND IsClosed=true AND CloseDate>=:startQ AND CloseDate<=:endQ];
        Integer wonThis    = [SELECT COUNT() FROM Opportunity WHERE AccountId=:accountId AND StageName='Closed Won' AND CloseDate>=:startQ AND CloseDate<=:endQ];
        Integer closedLast = [SELECT COUNT() FROM Opportunity WHERE AccountId=:accountId AND IsClosed=true AND CloseDate>=:startLQ AND CloseDate<=:endLQ];
        Integer wonLast    = [SELECT COUNT() FROM Opportunity WHERE AccountId=:accountId AND StageName='Closed Won' AND CloseDate>=:startLQ AND CloseDate<=:endLQ];

        result.put('winRateThisQuarter', closedThis > 0 ? Math.roundToLong((wonThis * 100.0) / closedThis) : 0);
        result.put('winRateLastQuarter', closedLast > 0 ? Math.roundToLong((wonLast * 100.0) / closedLast) : 0);

        return result;
    }
}
