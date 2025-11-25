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
  
  // Calculate real-time scores from API responses
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 0;
  const assetScore = formData?.creditEvaluation?.credit_score || 0;
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  const overallScore = (medicalScore || assetScore || behaviorScore) ? 
    Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3) : 0;

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

  const handleNext = async () => {
    if (
      formData.guarantor1Phone &&
      formData.guarantor2Phone
    ) {
      setIsLoading(true);
      trackFieldChange?.('stepFour_api_processing');
      try {
        let callLogsAnalysis = { credit_score: 0, score: 0 };
        let guarantor1IdAnalysis = null;
        let guarantor2IdAnalysis = null;
        
        if (formData.callLogHistory) {
          console.log('Step 1: Analyzing call logs...');
          callLogsAnalysis = await analyzeCallLogs(formData.callLogHistory);
        } else {
          callLogsAnalysis = { credit_score: 0, score: 0 };
        }
        
        if (formData.guarantor1Id) {
          console.log('Step 2: Analyzing guarantor 1 ID...');
          guarantor1IdAnalysis = await analyzeId(formData.guarantor1Id);
        }
        
        if (formData.guarantor2Id) {
          console.log('Step 3: Analyzing guarantor 2 ID...');
          guarantor2IdAnalysis = await analyzeId(formData.guarantor2Id);
        }
        
        updateFormData({
          callLogsAnalysis: callLogsAnalysis,
          guarantor1IdAnalysis: guarantor1IdAnalysis,
          guarantor2IdAnalysis: guarantor2IdAnalysis
        });
        
        nextStep();
      } catch (error) {
        console.error('Analysis error:', error);
        alert('Failed to analyze documents. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please provide guarantor phone numbers");
    }
  };

  return (
    <Card className="p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="h-full flex">
              <div className="w-1/3 h-full bg-red-100 relative overflow-hidden">
                <div 
                  className="h-full bg-red-400 transition-all duration-500"
                  style={{ width: `${medicalScore}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs">
                  <span className={`${medicalScore > 50 ? 'font-bold text-white' : 'text-gray-600'}`}>
                    Medical: {medicalScore || '--'}%
                  </span>
                </div>
              </div>
              <div className="w-1/3 h-full bg-amber-100 relative overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${assetScore}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs">
                  <span className={`${assetScore > 50 ? 'font-bold text-white' : 'text-gray-600'}`}>
                    Assets: {assetScore || '--'}%
                  </span>
                </div>
              </div>
              <div className="w-1/3 h-full bg-green-100 relative overflow-hidden">
                <div 
                  className="h-full bg-green-400 transition-all duration-500"
                  style={{ width: `${behaviorScore}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs">
                  <span className={`${behaviorScore > 50 ? 'font-bold text-white' : 'text-gray-600'}`}>
                    Behavior: {behaviorScore || '--'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <CircularProgress
              value={overallScore}
              max={100}
              size={60}
              strokeWidth={6}
              color="hsl(var(--primary))"
              backgroundColor="hsl(var(--muted))"
            >
              <div className="text-center">
                <div className="text-sm font-bold">{overallScore}</div>
              </div>
            </CircularProgress>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 60 60">
              <defs>
                <path id="circle-path-step4" d="M 30,30 m -18,0 a 18,18 0 1,1 36,0 a 18,18 0 1,1 -36,0" />
              </defs>
              <text className="text-[7px] fill-gray-600">
                <textPath href="#circle-path-step4">
                  <animate attributeName="startOffset" values="0%;100%;0%" dur="8s" repeatCount="indefinite" />
                  Overall Score
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-6">Guarantor Information</h2>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="callLogHistory">Call Log History</Label>
          <div className="mt-2">
            <Input
              id="callLogHistory"
              type="file"
              accept=".pdf,image/*,.csv"
              onChange={(e) => updateFormData({ callLogHistory: e.target.files?.[0] || null })}
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
                  onChange={(e) => updateFormData({ guarantor1Id: e.target.files?.[0] || null })}
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
                  onChange={(e) => updateFormData({ guarantor2Id: e.target.files?.[0] || null })}
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
                Analyzing Call Logs...
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
