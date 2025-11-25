import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { GradientCircularProgress } from "@/components/GradientCircularProgress";
import { CircularProgress } from "@/components/CircularProgress";


interface StepThreeProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  trackFieldChange?: (fieldName: string) => void;
}

export const StepThree = ({ formData, updateFormData, nextStep, prevStep, trackFieldChange }: StepThreeProps) => {
  const [isLoading, setIsLoading] = useState(false);

  
  // Calculate real-time scores from API responses
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 0;
  const assetScore = formData?.creditEvaluation?.credit_score || 0;
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  const overallScore = (medicalScore || assetScore || behaviorScore) ? 
    Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3) : 0;

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
    
    console.log('Sending to Assets API:', 'http://157.245.20.199:8000/analysis/create_batch');
    
    const response = await fetch('http://157.245.20.199:8000/analysis/create_batch', {
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
    
    // Extract the credit_score_ready_values from the bank analysis result
    const scoringData = bankAnalysisResult.credit_score_ready_values;
    
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
    
    // Extract GPS location data
    const gpsItems = gpsAnalysisResult?.items || [];
    const hasLocationData = gpsItems.length > 0;
    
    // Calculate location stability from GPS data
    const locationStabilityScore = hasLocationData ? 
      (gpsItems.filter((item: any) => item.flag === 'normal').length / gpsItems.length) : 0;
    
    // Extract asset data
    const assetFiles = assetAnalysisResult?.files || [];
    const totalAssetsDetected = assetFiles.reduce((sum: number, file: any) => sum + (file.assets?.length || 0), 0);
    
    // Build detected assets combining both APIs
    const detectedAssets = assetFiles.flatMap((file: any, fileIndex: number) => 
      (file.assets || []).map((asset: any, assetIndex: number) => {
        const gpsItem = gpsItems[fileIndex] || gpsItems[0];
        return {
          asset_type: asset.type || 'unknown',
          asset_count: 1,
          asset_category: asset.category || 'general',
          condition_score: asset.condition_score || 0.5,
          estimated_value: asset.estimated_value || 0,
          gps_coordinates: gpsItem ? `${gpsItem.latitude},${gpsItem.longitude}` : '0.0,0.0',
          device_model: gpsItem?.device_model || 'unknown',
          timestamp: new Date().toISOString(),
          camera_make: asset.camera_make || 'unknown',
          camera_model: asset.camera_model || 'unknown',
          image_source: 'camera',
          detection_confidence: asset.confidence || 0.5,
          exif_verified: !!asset.exif_data
        };
      })
    );
    
    const creditData = {
      message: assetAnalysisResult.message || 'Asset analysis completed',
      batch_id: assetAnalysisResult.batch_id || 'BATCH_' + Date.now(),
      user_id: '8988',
      status: 'completed',
      total_files: formData.assetPictures.length + (formData.homePhoto ? 1 : 0) + (formData.businessPhoto ? 1 : 0),
      estimated_completion_time: assetAnalysisResult.estimated_completion_time || '2-3 minutes',
      status_check_url: assetAnalysisResult.status_check_url || '',
      loan_id: 'LOAN_' + Date.now(),
      analysis_result: {
        batch_id: assetAnalysisResult.batch_id || 'BATCH_' + Date.now(),
        loan_id: 'LOAN_' + Date.now(),
        analysis_timestamp: new Date().toISOString(),
        total_images_processed: formData.assetPictures.length + (formData.homePhoto ? 1 : 0) + (formData.businessPhoto ? 1 : 0),
        total_assets_detected: Math.max(totalAssetsDetected, 1),
        credit_features: {
          total_asset_value: assetFiles.reduce((sum: number, file: any) => sum + (file.total_value || 0), 0),
          asset_diversity_score: assetFiles.length > 0 ? (new Set(assetFiles.flatMap((f: any) => f.assets?.map((a: any) => a.category) || [])).size / 10) : 0,
          asset_categories: assetFiles.reduce((cats: any, file: any) => {
            (file.assets || []).forEach((asset: any) => {
              const category = asset.category || 'general';
              cats[category] = (cats[category] || 0) + 1;
            });
            return cats;
          }, {}),
          has_transport_asset: assetFiles.some((f: any) => f.assets?.some((a: any) => a.category === 'transport')),
          has_electronics_asset: assetFiles.some((f: any) => f.assets?.some((a: any) => a.category === 'electronics')),
          has_livestock_asset: assetFiles.some((f: any) => f.assets?.some((a: any) => a.category === 'livestock')),
          has_property_asset: assetFiles.some((f: any) => f.assets?.some((a: any) => a.category === 'property')),
          has_high_value_assets: detectedAssets.some(asset => asset.estimated_value > 10000),
          high_value_asset_count: detectedAssets.filter(asset => asset.estimated_value > 10000).length,
          average_asset_condition: detectedAssets.length > 0 ? (detectedAssets.reduce((sum, asset) => sum + asset.condition_score, 0) / detectedAssets.length) : 0,
          location_stability_score: locationStabilityScore,
          primary_device_model: gpsItems[0]?.device_model || 'unknown',
          primary_device_tier_score: 0.5,
          unique_devices_count: new Set(gpsItems.map((item: any) => item.device_model)).size,
          asset_to_device_ratio: gpsItems.length > 0 ? (totalAssetsDetected / gpsItems.length) : 0,
          image_span_days: 1,
          images_per_day: formData.assetPictures.length,
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
            gps_coordinates: gpsItems[0] ? `${gpsItems[0].latitude},${gpsItems[0].longitude}` : '0.0,0.0',
            device_model: gpsItems[0]?.device_model || 'unknown',
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
          total_estimated_value: detectedAssets.reduce((sum, asset) => sum + asset.estimated_value, 0),
          has_location_data: hasLocationData,
          devices_detected: Array.from(new Set(gpsItems.map((item: any) => item.device_model || 'unknown'))),
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

  const handleNext = async () => {
    const businessRequirements = !formData.hasBusiness || (formData.businessPhoto && formData.tinNumber);
    
    if (businessRequirements) {
      setIsLoading(true);
      trackFieldChange?.('stepThree_api_processing');
      try {
        let assetAnalysis = null;
        let bankAnalysis = null;
        let mpesaAnalysis = null;
        let bankScore = { bank_statement_credit_score: 0 };
        let creditEvaluation = { credit_score: 0 };
        
        const allFiles = [...formData.assetPictures];
        if (formData.homePhoto) {
          allFiles.push(formData.homePhoto);
        }
        if (formData.hasBusiness && formData.businessPhoto) {
          allFiles.push(formData.businessPhoto);
        }
        
        if (allFiles.length > 0) {
          console.log('Step 1: Analyzing assets...');
          assetAnalysis = await analyzeAssets(allFiles);
          
          console.log('Step 2: Evaluating credit...');
          creditEvaluation = await evaluateCredit(assetAnalysis, null);
        }
        
        if (formData.bankStatement) {
          console.log('Step 3: Analyzing bank statement...');
          bankAnalysis = await analyzeBankStatement(formData.bankStatement, formData.bankPassword);
          
          console.log('Step 5: Scoring bank statement...');
          bankScore = await scoreBankStatement(bankAnalysis);
        }
        
        if (formData.mpesaStatement) {
          console.log('Step 4: Analyzing M-Pesa statement...');
          mpesaAnalysis = await analyzeMpesaStatement(formData.mpesaStatement, formData.mpesaPassword);
        }
        
        updateFormData({
          assetAnalysis: assetAnalysis,
          bankAnalysis: bankAnalysis,
          mpesaAnalysis: mpesaAnalysis,
          bankScore: bankScore,
          creditEvaluation: creditEvaluation
        });
        
        nextStep();
      } catch (error) {
        console.error('Analysis error:', error);
        alert('Failed to analyze data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please complete business information if applicable");
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
                <path id="circle-path-step3" d="M 30,30 m -18,0 a 18,18 0 1,1 36,0 a 18,18 0 1,1 -36,0" />
              </defs>
              <text className="text-[7px] fill-gray-600">
                <textPath href="#circle-path-step3">
                  <animate attributeName="startOffset" values="0%;100%;0%" dur="8s" repeatCount="indefinite" />
                  Overall Score
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-6">Asset Information</h2>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="assetPictures">Asset Pictures * (Minimum 3 required)</Label>
          <div className="mt-2">
            <Input
              id="assetPictures"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => updateFormData({ assetPictures: Array.from(e.target.files || []) })}
              onFocus={() => trackFieldChange?.('assetPictures')}
              className="cursor-pointer"
            />
            <p className="text-xs text-orange-600 font-medium mt-1">
              📸 Take a picture of your 3 most valuable assets
            </p>
            {formData.assetPictures.length > 0 && (
              <>
                <p className={`text-sm mt-2 ${
                  formData.assetPictures.length >= 3 
                    ? 'text-green-600' 
                    : 'text-amber-600'
                }`}>
                  {formData.assetPictures.length} file(s) selected
                  {formData.assetPictures.length < 3 && ` (${3 - formData.assetPictures.length} more needed)`}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                  {formData.assetPictures.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Asset ${index + 1}`}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="bankStatement">Bank Statement *</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <Input
                id="bankStatement"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => updateFormData({ bankStatement: e.target.files?.[0] || null })}
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
          <Label htmlFor="mpesaStatement">M-Pesa Statement *</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <Input
                id="mpesaStatement"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => updateFormData({ mpesaStatement: e.target.files?.[0] || null })}
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
          <Label htmlFor="homePhoto">Photo of Your Home *</Label>
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
              <Label htmlFor="businessPhoto">Photo of Business *</Label>
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
              <Label htmlFor="tinNumber">TIN Number *</Label>
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
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Assets...
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
