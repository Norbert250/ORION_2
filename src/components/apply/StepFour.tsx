import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";


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
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 0;
  const assetScore = formData?.creditEvaluation?.credit_score || 0;
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  const overallScore = Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3);

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
    <Card className="p-6 md:p-8">
      {/* Score Section */}
      <Card className="mb-6 p-6 bg-gradient-to-br from-primary to-accent border-0 shadow-lg">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full border-8 border-white/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-full" style={{
                  background: `conic-gradient(from 0deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.8) ${overallScore}%, rgba(255,255,255,0.1) ${overallScore}%, rgba(255,255,255,0.1) 100%)`
                }}></div>
                <div className="relative z-10 text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1">{overallScore}</div>
                  <div className="text-xs sm:text-sm font-semibold text-white/90 tracking-wider">
                    {overallScore >= 80 ? 'EXCELLENT' : overallScore >= 60 ? 'GOOD' : 'POOR'}
                  </div>
                  <div className="text-xs text-white/70 mt-1">CREDIT TIER</div>
                </div>
              </div>
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
                        console.log('✅ Guarantor 1 ID analysis complete:', guarantor1IdAnalysis);
                        
                        // Add 3 points to current behavior score
                        const currentBehaviorScore = formData?.callLogsAnalysis?.credit_score || formData?.callLogsAnalysis?.score || 0;
                        const guarantor2Bonus = formData?.guarantor2IdAnalysis ? 3 : 0;
                        const totalBehaviorScore = { credit_score: currentBehaviorScore + 3 + guarantor2Bonus, score: currentBehaviorScore + 3 + guarantor2Bonus };
                        
                        updateFormData({ 
                          guarantor1IdAnalysis, 
                          callLogsAnalysis: totalBehaviorScore 
                        });
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
                    <img
                      src={URL.createObjectURL(formData.guarantor1Id)}
                      alt="Guarantor 1 ID"
                      className="w-24 h-16 object-cover rounded border mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.guarantor1Id.name}
                    </p>
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
                        console.log('✅ Guarantor 2 ID analysis complete:', guarantor2IdAnalysis);
                        
                        // Add 3 points to current behavior score
                        const currentBehaviorScore = formData?.callLogsAnalysis?.credit_score || formData?.callLogsAnalysis?.score || 0;
                        const guarantor1Bonus = formData?.guarantor1IdAnalysis ? 3 : 0;
                        const totalBehaviorScore = { credit_score: currentBehaviorScore + 3 + guarantor1Bonus, score: currentBehaviorScore + 3 + guarantor1Bonus };
                        
                        updateFormData({ 
                          guarantor2IdAnalysis, 
                          callLogsAnalysis: totalBehaviorScore 
                        });
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
                    <img
                      src={URL.createObjectURL(formData.guarantor2Id)}
                      alt="Guarantor 2 ID"
                      className="w-24 h-16 object-cover rounded border mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.guarantor2Id.name}
                    </p>
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
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingMessage}
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
  );
};
