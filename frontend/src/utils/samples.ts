export const SAMPLE_JAVA_VALID = `public class SoftwareRiskAnalyzer {
    public static void main(String[] args) {
        int loc = 120;
        int maxComplexity = 12;
        int errorCount = 2;
        
        float riskScore = 0.0;
        if (maxComplexity > 10) {
            riskScore = 0.85;
            System.out.println("Warning: High complexity module detected!");
        } else {
            riskScore = 0.20;
        }

        int iterations = 0;
        while (iterations < 5) {
            riskScore = riskScore + 0.02;
            iterations = iterations + 1;
        }

        System.out.println(riskScore);
    }
}`;

export const SAMPLE_JAVA_SYNTAX_ERROR = `public class SyntaxDemo {
    public static void main(String[] args) {
        int total = 10;
        int error = ;
        System.out.println(total);
    }
}`;

export const SAMPLE_JAVA_TYPE_ERROR = `public class TypeMismatchDemo {
    public static void main(String[] args) {
        int count = "invalid_string_assignment";
        System.out.println(count);
    }
}`;

export const SAMPLE_CSV_SOFTWARE_METRICS = `module_name,loc,cyclomatic_complexity,cognitive_complexity,tokens_count,diagnostics_count,risk_level
AuthService.java,145,14,12,650,3,HIGH
PaymentGateway.java,210,22,18,980,5,CRITICAL
UserInterface.java,85,4,3,320,0,LOW
DatabasePool.java,120,8,6,490,1,MODERATE
CacheManager.java,60,2,1,210,0,LOW
LoggerUtility.java,40,1,1,150,0,LOW
NotificationWorker.java,175,16,13,740,4,HIGH
EncryptionModule.java,95,9,7,410,1,MODERATE
ReportGenerator.java,310,28,24,1420,8,CRITICAL
ConfigParser.java,70,3,2,280,0,LOW
WebController.java,130,11,9,590,2,HIGH
`;
