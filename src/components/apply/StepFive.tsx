import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DatabaseService } from "@/lib/database";
import { GradientCircularProgress } from "@/components/GradientCircularProgress";

interface StepFiveProps {
  formData: ApplicationFormData;
  prevStep: () => void;
  handleSubmit: () => void;
}

export const StepFive = ({ formData, prevStep, handleSubmit }: StepFiveProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitToSupabase = async () => {
    setIsSubmitting(true);
    try {
      // Create application record
      const loanId = 'LOAN_' + Date.now();
      const application = await DatabaseService.createApplication('8988', loanId);
      
      // Upload all files to storage
      await Promise.all([
        // Asset photos
        ...formData.assetPictures.map((file, i) => 
          DatabaseService.uploadFile('assets-photos', `${application.id}/asset_${i}_${file.name}`, file)
        ),
        // Home photo
        formData.homePhoto && DatabaseService.uploadFile('assets-photos', `${application.id}/home_${formData.homePhoto.name}`, formData.homePhoto),
        // Business photo
        formData.businessPhoto && DatabaseService.uploadFile('assets-photos', `${application.id}/business_${formData.businessPhoto.name}`, formData.businessPhoto),
        // Bank statement
        formData.bankStatement && DatabaseService.uploadFile('bank-statements', `${application.id}/${formData.bankStatement.name}`, formData.bankStatement),
        // M-Pesa statement
        formData.mpesaStatement && DatabaseService.uploadFile('mpesa-documents', `${application.id}/${formData.mpesaStatement.name}`, formData.mpesaStatement),
        // Medical prescriptions
        ...formData.medicalPrescription.map((file, i) => 
          DatabaseService.uploadFile('assets-photos', `${application.id}/prescription_${i}_${file.name}`, file)
        ),
        // Drug images
        ...formData.drugImage.map((file, i) => 
          DatabaseService.uploadFile('assets-photos', `${application.id}/drug_${i}_${file.name}`, file)
        ),
        // Call log history
        formData.callLogHistory && DatabaseService.uploadFile('assets-photos', `${application.id}/calllog_${formData.callLogHistory.name}`, formData.callLogHistory),
        // ID documents
        formData.guarantor1Id && DatabaseService.uploadFile('id-documents', `${application.id}/guarantor1_${formData.guarantor1Id.name}`, formData.guarantor1Id),
        formData.guarantor2Id && DatabaseService.uploadFile('id-documents', `${application.id}/guarantor2_${formData.guarantor2Id.name}`, formData.guarantor2Id)
      ].filter(Boolean));
      
      // Store all API analysis results
      await Promise.all([
        formData.gpsAnalysis && DatabaseService.storeGpsAnalysis(application.id, formData.gpsAnalysis),
        formData.assetAnalysis && DatabaseService.storeAssetAnalysis(application.id, formData.assetAnalysis),
        DatabaseService.storeMedicalAnalysis(application.id, formData),
        DatabaseService.storeBankAnalysis(application.id, formData),
        formData.mpesaAnalysis && DatabaseService.storeMpesaAnalysis(application.id, formData.mpesaAnalysis),
        formData.callLogsAnalysis && DatabaseService.storeCallLogsAnalysis(application.id, formData.callLogsAnalysis),
        formData.creditEvaluation && DatabaseService.storeCreditEvaluation(application.id, formData.creditEvaluation),
        formData.guarantor1IdAnalysis && DatabaseService.storeIdAnalysis(application.id, 'guarantor1', formData.guarantor1IdAnalysis),
        formData.guarantor2IdAnalysis && DatabaseService.storeIdAnalysis(application.id, 'guarantor2', formData.guarantor2IdAnalysis)
      ].filter(Boolean));
      
      alert('Application submitted successfully!');
      handleSubmit();
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Calculate real-time scores from API responses
  const medicalScore = formData?.medicalScore?.scoring?.total_score || 
                      formData?.medicalScore?.score || 
                      formData?.bankScore?.bank_statement_credit_score || 0;
  const assetScore = formData?.creditEvaluation?.credit_score || 
                    formData?.assetAnalysis?.total_estimated_value || 0;
  const behaviorScore = formData?.callLogsAnalysis?.credit_score || 
                       formData?.callLogsAnalysis?.score || 0;
  
  const overallScore = (medicalScore || assetScore || behaviorScore) ? 
    Math.round(((medicalScore || 0) + (assetScore || 0) + (behaviorScore || 0)) / 3) : 0;

  return (
    <Card className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 p-6 bg-gradient-to-br from-primary to-accent rounded-lg">
        <div className="text-center space-y-4">
          <h3 className="text-white text-lg font-semibold tracking-wide">COMPOSITE CREDIT SCORE</h3>
          
          <div className="flex justify-center">
            <GradientCircularProgress
              value={overallScore}
              max={100}
              size={140}
              strokeWidth={12}
              gradientId="reviewScoreGradient"
              gradientColors={[
                { offset: "0%", color: "hsl(45, 93%, 47%)" },
                { offset: "60%", color: "hsl(120, 60%, 50%)" },
                { offset: "100%", color: "hsl(158, 64%, 52%)" },
              ]}
              backgroundColor="rgba(255, 255, 255, 0.2)"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{overallScore}</div>
                <div className="text-white/70 text-sm mt-1">/ 100</div>
              </div>
            </GradientCircularProgress>
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
      </div>

      <div className="text-center mb-4 sm:mb-6">
        <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Review Your Application</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Please review all information before submitting</p>
      </div>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Contact & Occupation */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Contact & Occupation</h3>
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Phone Number:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.phoneNumber}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Occupation:</span>
              <span className="text-sm sm:text-base font-medium capitalize">{formData.occupation}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Personal & Medical */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Personal & Medical Information</h3>
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Sex:</span>
              <span className="text-sm sm:text-base font-medium capitalize">{formData.sex}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Age:</span>
              <span className="text-sm sm:text-base font-medium">{formData.age}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Medical Prescription:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.medicalPrescription?.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Drug Image:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.drugImage?.name}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Assets */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Asset Information</h3>
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Asset Pictures:</span>
              <span className="text-sm sm:text-base font-medium">{formData.assetPictures.length} file(s)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Bank Statement:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.bankStatement?.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">M-Pesa Statement:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.mpesaStatement?.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Home Photo:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.homePhoto?.name}</span>
            </div>
            {formData.hasBusiness && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base text-muted-foreground">Business Photo:</span>
                  <span className="text-sm sm:text-base font-medium break-all">{formData.businessPhoto?.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base text-muted-foreground">TIN Number:</span>
                  <span className="text-sm sm:text-base font-medium break-all">{formData.tinNumber}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Guarantors */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Guarantor Information</h3>
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Call Log History:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.callLogHistory?.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Guarantor 1 Phone:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.guarantor1Phone}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-muted-foreground">Guarantor 2 Phone:</span>
              <span className="text-sm sm:text-base font-medium break-all">{formData.guarantor2Phone}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="flex-1 text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={submitToSupabase}
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
