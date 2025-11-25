import { supabase } from './supabase-new'
import { ApplicationFormData } from '@/types/form'

export class DatabaseService {
  // Create main application record
  static async createApplication(userId: string, loanId: string) {
    const { data, error } = await supabase
      .from('applications')
      .insert({ user_id: userId, loan_id: loanId })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Upload file to storage
  static async uploadFile(bucket: string, filePath: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)
    
    if (error) throw error
    return data
  }

  // Store GPS analysis
  static async storeGpsAnalysis(applicationId: string, data: any) {
    const { error } = await supabase
      .from('gps_analysis')
      .insert({
        application_id: applicationId,
        user_id: data.user_id,
        status: data.status,
        reference: data.reference,
        items: data.items
      })
    
    if (error) throw error
  }

  // Store asset analysis
  static async storeAssetAnalysis(applicationId: string, data: any) {
    const { error } = await supabase
      .from('asset_analysis')
      .insert({
        application_id: applicationId,
        batch_id: data.batch_id,
        message: data.message,
        total_files: data.total_files,
        files: data.files
      })
    
    if (error) throw error
  }

  // Store medical analysis
  static async storeMedicalAnalysis(applicationId: string, formData: ApplicationFormData) {
    const { error } = await supabase
      .from('medical_analysis')
      .insert({
        application_id: applicationId,
        prescription_analysis: formData.prescriptionAnalysis,
        drug_analysis: formData.drugAnalysis,
        medical_needs: formData.medicalNeeds,
        medical_score: formData.medicalScore
      })
    
    if (error) throw error
  }

  // Store bank analysis
  static async storeBankAnalysis(applicationId: string, formData: ApplicationFormData) {
    const { error } = await supabase
      .from('bank_analysis')
      .insert({
        application_id: applicationId,
        analysis_result: formData.bankAnalysis,
        credit_score_ready_values: formData.bankAnalysis?.credit_score_ready_values,
        bank_score: formData.bankScore
      })
    
    if (error) throw error
  }

  // Store M-Pesa analysis
  static async storeMpesaAnalysis(applicationId: string, data: any) {
    const { error } = await supabase
      .from('mpesa_analysis')
      .insert({
        application_id: applicationId,
        analysis_result: data
      })
    
    if (error) throw error
  }

  // Store call logs analysis
  static async storeCallLogsAnalysis(applicationId: string, data: any) {
    const { error } = await supabase
      .from('call_logs_analysis')
      .insert({
        application_id: applicationId,
        credit_score: data.credit_score,
        score: data.score,
        analysis_result: data
      })
    
    if (error) throw error
  }

  // Store credit evaluation
  static async storeCreditEvaluation(applicationId: string, data: any) {
    const { error } = await supabase
      .from('credit_evaluation')
      .insert({
        application_id: applicationId,
        credit_score: data.credit_score,
        evaluation_result: data
      })
    
    if (error) throw error
  }

  // Store ID analysis
  static async storeIdAnalysis(applicationId: string, guarantorType: string, data: any) {
    const { error } = await supabase
      .from('id_analysis')
      .insert({
        application_id: applicationId,
        guarantor_type: guarantorType,
        analysis_result: data
      })
    
    if (error) throw error
  }

  // Update application status
  static async updateApplicationStatus(applicationId: string, status: string) {
    console.log(`Updating application ${applicationId} to status: ${status}`);
    
    const { data, error } = await supabase
      .from('applications')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
    
    if (error) {
      console.error('Database update error:', error);
      throw error;
    }
    
    console.log('Status updated successfully:', data);
    return data;
  }

  // User tracking methods
  static async createUserSession(sessionId: string, phoneNumber: string) {
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        session_id: sessionId,
        phone_number: phoneNumber,
        current_step: 1,
        current_field: 'phoneNumber',
        status: 'inprogress',
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })

    if (error) throw error
  }

  static async updateUserSession(sessionId: string, updates: {
    current_step?: number;
    current_field?: string;
    status?: 'inprogress' | 'submitted' | 'left';
  }) {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        ...updates,
        last_activity: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    if (error) throw error
  }

  static async getUserSessions() {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Database error:', error)
      return []
    }
    return data || []
  }
}