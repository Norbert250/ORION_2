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
  
  console.log('STEP 2 DEBUG - Final scores:', { medicalScore, assetScore, behaviorScore });
  console.log('STEP 2 DEBUG - Medical score displayed in tier:', medicalScore);
  console.log('STEP 2 DEBUG - formData.medicalScore:', formData?.medicalScore);
  
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
    
    const requestData = {
      age: parseInt(formData.age) || 25,
      conditions: medicalConditions
    };
    
    console.log('Medical scoring request data:', JSON.stringify(requestData, null, 2));
    console.log('Conditions array:', medicalConditions);
    console.log('Age:', parseInt(formData.age));
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch('https://web-production-587b9.up.railway.app/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
        
        console.log('Medical scoring response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Medical scoring API error:', errorText);
          throw new Error(`Medical scoring failed: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Medical scoring API response:', JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error(`Medical scoring attempt ${i + 1} failed:`, error);
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
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 md:p-8">
      {/* Score Section */}
      <Card className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-[#123264] to-[#0090ff] border shadow-md">
        <div className="text-center space-y-3 sm:space-y-4">
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
              <div className="text-lg font-bold">{behaviorScore || '--'}</div>
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
            <Label htmlFor="yearOfBirth">Year of Birth *</Label>
            <Select
              value={formData.yearOfBirth}
              onValueChange={(value) => {
                const currentYear = new Date().getFullYear();
                const calculatedAge = (currentYear - parseInt(value)).toString();
                updateFormData({ yearOfBirth: value, age: calculatedAge });
              }}
              onOpenChange={(open) => open && trackFieldChange?.('yearOfBirth')}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select year of birth" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 2025 - 1900 + 1 }, (_, i) => {
                  const year = 2025 - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formData.yearOfBirth && (
              <p className="text-sm text-muted-foreground mt-1">
                Age: {formData.age} years old
              </p>
            )}
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
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-[#f4faff] transition-all duration-200 shadow-sm">
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
            <p className="text-xs text-[#60646b] font-medium mt-1">
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
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-[#f4faff] transition-all duration-200 shadow-sm">
                <span className="text-2xl text-gray-400 font-light">+</span>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={async (e) => {
                    trackFieldChange?.('drugImage');
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
                          console.log('🔄 Starting medical scoring with conditions:', medicalNeedsResult.predicted_conditions);
                          console.log('🔄 Age:', formData.age);
                          
                          try {
                            const medicalScore = await scoreMedical(medicalNeedsResult.predicted_conditions);
                            console.log('✅ Medical scoring complete:', medicalScore);
                            
                            // Medical score = API score + prescription bonus
                            const apiScore = medicalScore.score || medicalScore.scoring?.total_score || 0;
                            const prescriptionBonus = formData?.prescriptionAnalysis ? 3 : 0;
                            const totalScore = apiScore + prescriptionBonus;
                            
                            const totalMedicalScore = {
                              ...medicalScore,
                              score: totalScore,
                              scoring: {
                                ...medicalScore.scoring,
                                total_score: totalScore
                              }
                            };
                            
                            console.log('✅ Total medical score with prescription bonus:', totalMedicalScore);
                            
                            updateFormData({ 
                              medicalAnalysis: medicalNeedsResult, 
                              medicalScore: totalMedicalScore
                            });
                          } catch (scoringError) {
                            console.error('❌ Medical scoring failed:', scoringError);
                            // Continue with just the analysis result
                            updateFormData({ medicalAnalysis: medicalNeedsResult });
                          }
                        } else {
                          console.log('⚠️ Missing conditions or age:', { 
                            conditions: medicalNeedsResult.predicted_conditions, 
                            age: formData.age 
                          });
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
            <p className="text-xs text-[#60646b] font-medium mt-1">
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
    </div>
  );
};
