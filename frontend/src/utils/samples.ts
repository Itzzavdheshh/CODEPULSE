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

export const SAMPLE_CSV_TIME_SERIES = `date,commits_count,defects_reported,average_complexity,risk_index
2026-09-01,14,2,11.2,0.21
2026-09-02,18,3,12.5,0.28
2026-09-03,22,1,10.8,0.18
2026-09-04,9,0,9.4,0.12
2026-09-05,5,0,9.1,0.10
2026-09-06,2,0,9.0,0.08
2026-09-07,27,5,15.8,0.45
2026-09-08,31,7,18.2,0.57
2026-09-09,29,4,17.1,0.52
2026-09-10,24,3,14.6,0.38
2026-09-11,35,8,21.4,0.68
2026-09-12,12,1,12.0,0.22
2026-09-13,4,0,10.0,0.11
2026-09-14,38,9,24.1,0.76
2026-09-15,42,12,27.5,0.84
2026-09-16,39,10,25.8,0.79
2026-09-17,33,6,20.2,0.61
2026-09-18,28,4,17.9,0.50
2026-09-19,10,1,13.1,0.25
2026-09-20,6,0,11.5,0.15
2026-09-21,45,14,31.0,0.89
`;

export const SAMPLE_CSV_IRIS = `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.2,2.0,virginica
`;

