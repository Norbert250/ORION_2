import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { GradientCircularProgress } from "@/components/GradientCircularProgress";
import { CircularProgress } from "@/components/CircularProgress";
import { InfoModal } from "./medicalResultsModal";


interface StepThreeProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  trackFieldChange?: (fieldName: string) => void;
}

export const StepThree = ({ formData, updateFormData, nextStep, prevStep, trackFieldChange }: StepThreeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  
  // Calculate real-time scores from API responses
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
  
  console.log('STEP 3 DEBUG - Medical score:', medicalScore);
  console.log('STEP 3 DEBUG - Bank score:', bankScore);
  console.log('STEP 3 DEBUG - Raw asset score:', rawAssetScore);
  console.log('STEP 3 DEBUG - Final asset score:', assetScore);
  console.log('STEP 3 DEBUG - M-Pesa behavior score:', mpesaBehaviorScore);
  console.log('STEP 3 DEBUG - Call logs score:', callLogsScore);
  console.log('STEP 3 DEBUG - Guarantor bonuses:', guarantor1Bonus + guarantor2Bonus);
  console.log('STEP 3 DEBUG - Behavior score (with bonuses):', behaviorScore);
  console.log('STEP 3 DEBUG - Overall score:', overallScore);

  const analyzeGPS = async (files: File[]) => {
    const formData = new FormData();
    
    formData.append('loan_id', 'LOAN_' + Date.now());
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    console.log('Sending to GPS API:', 'https://gps-fastapi-upload.onrender.com/users/4444/images');
    
    const response = await fetch('https://gps-fastapi-upload.onrender.com/users/4444/images', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GPS API Error:', errorText);
      throw new Error(`GPS analysis failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('GPS API Response:', result);
    return result;
  };

  const analyzeAssets = async (files: File[]) => {
    const formData = new FormData();
    
    formData.append('user_id', '8988');
    formData.append('loan_id', 'LOAN_' + Date.now());
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    console.log('Sending to Assets API:', 'https://credit-scoring-api-30ec.onrender.com/api/v1/process-images');
    
    const response = await fetch('https://credit-scoring-api-30ec.onrender.com/api/v1/process-images', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Assets API Error:', errorText);
      throw new Error(`Assets analysis failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Assets API Response:', result);
    return result;
  };

  const analyzeBankStatement = async (file: File, password?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', '8988');
    formData.append('loan_id', 'LOAN_' + Date.now());
    if (password) formData.append('password', password);
    
    console.log('Analyzing bank statement...');
    
    const response = await fetch('https://orionapisalpha.onrender.com/bank_statements/analyze', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bank Statement API Error:', errorText);
      throw new Error(`Bank statement analysis failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Bank Statement Response:', result);
    return result;
  };

  const analyzeMpesaStatement = async (file: File, password?: string) => {
    const formData = new FormData();
    formData.append('user_id', '8988');
    formData.append('loan_id', 'LOAN_' + Date.now());
    formData.append('password', password || '180008');
    formData.append('file', file);
    
    console.log('Analyzing M-Pesa statement...');
    
    const response = await fetch('https://orionapisalpha.onrender.com/mpesa/extractmpesa', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('M-Pesa API Error:', errorText);
      throw new Error(`M-Pesa analysis failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('M-Pesa Response:', result);
    return result;
  };

  const scoreBankStatement = async (bankAnalysisResult: any) => {
    console.log('Scoring bank statement...');
    
    // Send the complete credit_score_ready_values structure
    const scoringData = {
      ...bankAnalysisResult.credit_score_ready_values,
      user_id: '8988',
      loan_id: 'LOAN_' + Date.now()
    };
    
    const response = await fetch('https://orionapisalpha.onrender.com/bank/bankstatementscore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoringData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bank Statement Scoring API Error:', errorText);
      throw new Error(`Bank statement scoring failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Bank Statement Scoring Response:', result);
    return result;
  };

  const evaluateCredit = async (assetAnalysisResult: any, gpsAnalysisResult?: any) => {
    console.log('Evaluating credit with asset data...');
    
    // Extract asset data from new API format
    const assetsDetected = assetAnalysisResult?.assets_detected || [];
    const totalAssetsDetected = assetsDetected.length;
    const totalEstimatedValue = assetAnalysisResult?.total_estimated_value || 0;
    const hasLocationData = assetsDetected.some((asset: any) => asset.exif_location);
    
    // Build detected assets from new API format
    const detectedAssets = assetsDetected.map((asset: any) => ({
      asset_type: asset.object_name || 'unknown',
      asset_count: 1,
      asset_category: 'general',
      condition_score: asset.condition === 'good' ? 0.8 : asset.condition === 'fair' ? 0.6 : 0.4,
      estimated_value: asset.estimated_value || 0,
      gps_coordinates: asset.exif_location || '0.0,0.0',
      device_model: 'unknown',
      timestamp: new Date().toISOString(),
      camera_make: 'unknown',
      camera_model: 'unknown',
      image_source: 'camera',
      detection_confidence: asset.confidence || 0.5,
      exif_verified: asset.has_exif || false
    }));
    
    const creditData = {
      message: 'Asset analysis completed',
      batch_id: assetAnalysisResult.batch_id || 'BATCH_' + Date.now(),
      user_id: '8988',
      status: 'completed',
      total_files: assetAnalysisResult.images_processed || 1,
      estimated_completion_time: '2-3 minutes',
      status_check_url: '',
      loan_id: 'LOAN_' + Date.now(),
      analysis_result: {
        batch_id: assetAnalysisResult.batch_id || 'BATCH_' + Date.now(),
        loan_id: assetAnalysisResult.loan_id || 'LOAN_' + Date.now(),
        analysis_timestamp: new Date().toISOString(),
        total_images_processed: assetAnalysisResult.images_processed || 1,
        total_assets_detected: totalAssetsDetected,
        credit_features: {
          total_asset_value: totalEstimatedValue,
          asset_diversity_score: totalAssetsDetected > 0 ? (new Set(detectedAssets.map(a => a.asset_type)).size / 10) : 0,
          asset_categories: { general: totalAssetsDetected },
          has_transport_asset: detectedAssets.some(a => a.asset_type.toLowerCase().includes('car') || a.asset_type.toLowerCase().includes('vehicle')),
          has_electronics_asset: detectedAssets.some(a => a.asset_type.toLowerCase().includes('phone') || a.asset_type.toLowerCase().includes('laptop')),
          has_livestock_asset: detectedAssets.some(a => a.asset_type.toLowerCase().includes('cow') || a.asset_type.toLowerCase().includes('goat')),
          has_property_asset: detectedAssets.some(a => a.asset_type.toLowerCase().includes('house') || a.asset_type.toLowerCase().includes('land')),
          has_high_value_assets: detectedAssets.some(asset => asset.estimated_value > 10000),
          high_value_asset_count: detectedAssets.filter(asset => asset.estimated_value > 10000).length,
          average_asset_condition: detectedAssets.length > 0 ? (detectedAssets.reduce((sum, asset) => sum + asset.condition_score, 0) / detectedAssets.length) : 0,
          location_stability_score: hasLocationData ? 0.8 : 0,
          primary_device_model: 'unknown',
          primary_device_tier_score: 0.5,
          unique_devices_count: 1,
          asset_to_device_ratio: totalAssetsDetected,
          image_span_days: 1,
          images_per_day: assetAnalysisResult.images_processed || 1,
          has_recent_images: true,
          asset_concentration_score: 0.5,
          average_detection_confidence: detectedAssets.length > 0 ? (detectedAssets.reduce((sum, asset) => sum + asset.detection_confidence, 0) / detectedAssets.length) : 0
        },
        detected_assets: detectedAssets.length > 0 ? detectedAssets : [
          {
            asset_type: 'general',
            asset_count: 1,
            asset_category: 'general',
            condition_score: 0.5,
            estimated_value: 1000,
            gps_coordinates: '0.0,0.0',
            device_model: 'unknown',
            timestamp: new Date().toISOString(),
            camera_make: 'unknown',
            camera_model: 'unknown',
            image_source: 'camera',
            detection_confidence: 0.5,
            exif_verified: false
          }
        ],
        summary: {
          unique_asset_types: new Set(detectedAssets.map(asset => asset.asset_type)).size,
          asset_categories_found: Array.from(new Set(detectedAssets.map(asset => asset.asset_category))),
          total_estimated_value: totalEstimatedValue,
          has_location_data: hasLocationData,
          devices_detected: ['unknown'],
          exif_verification_rate: detectedAssets.length > 0 ? (detectedAssets.filter(asset => asset.exif_verified).length / detectedAssets.length).toString() : '0',
          authenticity_verification: {
            images_with_exif: detectedAssets.filter(asset => asset.exif_verified).length,
            images_without_exif: detectedAssets.filter(asset => !asset.exif_verified).length,
            evaluation_policy: 'standard',
            note: hasLocationData ? 'GPS verification available' : 'No GPS data available'
          }
        }
      }
    };
    
    console.log('Credit evaluation request data:', JSON.stringify(creditData, null, 2));
    
    const response = await fetch('https://rule-based-credit-scoring.onrender.com/evaluate_credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creditData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Credit Evaluation API Error:', errorText);
      throw new Error(`Credit evaluation failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Credit Evaluation Response:', result);
    return result;
  };

  const handleNext = () => {
    const businessRequirements = !formData.hasBusiness || (formData.businessPhoto && formData.tinNumber);
    
    if (businessRequirements) {
      trackFieldChange?.('stepThree_completed');
      nextStep();
    } else {
      alert("Please complete business information if applicable");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
       <InfoModal
  isOpen={isModalOpen}
  message="You can save more with COVA when you choose the best financing option tailored for you."
  onClose={() => setIsModalOpen(false)}
  onContinue={() => {
    setIsModalOpen(false) 
  }}
/>
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

      <h2 className="text-2xl font-bold text-foreground mb-6">Asset Information</h2>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="assetPictures">Asset Pictures</Label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-3">
              {formData.assetPictures.map((file, index) => (
                <div key={index} className="relative w-16 h-16 group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Asset ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                  <button
                    onClick={() => {
                      const newFiles = formData.assetPictures.filter((_, i) => i !== index);
                      updateFormData({ assetPictures: newFiles });
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
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
                    const allFiles = [...formData.assetPictures, ...newFiles];
                    updateFormData({ assetPictures: allFiles });
                    
                    if (allFiles.length > 0) {
                      try {
                        setIsLoading(true);
                        setLoadingMessage('Analyzing assets...');
                        console.log('🔄 Starting asset analysis...');
                        const assetAnalysis = await analyzeAssets([...allFiles, ...(formData.homePhoto ? [formData.homePhoto] : []), ...(formData.businessPhoto ? [formData.businessPhoto] : [])]);
                        console.log('✅ Asset analysis complete:', assetAnalysis);
                        
                        console.log('🔄 Starting credit evaluation...');
                        const creditEvaluation = await evaluateCredit(assetAnalysis, null);
                        console.log('✅ Credit evaluation complete:', creditEvaluation);
                        
                        console.log('Storing asset analysis:', assetAnalysis);
                        console.log('Storing credit evaluation:', creditEvaluation);
                        updateFormData({ assetAnalysis, creditEvaluation });
                      } catch (error) {
                        console.error('❌ Asset analysis error:', error);
                      } finally {
                        setIsLoading(false);
                        setLoadingMessage('');
                      }
                    }
                  }}
                  onFocus={() => trackFieldChange?.('assetPictures')}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-orange-600 font-medium mt-1">
              📸 Take a picture of your 3 most valuable assets
            </p>
            <p className={`text-sm mt-1 ${
              formData.assetPictures.length >= 3 
                ? 'text-[#0090ff]' 
                : 'text-amber-600'
            }`}>
              {formData.assetPictures.length} file(s) selected
              {formData.assetPictures.length < 3 && ` (${3 - formData.assetPictures.length} more needed)`}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="bankStatement">Bank Statement</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <Input
                id="bankStatement"
                type="file"
                accept=".pdf,image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  updateFormData({ bankStatement: file });
                  
                  if (file) {
                    try {
                      setIsLoading(true);
                      setLoadingMessage('Analyzing bank statement...');
                      console.log('🔄 Starting bank statement analysis...');
                      const bankAnalysis = await analyzeBankStatement(file, formData.bankPassword);
                      console.log('✅ Bank statement analysis complete:', bankAnalysis);
                      
                      const bankScore = await scoreBankStatement(bankAnalysis);
                      console.log('✅ Bank statement scoring complete:', bankScore);
                      
                      updateFormData({ 
                        bankAnalysis, 
                        bankScore
                      });
                    } catch (error) {
                      console.error('❌ Bank statement analysis error:', error);
                    } finally {
                      setIsLoading(false);
                      setLoadingMessage('');
                    }
                  }
                }}
                onFocus={() => trackFieldChange?.('bankStatement')}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password (optional)"
                value={formData.bankPassword || ''}
                onChange={(e) => updateFormData({ bankPassword: e.target.value })}
                onFocus={() => trackFieldChange?.('bankPassword')}
              />
            </div>
          </div>
          {formData.bankStatement && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {formData.bankStatement.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="mpesaStatement">M-Pesa Statement</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <Input
                id="mpesaStatement"
                type="file"
                accept=".pdf,image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  updateFormData({ mpesaStatement: file });
                  
                  if (file) {
                    try {
                      setIsLoading(true);
                      setLoadingMessage('Analyzing M-Pesa statement...');
                      console.log('🔄 Starting M-Pesa analysis...');
                      const mpesaAnalysis = await analyzeMpesaStatement(file, formData.mpesaPassword);
                      console.log('✅ M-Pesa analysis complete:', mpesaAnalysis);
                      
                      updateFormData({ 
                        mpesaAnalysis
                      });
                    } catch (error) {
                      console.error('❌ M-Pesa analysis error:', error);
                    } finally {
                      setIsLoading(false);
                      setLoadingMessage('');
                    }
                  }
                }}
                onFocus={() => trackFieldChange?.('mpesaStatement')}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password (optional)"
                value={formData.mpesaPassword || ''}
                onChange={(e) => updateFormData({ mpesaPassword: e.target.value })}
                onFocus={() => trackFieldChange?.('mpesaPassword')}
              />
            </div>
          </div>
          {formData.mpesaStatement && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {formData.mpesaStatement.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="homePhoto">Photo of Your Home</Label>
          <div className="mt-2">
            <Input
              id="homePhoto"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => updateFormData({ homePhoto: e.target.files?.[0] || null })}
              onFocus={() => trackFieldChange?.('homePhoto')}
              className="cursor-pointer"
            />
            <p className="text-xs text-blue-600 font-medium mt-1">
              🏠 Take a picture of your home
            </p>
            {formData.homePhoto && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {formData.homePhoto.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="hasBusiness"
            checked={formData.hasBusiness}
            onCheckedChange={(checked) => {
              updateFormData({ hasBusiness: checked as boolean });
              trackFieldChange?.('hasBusiness');
            }}
          />
          <Label htmlFor="hasBusiness" className="cursor-pointer">
            I have a business
          </Label>
        </div>

        {formData.hasBusiness && (
          <div className="space-y-4 pl-6 border-l-2 border-primary">
            <div>
              <Label htmlFor="businessPhoto">Photo of Business</Label>
              <div className="mt-2">
                <Input
                  id="businessPhoto"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => updateFormData({ businessPhoto: e.target.files?.[0] || null })}
                  onFocus={() => trackFieldChange?.('businessPhoto')}
                  className="cursor-pointer"
                />
                {formData.businessPhoto && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {formData.businessPhoto.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="tinNumber">TIN Number</Label>
              <Input
                id="tinNumber"
                type="text"
                placeholder="Enter TIN number"
                value={formData.tinNumber}
                onChange={(e) => updateFormData({ tinNumber: e.target.value })}
                onFocus={() => trackFieldChange?.('tinNumber')}
                className="mt-2"
              />
            </div>
          </div>
        )}

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
