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
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Calculate real-time scores from API responses
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 0;
  
  const assetScore = formData?.creditEvaluation?.credit_score || 0;
  
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  console.log('Final scores:', { medicalScore, assetScore, behaviorScore });
  
  const overallScore = Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3);

  const analyzeFiles = async (files: File[], endpoint: string, retries = 3) => {
    if (!navigator.onLine) throw new Error('No internet connection');
    
    const formData = new FormData();
    formData.append('user_id', '12345');
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`https://orionapisalpha.onrender.com${endpoint}`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000)
        });
        
        if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const predictMedicalNeeds = async (drugNames: string[], retries = 3) => {
    if (!navigator.onLine) throw new Error('No internet connection');
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch('https://orionapisalpha.onrender.com/medical_needs/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicines: drugNames }),
          signal: AbortSignal.timeout(30000)
        });
        
        if (!response.ok) throw new Error(`Medical needs prediction failed: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const scoreMedical = async (medicalConditions: string[], retries = 3) => {
    if (!navigator.onLine) throw new Error('No internet connection');
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch('https://orionapisalpha.onrender.com/medical_scoring/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: '12345',
            age: parseInt(formData.age) || 25,
            conditions: medicalConditions,
            tests: []
          }),
          signal: AbortSignal.timeout(30000)
        });
        
        if (!response.ok) throw new Error(`Medical scoring failed: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const handleNext = () => {
    if (formData.sex && formData.age) {
      trackFieldChange?.('stepTwo_completed');
      nextStep();
    } else {
      alert("Please fill in sex and age");
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
          <Label htmlFor="medicalPrescription">Medical Prescription</Label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-3">
              {formData.medicalPrescription.map((file, index) => (
                <div key={index} className="relative w-16 h-16 group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Prescription ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200"></div>
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all duration-200 shadow-sm">
                <span className="text-2xl text-gray-400 font-light">+</span>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={async (e) => {
                    const newFiles = Array.from(e.target.files || []);
                    const allFiles = [...formData.medicalPrescription, ...newFiles];
                    updateFormData({ medicalPrescription: allFiles });
                    
                    if (allFiles.length > 0) {
                      try {
                        setIsLoading(true);
                        setLoadingMessage('Analyzing prescriptions...');
                        console.log('🔄 Starting prescription analysis...');
                        const prescriptionResult = await analyzeFiles(allFiles, '/prescriptions/analyze');
                        console.log('✅ Prescription analysis complete:', prescriptionResult);
                        
                        // Add 3 points to current medical score
                        const currentMedicalScore = formData?.medicalScore?.scoring?.total_score || formData?.medicalScore?.score || 0;
                        const bonusScore = { score: currentMedicalScore + 3, scoring: { total_score: currentMedicalScore + 3 } };
                        
                        updateFormData({ 
                          prescriptionAnalysis: prescriptionResult,
                          medicalScore: bonusScore
                        });
                      } catch (error) {
                        console.error('❌ Prescription analysis error:', error);
                      } finally {
                        setIsLoading(false);
                        setLoadingMessage('');
                      }
                    }
                  }}
                  onFocus={() => trackFieldChange?.('medicalPrescription')}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">
              📋 Take a picture of your medical prescription
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="drugImage">Drug Images</Label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-3">
              {formData.drugImage.map((file, index) => (
                <div key={index} className="relative w-16 h-16 group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Drug ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200"></div>
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all duration-200 shadow-sm">
                <span className="text-2xl text-gray-400 font-light">+</span>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={async (e) => {
                    const newFiles = Array.from(e.target.files || []);
                    const allFiles = [...formData.drugImage, ...newFiles];
                    updateFormData({ drugImage: allFiles });
                    
                    if (allFiles.length > 0) {
                      try {
                        setIsLoading(true);
                        setLoadingMessage('Analyzing drugs...');
                        console.log('🔄 Starting drug analysis for all files...');
                        const medicalNeedsResult = await analyzeFiles(allFiles, '/medical_needs/predict');
                        console.log('✅ Drug analysis complete:', medicalNeedsResult);
                        
                        if (medicalNeedsResult.predicted_conditions && formData.age) {
                          setLoadingMessage('Scoring medical conditions...');
                          console.log('🔄 Starting medical scoring...');
                          const medicalScore = await scoreMedical(medicalNeedsResult.predicted_conditions);
                          console.log('✅ Medical scoring complete:', medicalScore);
                          updateFormData({ 
                            medicalAnalysis: medicalNeedsResult, 
                            medicalScore 
                          });
                        } else {
                          updateFormData({ medicalAnalysis: medicalNeedsResult });
                        }
                      } catch (error) {
                        console.error('❌ Drug analysis error:', error);
                      } finally {
                        setIsLoading(false);
                        setLoadingMessage('');
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-purple-600 font-medium mt-1">
              💊 Take a picture of your drugs/medicines
            </p>
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
