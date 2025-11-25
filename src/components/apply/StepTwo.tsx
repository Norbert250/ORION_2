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
                      formData?.medicalScore?.score || 
                      formData?.bankScore?.bank_statement_credit_score || 0;
  
  const assetScore = formData?.creditEvaluation?.credit_score || 
                    formData?.assetAnalysis?.total_estimated_value || 0;
  
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
        <div className="flex justify-between text-sm mb-2">
          <span className={medicalScore ? 'text-orange-600 font-semibold' : 'text-gray-400'}>Medical: {medicalScore || '--'}%</span>
          <span className={assetScore ? 'text-yellow-600 font-semibold' : 'text-gray-400'}>Assets: {assetScore || '--'}%</span>
          <span className={behaviorScore ? 'text-green-600 font-semibold' : 'text-gray-400'}>Behavior: {behaviorScore || '--'}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div 
              className={`transition-all duration-500 ${medicalScore ? 'bg-orange-500' : 'bg-gray-300'}`}
              style={{ width: `${medicalScore ? (medicalScore / 3) : 33.33}%` }}
            ></div>
            <div 
              className={`transition-all duration-500 ${assetScore ? 'bg-yellow-500' : 'bg-gray-300'}`}
              style={{ width: `${assetScore ? (assetScore / 3) : 33.33}%` }}
            ></div>
            <div 
              className={`transition-all duration-500 ${behaviorScore ? 'bg-green-500' : 'bg-gray-300'}`}
              style={{ width: `${behaviorScore ? (behaviorScore / 3) : 33.33}%` }}
            ></div>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-lg font-bold">Overall Score: {overallScore}</span>
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
