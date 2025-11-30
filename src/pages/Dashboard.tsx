import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CircularProgress } from "@/components/CircularProgress";
import { GradientCircularProgress } from "@/components/GradientCircularProgress";
import { Activity, RefreshCw, FileDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ApplicationFormData } from "@/types/form";

interface DashboardProps {
  formData?: ApplicationFormData;
  isAdminMode?: boolean;
}

const Dashboard = ({ formData: propFormData, isAdminMode = false }: DashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = propFormData || (location.state?.formData as ApplicationFormData);
  
  const [showApiData, setShowApiData] = useState(false);
  const [selectedApiData, setSelectedApiData] = useState<any>(null);
  const [apiDataTitle, setApiDataTitle] = useState("");
  
  // Calculate dynamic scores from API responses
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 0;
  const assetScore = formData?.creditEvaluation?.credit_score || 
                    formData?.assetAnalysis?.total_estimated_value || 0;
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  const overallScore = (medicalScore || assetScore || behaviorScore) ? 
    Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3) : 0;
  
  // Determine risk level
  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'FAIR';
    return 'POOR';
  };
  
  const getCreditLimit = (score: number) => {
    console.log('Medical Analysis:', formData?.medicalAnalysis);
    console.log('Medical Score:', formData?.medicalScore);
    
    const drugAmount = formData?.medicalAnalysis?.total_amount || 
                      formData?.medicalAnalysis?.total_estimated_cost || 
                      formData?.medicalAnalysis?.estimated_total_cost || 0;
    const prescriptionAmount = formData?.medicalScore?.total_amount || 
                              formData?.prescriptionAnalysis?.total_amount || 
                              formData?.prescriptionAnalysis?.total_cost || 0;
    const totalAmount = drugAmount + prescriptionAmount;
    
    console.log('Drug Amount:', drugAmount, 'Prescription Amount:', prescriptionAmount, 'Total:', totalAmount);
    
    return totalAmount > 0 ? `KSh ${totalAmount.toLocaleString()}` : 'KSh 0';
  };
  
  const getAPR = (score: number) => {
    if (score >= 80) return '6.99%';
    if (score >= 70) return '9.99%';
    if (score >= 60) return '12.99%';
    return '18.99%';
  };
  
  // Tier functions based on scores
  const getMedicalTier = (score: number) => {
    if (score >= 80) return { color: 'hsl(var(--health-green))', badge: 'bg-green-100 text-green-800', text: 'Low Need' };
    if (score >= 60) return { color: 'hsl(var(--health-yellow))', badge: 'bg-yellow-100 text-yellow-800', text: 'Medium Need' };
    return { color: 'hsl(var(--health-red))', badge: 'bg-red-100 text-red-800', text: 'High Need' };
  };
  
  const getAssetTier = (score: number) => {
    if (score >= 80) return { color: 'hsl(var(--health-green))', badge: 'bg-green-100 text-green-800', text: 'Excellent Assets' };
    if (score >= 60) return { color: 'hsl(var(--health-yellow))', badge: 'bg-yellow-100 text-yellow-800', text: 'Strong Assets' };
    return { color: 'hsl(var(--health-red))', badge: 'bg-red-100 text-red-800', text: 'Limited Assets' };
  };
  
  const getBehaviorTier = (score: number) => {
    if (score >= 80) return { color: 'hsl(var(--health-green))', badge: 'bg-green-100 text-green-800', text: 'Excellent Behavior' };
    if (score >= 60) return { color: 'hsl(var(--health-yellow))', badge: 'bg-yellow-100 text-yellow-800', text: 'Good Behavior' };
    return { color: 'hsl(var(--health-red))', badge: 'bg-red-100 text-red-800', text: 'Poor Behavior' };
  };
  
  const medicalTier = getMedicalTier(medicalScore);
  const assetTier = getAssetTier(assetScore);
  const behaviorTier = getBehaviorTier(behaviorScore);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">CheckupsMed</h1>
              <p className="text-lg text-accent font-semibold">Credit Assessment</p>
            </div>
          </div>
          <p className="text-muted-foreground text-base max-w-md mx-auto">Comprehensive health-based financial evaluation powered by medical data analysis</p>
        </div>

        {/* Composite Credit Score */}
        <Card className="p-5 md:p-7 lg:p-9 bg-gradient-to-br from-primary to-accent border shadow-md rounded-xl">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-white text-lg md:text-xl font-semibold mb-1">Your Credit Score</h2>
              <p className="text-white/75 text-xs">Based on health and financial data</p>
            </div>
            
            <div className="flex justify-center">
              <GradientCircularProgress
                value={overallScore}
                max={100}
                size={180}
                strokeWidth={14}
                gradientId="scoreGradient"
                gradientColors={[
                  { offset: "0%", color: "hsl(45, 93%, 47%)" },
                  { offset: "60%", color: "hsl(120, 60%, 50%)" },
                  { offset: "100%", color: "hsl(158, 64%, 52%)" },
                ]}
                backgroundColor="rgba(255, 255, 255, 0.2)"
              >
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">{overallScore}</div>
                  <div className="text-white/70 text-xs sm:text-sm mt-1">/ 100</div>
                </div>
              </GradientCircularProgress>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-white">
              <div>
                <div className="text-white/80 text-xs sm:text-sm mb-1">Risk Level</div>
                <div className="text-base sm:text-xl md:text-2xl font-bold">{getRiskLevel(overallScore)}</div>
              </div>
              <div>
                <div className="text-white/80 text-xs sm:text-sm mb-1">Credit Limit</div>
                <div className="text-base sm:text-xl md:text-2xl font-bold">{getCreditLimit(overallScore)}</div>
              </div>
              <div>
                <div className="text-white/80 text-xs sm:text-sm mb-1">APR</div>
                <div className="text-base sm:text-xl md:text-2xl font-bold">{getAPR(overallScore)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Medical Needs */}
        <Card 
          className={`p-5 border shadow-sm rounded-xl bg-white ${isAdminMode ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={(e) => {
            if (isAdminMode) {
              e.stopPropagation();
              setSelectedApiData({
                medicalScore: formData?.medicalScore,
                medicalAnalysis: formData?.medicalAnalysis
              });
              setApiDataTitle("Medical Analysis Data");
              setShowApiData(true);
            }
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <CircularProgress
              value={medicalScore}
              max={100}
              size={100}
              strokeWidth={10}
              color={medicalTier.color}
              backgroundColor="hsl(var(--muted))"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{medicalScore}</div>
                <div className="text-muted-foreground text-xs">/ 100</div>
              </div>
            </CircularProgress>

            <div className="flex-1 space-y-2 sm:space-y-3 text-center sm:text-left w-full">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-8 h-8 rounded-lg bg-health-orange flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Rx</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">Medical Assessment</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm">
                <div className="text-muted-foreground text-left">Annual Cost Est.</div>
                <div className="font-semibold text-foreground text-right">KSh 450,000</div>
                <div className="text-muted-foreground text-left">Condition Type</div>
                <div className="font-semibold text-foreground text-right">Chronic</div>
                <div className="text-muted-foreground text-left">Refill Frequency</div>
                <div className="font-semibold text-foreground text-right">90 Days</div>
              </div>

              <div className={`inline-block px-3 sm:px-4 py-1 ${medicalTier.badge} rounded-full text-xs sm:text-sm font-medium`}>
                {medicalTier.text}
              </div>
            </div>
          </div>
        </Card>

        {/* Asset Valuation */}
        <Card 
          className={`p-5 border shadow-sm rounded-xl bg-white ${isAdminMode ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={(e) => {
            if (isAdminMode) {
              e.stopPropagation();
              setSelectedApiData({
                creditEvaluation: formData?.creditEvaluation,
                assetAnalysis: formData?.assetAnalysis,
                bankAnalysis: formData?.bankAnalysis,
                bankScore: formData?.bankScore,
                mpesaAnalysis: formData?.mpesaAnalysis
              });
              setApiDataTitle("Asset & Financial Analysis Data");
              setShowApiData(true);
            }
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <CircularProgress
              value={assetScore}
              max={100}
              size={100}
              strokeWidth={10}
              color={assetTier.color}
              backgroundColor="hsl(var(--muted))"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{assetScore}</div>
                <div className="text-muted-foreground text-xs">/ 100</div>
              </div>
            </CircularProgress>

            <div className="flex-1 space-y-2 sm:space-y-3 text-center sm:text-left w-full">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white text-xs">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">Financial Assets</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm">
                <div className="text-muted-foreground text-left">Total Assets</div>
                <div className="font-semibold text-foreground text-right">KSh 8,500,000</div>
                <div className="text-muted-foreground text-left">Debt-to-Income</div>
                <div className="font-semibold text-foreground text-right">32%</div>
                <div className="text-muted-foreground text-left">Monthly Income</div>
                <div className="font-semibold text-foreground text-right">KSh 520,000</div>
              </div>

              <div className={`inline-block px-3 sm:px-4 py-1 ${assetTier.badge} rounded-full text-xs sm:text-sm font-medium`}>
                {assetTier.text}
              </div>
            </div>
          </div>
        </Card>

        {/* Behavioral Risk */}
        <Card 
          className={`p-5 border shadow-sm rounded-xl bg-white ${isAdminMode ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={(e) => {
            if (isAdminMode) {
              e.stopPropagation();
              setSelectedApiData({
                callLogsAnalysis: formData?.callLogsAnalysis,
                behaviorAnalysis: formData?.behaviorAnalysis
              });
              setApiDataTitle("Behavioral Risk Analysis Data");
              setShowApiData(true);
            }
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <CircularProgress
              value={behaviorScore}
              max={100}
              size={100}
              strokeWidth={10}
              color={behaviorTier.color}
              backgroundColor="hsl(var(--muted))"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{behaviorScore}</div>
                <div className="text-muted-foreground text-xs">/ 100</div>
              </div>
            </CircularProgress>

            <div className="flex-1 space-y-2 sm:space-y-3 text-center sm:text-left w-full">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-white text-xs">📈</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">Behavioral Analysis</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm">
                <div className="text-muted-foreground text-left">Payment History</div>
                <div className="font-semibold text-foreground text-right">96%</div>
                <div className="text-muted-foreground text-left">Green Flags</div>
                <div className="font-semibold text-health-green text-right">4</div>
                <div className="text-muted-foreground text-left">Red Flags</div>
                <div className="font-semibold text-health-red text-right">1</div>
              </div>

              <div className={`inline-block px-3 sm:px-4 py-1 ${behaviorTier.badge} rounded-full text-xs sm:text-sm font-medium`}>
                {behaviorTier.text}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            size="lg"
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-sm sm:text-base rounded-xl shadow-lg"
            onClick={() => alert("Export functionality coming soon!")}
          >
            <FileDown className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Export Report</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 text-sm sm:text-base border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl"
            onClick={() => navigate("/")}
          >
            <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            New Assessment
          </Button>
        </div>

        {/* API Data Dialog */}
        <Dialog open={showApiData} onOpenChange={setShowApiData}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{apiDataTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <pre className="bg-muted p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(selectedApiData, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
