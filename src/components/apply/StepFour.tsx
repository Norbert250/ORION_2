import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import { GradientCircularProgress } from "@/components/GradientCircularProgress";


interface StepFourProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  trackFieldChange?: (fieldName: string) => void;
}

export const StepFour = ({ formData, updateFormData, nextStep, prevStep, trackFieldChange }: StepFourProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Calculate real-time scores from API responses
  const baseMedicalScore = formData?.medicalScore?.scoring?.total_score || 
                          formData?.medicalScore?.score || 0;
  const prescriptionBonus = formData?.prescriptionAnalysis ? 3 : 0;
  const medicalScore = baseMedicalScore + prescriptionBonus;
  
  // Asset score = (bank statement score + asset score) / 2 (same as Step 3)
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
  
  console.log('STEP 4 DEBUG - Medical score:', medicalScore);
  console.log('STEP 4 DEBUG - Asset score:', assetScore);
  console.log('STEP 4 DEBUG - M-Pesa behavior score:', mpesaBehaviorScore);
  console.log('STEP 4 DEBUG - Call logs score:', callLogsScore);
  console.log('STEP 4 DEBUG - Guarantor bonuses:', guarantor1Bonus + guarantor2Bonus);
  console.log('STEP 4 DEBUG - Behavior score (with bonuses):', behaviorScore);
  console.log('STEP 4 DEBUG - Overall score:', overallScore);
  console.log('STEP 4 DEBUG - formData.mpesaAnalysis:', formData?.mpesaAnalysis);
  console.log('STEP 4 DEBUG - M-Pesa credit_scores:', formData?.mpesaAnalysis?.credit_scores);
  console.log('STEP 4 DEBUG - formData.callLogsAnalysis:', formData?.callLogsAnalysis);

  const analyzeCallLogs = async (file: File) => {
    const formData = new FormData();
    formData.append('loan_id', 'LOAN_' + Date.now());
    formData.append('calllogs_csv', file);
    
    console.log('Analyzing call logs...');
    
    const response = await fetch('https://gps-fastapi-upload.onrender.com/users/8888/score/calllogs', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Call Logs API Error:', errorText);
      throw new Error(`Call logs analysis failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Call Logs Response:', result);
    return result;
  };

  const analyzeId = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('Analyzing ID document...');
      
      const response = await fetch('https://orionapisalpha.onrender.com/id/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ID Analysis API Error:', errorText);
        throw new Error(`ID analysis failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('ID Analysis Response:', result);
      return result;
    } catch (error) {
      console.error('ID Analysis failed:', error);
      // Return null instead of throwing to prevent app crash
      return null;
    }
  };

  const handleNext = () => {
    if (formData.guarantor1Phone && formData.guarantor2Phone) {
      trackFieldChange?.('stepFour_completed');
      nextStep();
    } else {
      alert("Please provide guarantor phone numbers");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 md:p-8">
      {/* Score Section */}
      <Card className="mb-6 p-6 bg-gradient-to-br from-[#123264] to-[#0090ff] border shadow-md">
        <div className="text-center space-y-4">
          <h3 className="text-white text-lg font-semibold tracking-wide">COMPOSITE CREDIT SCORE</h3>
          
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
              <div className="absolute inset-2 bg-gradient-to-tl from-[#0090ff]/10 to-transparent rounded-full"></div>
              <GradientCircularProgress
                value={overallScore}
                max={100}
                size={140}
                strokeWidth={8}
                gradientId="compositeScoreGradient"
                gradientColors={[
                  { offset: "0%", color: "#ffffff" },
                  { offset: "100%", color: "#ffffff" },
                ]}
                backgroundColor="rgba(255, 255, 255, 0.25)"
              >
                <div className="text-center relative">
                  <div className="absolute inset-0 bg-white/5 rounded-full"></div>
                  <div className="relative z-10">
                    <div className="text-4xl sm:text-5xl font-bold text-white">{overallScore}</div>
                    <div className="text-white/70 text-xs sm:text-sm mt-1">out of 100</div>
                  </div>
                </div>
              </GradientCircularProgress>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-white text-sm">
            <div>
              <div className="text-white/80 mb-1">Medical</div>
              <div className="text-lg font-bold">{medicalScore || '--'}</div>
            </div>
            <div>
              <div className="text-white/80 mb-1">Assets</div>
              <div className="text-lg font-bold">{assetScore || '--'}</div>
            </div>
            <div>
              <div className="text-white/80 mb-1">Behavior</div>
              <div className="text-lg font-bold">{callLogsScore ? behaviorScore : '--'}</div>
            </div>
          </div>
        </div>
      </Card>

      <h2 className="text-2xl font-bold text-foreground mb-6">Guarantor Information</h2>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="callLogHistory">Call Log History</Label>
          <div className="mt-2">
            <Input
              id="callLogHistory"
              type="file"
              accept=".pdf,image/*,.csv"
              onChange={async (e) => {
                const file = e.target.files?.[0] || null;
                updateFormData({ callLogHistory: file });
                
                if (file) {
                  try {
                    setIsLoading(true);
                    setLoadingMessage('Analyzing call logs...');
                    console.log('🔄 Starting call logs analysis...');
                    const callLogsAnalysis = await analyzeCallLogs(file);
                    console.log('✅ Call logs analysis complete:', callLogsAnalysis);
                    updateFormData({ callLogsAnalysis });
                  } catch (error) {
                    console.error('❌ Call logs analysis error:', error);
                  } finally {
                    setIsLoading(false);
                    setLoadingMessage('');
                  }
                }
              }}
              onFocus={() => trackFieldChange?.('callLogHistory')}
              className="cursor-pointer"
            />
            {formData.callLogHistory && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {formData.callLogHistory.name}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Guarantor 1</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="guarantor1Id">ID Document</Label>
              <div className="mt-2">
                <Input
                  id="guarantor1Id"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData({ guarantor1Id: file });
                    
                    if (file) {
                      try {
                        setIsLoading(true);
                        setLoadingMessage('Analyzing guarantor 1 ID...');
                        console.log('🔄 Starting guarantor 1 ID analysis...');
                        const guarantor1IdAnalysis = await analyzeId(file);
                        if (guarantor1IdAnalysis) {
                          console.log('✅ Guarantor 1 ID analysis complete:', guarantor1IdAnalysis);
                          updateFormData({ guarantor1IdAnalysis });
                        } else {
                          console.log('⚠️ Guarantor 1 ID analysis failed, continuing without analysis');
                        }
                      } catch (error) {
                        console.error('❌ Guarantor 1 ID analysis error:', error);
                      } finally {
                        setIsLoading(false);
                        setLoadingMessage('');
                      }
                    }
                  }}
                  onFocus={() => trackFieldChange?.('guarantor1Id')}
                  className="cursor-pointer"
                />
                {formData.guarantor1Id && (
                  <div className="mt-2">
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(formData.guarantor1Id)}
                        alt="Guarantor 1 ID"
                        className="w-24 h-16 object-cover rounded border mb-2"
                      />
                      <button
                        onClick={() => updateFormData({ guarantor1Id: null, guarantor1IdAnalysis: null })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formData.guarantor1Id.name}
                    </p>
                    {formData.guarantor1IdAnalysis && (
                      <div className="bg-[#f4faff] p-3 rounded-lg text-sm">
                        <h4 className="font-semibold text-[#123264] mb-2">Extracted Information:</h4>
                        <div className="space-y-1">
                          {(formData.guarantor1IdAnalysis.fields?.['Full Name'] || formData.guarantor1IdAnalysis['Full Name']) && (
                            <p><span className="font-medium">Name:</span> {formData.guarantor1IdAnalysis.fields?.['Full Name'] || formData.guarantor1IdAnalysis['Full Name']}</p>
                          )}
                          {(formData.guarantor1IdAnalysis.fields?.['ID Number'] || formData.guarantor1IdAnalysis['ID Number']) && (
                            <p><span className="font-medium">ID Number:</span> {formData.guarantor1IdAnalysis.fields?.['ID Number'] || formData.guarantor1IdAnalysis['ID Number']}</p>
                          )}
                          {(formData.guarantor1IdAnalysis.fields?.Nationality || formData.guarantor1IdAnalysis.Nationality) && (
                            <p><span className="font-medium">Nationality:</span> {formData.guarantor1IdAnalysis.fields?.Nationality || formData.guarantor1IdAnalysis.Nationality}</p>
                          )}
                          {(formData.guarantor1IdAnalysis.fields?.['Passport Number'] || formData.guarantor1IdAnalysis['Passport Number']) && (
                            <p><span className="font-medium">Passport:</span> {formData.guarantor1IdAnalysis.fields?.['Passport Number'] || formData.guarantor1IdAnalysis['Passport Number']}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="guarantor1Phone">Phone Number *</Label>
              <Input
                id="guarantor1Phone"
                type="tel"
                placeholder="+254 700 000 000"
                value={formData.guarantor1Phone}
                onChange={(e) => updateFormData({ guarantor1Phone: e.target.value })}
                onFocus={() => trackFieldChange?.('guarantor1Phone')}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Guarantor 2</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="guarantor2Id">ID Document</Label>
              <div className="mt-2">
                <Input
                  id="guarantor2Id"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData({ guarantor2Id: file });
                    
                    if (file) {
                      try {
                        setIsLoading(true);
                        setLoadingMessage('Analyzing guarantor 2 ID...');
                        console.log('🔄 Starting guarantor 2 ID analysis...');
                        const guarantor2IdAnalysis = await analyzeId(file);
                        if (guarantor2IdAnalysis) {
                          console.log('✅ Guarantor 2 ID analysis complete:', guarantor2IdAnalysis);
                          updateFormData({ guarantor2IdAnalysis });
                        } else {
                          console.log('⚠️ Guarantor 2 ID analysis failed, continuing without analysis');
                        }
                      } catch (error) {
                        console.error('❌ Guarantor 2 ID analysis error:', error);
                      } finally {
                        setIsLoading(false);
                        setLoadingMessage('');
                      }
                    }
                  }}
                  onFocus={() => trackFieldChange?.('guarantor2Id')}
                  className="cursor-pointer"
                />
                {formData.guarantor2Id && (
                  <div className="mt-2">
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(formData.guarantor2Id)}
                        alt="Guarantor 2 ID"
                        className="w-24 h-16 object-cover rounded border mb-2"
                      />
                      <button
                        onClick={() => updateFormData({ guarantor2Id: null, guarantor2IdAnalysis: null })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formData.guarantor2Id.name}
                    </p>
                    {formData.guarantor2IdAnalysis && (
                      <div className="bg-[#f4faff] p-3 rounded-lg text-sm">
                        <h4 className="font-semibold text-[#123264] mb-2">Extracted Information:</h4>
                        <div className="space-y-1">
                          {(formData.guarantor2IdAnalysis.fields?.['Full Name'] || formData.guarantor2IdAnalysis['Full Name']) && (
                            <p><span className="font-medium">Name:</span> {formData.guarantor2IdAnalysis.fields?.['Full Name'] || formData.guarantor2IdAnalysis['Full Name']}</p>
                          )}
                          {(formData.guarantor2IdAnalysis.fields?.['ID Number'] || formData.guarantor2IdAnalysis['ID Number']) && (
                            <p><span className="font-medium">ID Number:</span> {formData.guarantor2IdAnalysis.fields?.['ID Number'] || formData.guarantor2IdAnalysis['ID Number']}</p>
                          )}
                          {(formData.guarantor2IdAnalysis.fields?.Nationality || formData.guarantor2IdAnalysis.Nationality) && (
                            <p><span className="font-medium">Nationality:</span> {formData.guarantor2IdAnalysis.fields?.Nationality || formData.guarantor2IdAnalysis.Nationality}</p>
                          )}
                          {(formData.guarantor2IdAnalysis.fields?.['Passport Number'] || formData.guarantor2IdAnalysis['Passport Number']) && (
                            <p><span className="font-medium">Passport:</span> {formData.guarantor2IdAnalysis.fields?.['Passport Number'] || formData.guarantor2IdAnalysis['Passport Number']}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="guarantor2Phone">Phone Number *</Label>
              <Input
                id="guarantor2Phone"
                type="tel"
                placeholder="+254 700 000 000"
                value={formData.guarantor2Phone}
                onChange={(e) => updateFormData({ guarantor2Phone: e.target.value })}
                onFocus={() => trackFieldChange?.('guarantor2Phone')}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 min-w-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                <span className="truncate">{loadingMessage}</span>
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
};
