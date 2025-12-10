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
  
  // Calculate dynamic scores from API responses (same as Steps 3, 4 & 5)
  const baseMedicalScore = formData?.medicalScore?.scoring?.total_score || 
                          formData?.medicalScore?.score || 0;
  const prescriptionBonus = formData?.prescriptionAnalysis ? 3 : 0;
  const medicalScore = baseMedicalScore + prescriptionBonus;
  
  // Asset score = (bank statement score + asset score) / 2
  const bankScore = formData?.bankScore?.bank_statement_credit_score || 0;
  const rawAssetScore = formData?.creditEvaluation?.credit_score || 0;
  const assetScore = (bankScore && rawAssetScore) ? Math.round((bankScore + rawAssetScore) / 2) : (bankScore || rawAssetScore);
  
  // Behavior score = (M-Pesa behavior_score + call logs score) / 2 + bonuses (only if call logs exist)
  const mpesaBehaviorScore = formData?.mpesaAnalysis?.credit_scores?.behavior_score || 0;
  const callLogsScore = formData?.callLogsAnalysis?.credit_score || formData?.callLogsAnalysis?.score || 0;
  const guarantor1Bonus = formData?.guarantor1IdAnalysis ? 3 : 0;
  const guarantor2Bonus = formData?.guarantor2IdAnalysis ? 3 : 0;
  
  const behaviorScore = callLogsScore ? (
    (mpesaBehaviorScore && callLogsScore) ? 
      Math.round((mpesaBehaviorScore + callLogsScore) / 2) + guarantor1Bonus + guarantor2Bonus :
      callLogsScore + guarantor1Bonus + guarantor2Bonus
  ) : 0;
  
  const overallScore = Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3);
  
  // Determine risk level
  const getRiskLevel = (score: number) => {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'VERY GOOD';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'POOR';
    return 'HIGH RISK';
  };
  
  const getCreditLimit = (score: number) => {
    console.log('Medical Analysis:', formData?.medicalAnalysis);
    console.log('Prescription Analysis:', formData?.prescriptionAnalysis);
    
    // Get drug amount from medicines_info total_cost
    const drugAmount = formData?.medicalAnalysis?.medicines_info?.reduce((sum, med) => sum + (med.total_cost || 0), 0) || 0;
    
    // Get prescription amount from total_estimated_price_all_files
    const prescriptionAmount = formData?.prescriptionAnalysis?.total_estimated_price_all_files || 0;
    
    const totalAmount = drugAmount + prescriptionAmount;
    
    console.log('Drug Amount:', drugAmount, 'Prescription Amount:', prescriptionAmount, 'Total:', totalAmount);
    console.log('Full medicalAnalysis object:', JSON.stringify(formData?.medicalAnalysis, null, 2));
    console.log('Full prescriptionAnalysis object:', JSON.stringify(formData?.prescriptionAnalysis, null, 2));
    
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
    if (score >= 90) return { color: '#dc2626', badge: 'bg-red-600 text-white', text: 'Critical Need' };
    if (score >= 75) return { color: '#ef4444', badge: 'bg-red-100 text-red-800', text: 'High Need' };
    if (score >= 60) return { color: '#f59e0b', badge: 'bg-yellow-100 text-yellow-800', text: 'Medium Need' };
    if (score >= 40) return { color: '#10b981', badge: 'bg-green-100 text-green-800', text: 'Low Need' };
    return { color: '#0090ff', badge: 'bg-[#f4faff] text-[#123264]', text: 'Minimal Need' };
  };
  
  const getAssetTier = (score: number) => {
    if (score >= 90) return { color: '#0090ff', badge: 'bg-blue-600 text-white', text: 'Premium Assets' };
    if (score >= 75) return { color: '#3b82f6', badge: 'bg-[#f4faff] text-[#123264]', text: 'Excellent Assets' };
    if (score >= 60) return { color: '#10b981', badge: 'bg-green-100 text-green-800', text: 'Strong Assets' };
    if (score >= 40) return { color: '#f59e0b', badge: 'bg-yellow-100 text-yellow-800', text: 'Limited Assets' };
    return { color: '#ef4444', badge: 'bg-red-100 text-red-800', text: 'Minimal Assets' };
  };
  
  const getBehaviorTier = (score: number) => {
    if (score >= 90) return { color: '#10b981', badge: 'bg-green-600 text-white', text: 'Outstanding Behavior' };
    if (score >= 75) return { color: '#22c55e', badge: 'bg-green-100 text-green-800', text: 'Excellent Behavior' };
    if (score >= 60) return { color: '#0090ff', badge: 'bg-[#f4faff] text-[#123264]', text: 'Good Behavior' };
    if (score >= 40) return { color: '#f59e0b', badge: 'bg-yellow-100 text-yellow-800', text: 'Poor Behavior' };
    return { color: '#ef4444', badge: 'bg-red-100 text-red-800', text: 'High Risk Behavior' };
  };
  
  const medicalTier = getMedicalTier(medicalScore);
  const assetTier = getAssetTier(assetScore);
  const behaviorTier = getBehaviorTier(behaviorScore);

  return (
    <div className="min-h-screen bg-[#f4faff] p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
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
        <Card className="p-5 md:p-7 lg:p-9 bg-gradient-to-br from-[#123264] to-[#0090ff] border shadow-md rounded-xl">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-white text-lg md:text-xl font-semibold mb-1">Your Credit Score</h2>
              <p className="text-white/75 text-xs">Based on health and financial data</p>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <div className="absolute inset-2 bg-gradient-to-tl from-[#0090ff]/10 to-transparent rounded-full"></div>
                <GradientCircularProgress
                  value={overallScore}
                  max={100}
                  size={180}
                  strokeWidth={8}
                  gradientId="scoreGradient"
                  gradientColors={[
                    { offset: "0%", color: "#ffffff" },
                    { offset: "100%", color: "#ffffff" },
                  ]}
                  backgroundColor="rgba(255, 255, 255, 0.25)"
                >
                  <div className="text-center relative">
                    <div className="absolute inset-0 bg-white/5 rounded-full"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">{overallScore}</div>
                      <div className="text-white/70 text-xs sm:text-sm mt-1">out of 100</div>
                    </div>
                  </div>
                </GradientCircularProgress>
              </div>
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

        {/* Score Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medical Needs */}
          <Card 
            className="p-5 border shadow-sm rounded-xl bg-white cursor-pointer hover:shadow-md transition-shadow"
            onClick={(e) => {
              e.stopPropagation();
              const drugAmount = formData?.medicalAnalysis?.medicines_info?.reduce((sum, med) => sum + (med.total_cost || 0), 0) || 0;
              const prescriptionAmount = formData?.prescriptionAnalysis?.total_estimated_price_all_files || 0;
              const totalAmount = drugAmount + prescriptionAmount;
              
              setSelectedApiData({
                medicalScore: formData?.medicalScore,
                medicalAnalysis: formData?.medicalAnalysis,
                prescriptionAnalysis: formData?.prescriptionAnalysis,
                drugAnalysis: formData?.drugAnalysis,
                medicalNeeds: formData?.medicalNeeds
              });
              setApiDataTitle("Medical Assessment Details");
              setShowApiData(true);
            }}
          >
            <div className="flex flex-col gap-4 items-center text-center">
              <CircularProgress
                value={medicalScore}
                max={100}
                size={100}
                strokeWidth={10}
                color={medicalTier.color}
                backgroundColor="hsl(var(--muted))"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{medicalScore}</div>
                  <div className="text-muted-foreground text-xs">/ 100</div>
                </div>
              </CircularProgress>

              <div className="space-y-3 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-8 h-8 rounded-lg bg-health-orange flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Rx</span>
                  </div>
                  <h3 className="text-lg font-semibold text-primary">Medical Assessment</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Cost Est.</span>
                    <span className="font-semibold">KSh 450,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition Type</span>
                    <span className="font-semibold">Chronic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refill Frequency</span>
                    <span className="font-semibold">90 Days</span>
                  </div>
                </div>

                <div className={`inline-block px-4 py-1 ${medicalTier.badge} rounded-full text-sm font-medium`}>
                  {medicalTier.text}
                </div>
              </div>
            </div>
          </Card>

          {/* Asset Valuation */}
          <Card 
            className="p-5 border shadow-sm rounded-xl bg-white cursor-pointer hover:shadow-md transition-shadow"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedApiData({
                creditEvaluation: formData?.creditEvaluation,
                assetAnalysis: formData?.assetAnalysis,
                bankAnalysis: formData?.bankAnalysis,
                bankScore: formData?.bankScore,
                mpesaAnalysis: formData?.mpesaAnalysis,
                gpsAnalysis: formData?.gpsAnalysis
              });
              setApiDataTitle("Financial Assets Details");
              setShowApiData(true);
            }}
          >
            <div className="flex flex-col gap-4 items-center text-center">
              <CircularProgress
                value={assetScore}
                max={100}
                size={100}
                strokeWidth={10}
                color={assetTier.color}
                backgroundColor="hsl(var(--muted))"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{assetScore}</div>
                  <div className="text-muted-foreground text-xs">/ 100</div>
                </div>
              </CircularProgress>

              <div className="space-y-3 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">💰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-primary">Financial Assets</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Assets</span>
                    <span className="font-semibold">
                      KSh {(formData?.assetAnalysis?.total_estimated_value || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debt-to-Income</span>
                    <span className="font-semibold">
                      {formData?.bankAnalysis?.credit_score_ready_values?.features?.withdrawals_opening_ratio 
                        ? `${(formData.bankAnalysis.credit_score_ready_values.features.withdrawals_opening_ratio * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Income</span>
                    <span className="font-semibold">KSh 520,000</span>
                  </div>
                </div>

                <div className={`inline-block px-4 py-1 ${assetTier.badge} rounded-full text-sm font-medium`}>
                  {assetTier.text}
                </div>
              </div>
            </div>
          </Card>

          {/* Behavioral Risk */}
          <Card 
            className="p-5 border shadow-sm rounded-xl bg-white cursor-pointer hover:shadow-md transition-shadow"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedApiData({
                callLogsAnalysis: formData?.callLogsAnalysis,
                behaviorAnalysis: formData?.behaviorAnalysis,
                guarantor1IdAnalysis: formData?.guarantor1IdAnalysis,
                guarantor2IdAnalysis: formData?.guarantor2IdAnalysis,
                mpesaAnalysis: formData?.mpesaAnalysis
              });
              setApiDataTitle("Behavioral Analysis Details");
              setShowApiData(true);
            }}
          >
            <div className="flex flex-col gap-4 items-center text-center">
              <CircularProgress
                value={behaviorScore}
                max={100}
                size={100}
                strokeWidth={10}
                color={behaviorTier.color}
                backgroundColor="hsl(var(--muted))"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{behaviorScore}</div>
                  <div className="text-muted-foreground text-xs">/ 100</div>
                </div>
              </CircularProgress>

              <div className="space-y-3 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <span className="text-white text-xs">📈</span>
                  </div>
                  <h3 className="text-lg font-semibold text-primary">Behavioral Analysis</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment History</span>
                    <span className="font-semibold">96%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Green Flags</span>
                    <span className="font-semibold text-[#0090ff]">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Red Flags</span>
                    <span className="font-semibold text-health-red">1</span>
                  </div>
                </div>

                <div className={`inline-block px-4 py-1 ${behaviorTier.badge} rounded-full text-sm font-medium`}>
                  {behaviorTier.text}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl shadow-lg text-sm px-3 py-2"
            onClick={() => alert("Export functionality coming soon!")}
          >
            <FileDown className="mr-1 h-4 w-4" />
            <span className="truncate">Export</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl text-sm px-3 py-2"
            onClick={() => navigate("/")}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            New Assessment
          </Button>
        </div>

        {/* API Data Dialog */}
        <Dialog open={showApiData} onOpenChange={setShowApiData}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-[#123264] to-[#0090ff] bg-clip-text text-transparent">
                {apiDataTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedApiData && Object.entries(selectedApiData).map(([key, value]) => (
                <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-sm mb-2 capitalize text-gray-800">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto whitespace-pre-wrap max-h-48 text-gray-700">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center text-xs text-gray-500">
                💡 This information is based on your submitted data and AI analysis
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
