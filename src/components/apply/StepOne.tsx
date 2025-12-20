import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ApplicationFormData } from "@/types/form";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepOneProps {
  formData: ApplicationFormData;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  trackFieldChange?: (fieldName: string) => void;
}

export const StepOne = ({ formData, updateFormData, nextStep, trackFieldChange }: StepOneProps) => {
  const handleNext = () => {
    if (formData.phoneNumber && formData.sector && formData.workType) {
      nextStep();
    } else {
      alert("Please fill in all required fields");
    }
  };

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Contact & Occupation</h2>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+254 700 000 000"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            onFocus={() => trackFieldChange?.('phoneNumber')}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="employmentType">Employment Type *</Label>
          <Select
            value={formData.sector}
            onValueChange={(value) => {
              updateFormData({ sector: value, workType: "" });
            }}
            onOpenChange={(open) => open && trackFieldChange?.('employmentType')}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="selfemployed">Self-employed</SelectItem>
              <SelectItem value="businessowner">Business Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="workType">Select the type of your work *</Label>
          <Select
            value={formData.workType}
            onValueChange={(value) => updateFormData({ workType: value })}
            onOpenChange={(open) => open && trackFieldChange?.('workType')}
            disabled={!formData.sector}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder={formData.sector ? "Select your work type" : "Select employment type first"} />
            </SelectTrigger>
            <SelectContent>
              {formData.sector === 'employed' ? (
                <>
                  <SelectItem value="Nurses">Nurses</SelectItem>
                  <SelectItem value="Bank Tellers">Bank Tellers</SelectItem>
                  <SelectItem value="Teachers">Teachers</SelectItem>
                  <SelectItem value="Accountants">Accountants</SelectItem>
                  <SelectItem value="Police Officers">Police Officers</SelectItem>
                  <SelectItem value="Civil Engineers">Civil Engineers</SelectItem>
                </>
              ) : formData.sector === 'selfemployed' ? (
                <>
                  <SelectItem value="Farmers and livestocks">Farmers and livestocks</SelectItem>
                  <SelectItem value="Construction workers">Construction workers</SelectItem>
                  <SelectItem value="Gardeners and Cleaners">Gardeners and Cleaners</SelectItem>
                  <SelectItem value="Small Vendors(mama mbogas)">Small Vendors(mama mbogas)</SelectItem>
                  <SelectItem value="MTN, Airtel Agents">MTN, Airtel Agents</SelectItem>
                  <SelectItem value="Mototaxi and Bodaboda drivers">Mototaxi and Bodaboda drivers</SelectItem>
                  <SelectItem value="Shoe makers and repairers">Shoe makers and repairers</SelectItem>
                  <SelectItem value="Electronics repairers">Electronics repairers</SelectItem>
                  <SelectItem value="Mechanicians">Mechanicians</SelectItem>
                  <SelectItem value="Hair dressers">Hair dressers</SelectItem>
                </>
              ) : formData.sector === 'businessowner' ? (
                <>
                  <SelectItem value="Retail Business">Retail Business</SelectItem>
                  <SelectItem value="Restaurant/Food Service">Restaurant/Food Service</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Technology/IT Services">Technology/IT Services</SelectItem>
                  <SelectItem value="Construction Company">Construction Company</SelectItem>
                  <SelectItem value="Transportation/Logistics">Transportation/Logistics</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Healthcare Services">Healthcare Services</SelectItem>
                  <SelectItem value="Education/Training">Education/Training</SelectItem>
                  <SelectItem value="Other Business">Other Business</SelectItem>
                </>
              ) : null}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm">
          <p className="font-semibold text-foreground">Required Documents:</p>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            <li>At least 3 photos of your assets</li>
            <li>Photo of your home</li>
            <li>6 months of bank statements</li>
            <li>6 months of salary payslips</li>
            <li>2 guarantors with ID documents</li>
            <li>Business documents (if applicable)</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-2 text-sm">
          <p className="font-semibold text-amber-900">Important Notes:</p>
          <ul className="space-y-1 list-disc list-inside text-amber-800">
            <li>All documents will be processed securely and confidentially</li>
            <li>Processing may take a few minutes per document</li>
            <li>Ensure all photos are clear and well-lit</li>
            <li>Passwords are required for encrypted documents</li>
            <li>You can upload multiple files for each document type</li>
          </ul>
        </div>

        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
