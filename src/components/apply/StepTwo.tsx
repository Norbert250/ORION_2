import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { GradientCircularProgress } from "@/components/GradientCircularProgress";
import { CircularProgress } from "@/components/CircularProgress";


interface StepTwoProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  trackFieldChange?: (fieldName: string) => void;
}

export const StepTwo = ({ formData, updateFormData, nextStep, prevStep, trackFieldChange }: StepTwoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate real-time scores from API responses
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 0;
  
  const assetScore = formData?.creditEvaluation?.credit_score || 0;
  
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  console.log('Final scores:', { medicalScore, assetScore, behaviorScore });
  
  const overallScore = (medicalScore || assetScore || behaviorScore) ? 
    Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3) : 0;

  const analyzeFiles = async (files: File[], endpoint: string) => {
    const formData = new FormData();
    formData.append('user_id', '12345');
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    console.log('Sending to:', `https://orionapisalpha.onrender.com${endpoint}`);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    const response = await fetch(`https://orionapisalpha.onrender.com${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    return result;
  };

  const predictMedicalNeeds = async (drugNames: string[]) => {
    console.log('Sending medicines as array:', drugNames);
    
    const response = await fetch('https://orionapisalpha.onrender.com/medical_needs/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicines: drugNames }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Medical needs API Error:', errorText);
      throw new Error(`Medical needs prediction failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Medical needs response:', result);
    return result;
  };

  const scoreMedical = async (medicalConditions: string[]) => {
    const response = await fetch('https://orionapisalpha.onrender.com/medical_scoring/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: '12345',
        age: parseInt(formData.age) || 25,
        conditions: medicalConditions,
        tests: []
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Medical scoring API Error:', errorText);
      throw new Error(`Medical scoring failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Medical scoring response:', result);
    return result;
  };

  const handleNext = async () => {
    if (formData.sex && formData.age) {
      setIsLoading(true);
      trackFieldChange?.('stepTwo_api_processing');
      try {
        let prescriptionResult = null;
        let drugResult = null;
        let medicalNeedsResult = null;
        let scoringResult = { score: 0 };
        
        if (formData.medicalPrescription.length > 0 && formData.drugImage.length > 0) {
          // 1. Analyze prescriptions
          console.log('Step 1: Analyzing prescriptions...');
          prescriptionResult = await analyzeFiles(formData.medicalPrescription, '/prescriptions/analyze');
          
          // 2. Analyze drug images
          console.log('Step 2: Analyzing drug images...');
          drugResult = await analyzeFiles(formData.drugImage, '/drugs/analyze');
          
          // 3. Collect all drug names from all files
          const allPrescriptionDrugs = prescriptionResult.files?.flatMap((file: any) => file.drugs || []) || [];
          const allDrugImageDrugs = drugResult.files?.flatMap((file: any) => file.drugs || []) || [];
          
          const allDrugNames = [
            ...allPrescriptionDrugs.map((drug: any) => drug.name || drug.drug_name),
            ...allDrugImageDrugs.map((drug: any) => drug.name || drug.drug_name)
          ].filter(Boolean);
          
          console.log('Step 3: Collected drug names:', allDrugNames);
          
          // 4. Predict medical needs (with fallback)
          console.log('Step 4: Predicting medical needs...');
          
          try {
            medicalNeedsResult = await predictMedicalNeeds(allDrugNames);
          } catch (error) {
            console.warn('Medical needs API unavailable, using fallback data:', error);
            
            // Generate fallback medical conditions based on drug names
            const fallbackConditions = [];
            if (allDrugNames.some(drug => drug.toLowerCase().includes('tylenol') || drug.toLowerCase().includes('acetaminophen'))) {
              fallbackConditions.push('Pain Management', 'Fever');
            }
            if (allDrugNames.some(drug => drug.toLowerCase().includes('iron') || drug.toLowerCase().includes('fe'))) {
              fallbackConditions.push('Anemia', 'Iron Deficiency');
            }
            if (allDrugNames.some(drug => drug.toLowerCase().includes('pantoprazole'))) {
              fallbackConditions.push('GERD', 'Acid Reflux');
            }
            if (allDrugNames.some(drug => drug.toLowerCase().includes('diphenhydramine'))) {
              fallbackConditions.push('Allergies', 'Sleep Aid');
            }
            
            medicalNeedsResult = { 
              medical_conditions: fallbackConditions.length > 0 ? fallbackConditions : ['General Health Maintenance'],
              confidence: 0.7,
              source: 'fallback'
            };
          }
          
          // 5. Score medical conditions (always call the real API)
          console.log('Step 5: Scoring medical conditions...');
          scoringResult = await scoreMedical(medicalNeedsResult.medical_conditions || []);
        }
        
        // Store results in form data
        console.log('Final results:', {
          prescriptionAnalysis: prescriptionResult,
          drugAnalysis: drugResult,
          medicalNeeds: medicalNeedsResult,
          medicalScore: scoringResult
        });
        
        updateFormData({
          prescriptionAnalysis: prescriptionResult,
          drugAnalysis: drugResult,
          medicalNeeds: medicalNeedsResult,
          medicalScore: scoringResult
        });
        
        nextStep();
      } catch (error) {
        console.error('API chain error:', error);
        alert('Failed to process medical information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please fill in sex and age");
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
                <path id="circle-path" d="M 30,30 m -18,0 a 18,18 0 1,1 36,0 a 18,18 0 1,1 -36,0" />
              </defs>
              <text className="text-[7px] fill-gray-600">
                <textPath href="#circle-path">
                  <animate attributeName="startOffset" values="0%;100%;0%" dur="8s" repeatCount="indefinite" />
                  Overall Score
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-6">Personal & Medical Information</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sex">Sex *</Label>
            <Select
              value={formData.sex}
              onValueChange={(value) => updateFormData({ sex: value })}
              onOpenChange={(open) => open && trackFieldChange?.('sex')}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter your age"
              value={formData.age}
              onChange={(e) => updateFormData({ age: e.target.value })}
              onFocus={() => trackFieldChange?.('age')}
              className="mt-2"
              min="18"
              max="120"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="medicalPrescription">Medical Prescription *</Label>
          <div className="mt-2">
            <Input
              id="medicalPrescription"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => updateFormData({ medicalPrescription: Array.from(e.target.files || []) })}
              onFocus={() => trackFieldChange?.('medicalPrescription')}
              className="cursor-pointer"
            />
            <p className="text-xs text-green-600 font-medium mt-1">
              📋 Take a picture of your medical prescription
            </p>
            {formData.medicalPrescription.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {formData.medicalPrescription.length} file(s)
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="drugImage">Drug Images *</Label>
          <div className="mt-2">
            <Input
              id="drugImage"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => updateFormData({ drugImage: Array.from(e.target.files || []) })}
              onFocus={() => trackFieldChange?.('drugImage')}
              className="cursor-pointer"
            />
            <p className="text-xs text-purple-600 font-medium mt-1">
              💊 Take a picture of your drugs/medicines
            </p>
            {formData.drugImage.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {formData.drugImage.length} file(s)
              </p>
            )}
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
                Uploading...
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
