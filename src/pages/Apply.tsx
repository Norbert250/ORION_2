import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { StepOne } from "@/components/apply/StepOne";
import { StepTwo } from "@/components/apply/StepTwo";
import { StepThree } from "@/components/apply/StepThree";
import { StepFour } from "@/components/apply/StepFour";
import { StepFive } from "@/components/apply/StepFive";
import { useUserTracking } from "@/hooks/useUserTracking";

import { ApplicationFormData } from "@/types/form";

const Apply = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>({
    phoneNumber: "",
    occupation: "",
    sector: "",
    workType: "",
    sex: "",
    age: "",
    medicalPrescription: [],
    drugImage: [],
    assetPictures: [],
    bankStatement: null,
    mpesaStatement: null,
    homePhoto: null,
    hasBusiness: false,
    businessPhoto: null,
    tinNumber: "",
    callLogHistory: null,
    guarantor1Id: null,
    guarantor2Id: null,
    guarantor1Phone: "",
    guarantor2Phone: "",
  });

  const { trackFieldChange, markAsSubmitted } = useUserTracking(formData.phoneNumber, currentStep);

  const updateFormData = (data: Partial<ApplicationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    markAsSubmitted();
    console.log("Form submitted:", formData);
    alert("Application submitted successfully!");
    navigate("/dashboard", { state: { formData } });
  };



  console.log('Apply component rendering', { formData, currentStep });
  
  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Checkups Orion</h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg">Credit Application Form</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 sm:h-2 mx-0.5 sm:mx-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Step {currentStep} of 5
          </p>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <StepOne formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} trackFieldChange={trackFieldChange} />
        )}
        {currentStep === 2 && (
          <StepTwo formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} trackFieldChange={trackFieldChange} />
        )}
        {currentStep === 3 && (
          <StepThree formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} trackFieldChange={trackFieldChange} />
        )}
        {currentStep === 4 && (
          <StepFour formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} trackFieldChange={trackFieldChange} />
        )}
        {currentStep === 5 && (
          <StepFive formData={formData} prevStep={prevStep} handleSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
};

export default Apply;
