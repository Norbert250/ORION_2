import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Users, FileText, TrendingUp, Calendar, CheckCircle, XCircle, FileCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-new";
import { DatabaseService } from "@/lib/database";
import Dashboard from "./Dashboard";

interface Application {
  id: string;
  user_id: string;
  loan_id: string;
  status: string;
  created_at: string;
  medical_score?: number;
  asset_score?: number;
  behavior_score?: number;
}

const AdminDashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        () => {
          console.log('Applications updated, refreshing...');
          fetchApplications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_analysis'
        },
        () => {
          console.log('Medical analysis updated, refreshing...');
          fetchApplications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_evaluation'
        },
        () => {
          console.log('Credit evaluation updated, refreshing...');
          fetchApplications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_logs_analysis'
        },
        () => {
          console.log('Call logs analysis updated, refreshing...');
          fetchApplications();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const filtered = applications.filter(app => 
      app.loan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredApplications(filtered);
  }, [searchTerm, applications]);

  const fetchApplications = async () => {
    try {
      // Fetch applications with related scores
      const { data: apps, error } = await supabase
        .from('applications')
        .select(`
          *,
          medical_analysis(medical_score),
          credit_evaluation(credit_score),
          call_logs_analysis(score)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedApps = apps?.map(app => ({
        ...app,
        medical_score: app.medical_analysis?.[0]?.medical_score?.scoring?.total_score || 0,
        asset_score: app.credit_evaluation?.[0]?.credit_score || 0,
        behavior_score: app.call_logs_analysis?.[0]?.score
      })) || [];

      setApplications(processedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          gps_analysis(*),
          asset_analysis(*),
          medical_analysis(*),
          bank_analysis(*),
          mpesa_analysis(*),
          call_logs_analysis(*),
          credit_evaluation(*),
          id_analysis(*)
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      setSelectedApplication(data);
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Rejected' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Processing' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
        <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      await DatabaseService.updateApplicationStatus(applicationId, newStatus);
      // Update local state immediately
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    avgScore: applications.length > 0 
      ? Math.round(applications.reduce((sum, app) => sum + (((app.medical_score || 0) + (app.asset_score || 0) + (app.behavior_score || 0)) / 3), 0) / applications.length)
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CheckupsMed</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-md">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
              <Button onClick={fetchApplications} variant="ghost" size="sm" className="text-gray-600">Refresh</Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Credit Score</p>
                <p className={`text-2xl font-semibold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
            <p className="text-gray-600">Manage and review credit applications</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              <span className="text-sm text-gray-500">{filteredApplications.length} total</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Medical</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Behavior</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => {
                  const overallScore = Math.round(((app.medical_score || 0) + (app.asset_score || 0) + (app.behavior_score || 0)) / 3);
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.loan_id}</TableCell>
                      <TableCell>{app.user_id}</TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className={getScoreColor(app.medical_score)}>{app.medical_score}%</TableCell>
                      <TableCell className={getScoreColor(app.asset_score)}>{app.asset_score}%</TableCell>
                      <TableCell className={getScoreColor(app.behavior_score)}>{app.behavior_score}%</TableCell>
                      <TableCell className={`font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => fetchApplicationDetails(app.id)}
                                title="Review"
                              >
                                <FileCheck className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Application Review - {app.loan_id}</DialogTitle>
                              </DialogHeader>
                              {selectedApplication ? (
                                <Dashboard 
                                  formData={{
                                    medicalScore: selectedApplication.medical_analysis?.[0]?.medical_score,
                                    medicalAnalysis: selectedApplication.medical_analysis?.[0],
                                    creditEvaluation: selectedApplication.credit_evaluation?.[0],
                                    assetAnalysis: selectedApplication.asset_analysis?.[0],
                                    bankAnalysis: selectedApplication.bank_analysis?.[0],
                                    bankScore: selectedApplication.bank_analysis?.[0]?.bank_score,
                                    mpesaAnalysis: selectedApplication.mpesa_analysis?.[0],
                                    callLogsAnalysis: selectedApplication.call_logs_analysis?.[0],
                                    behaviorAnalysis: selectedApplication.call_logs_analysis?.[0],
                                    gpsAnalysis: selectedApplication.gps_analysis?.[0],
                                    idAnalysis: selectedApplication.id_analysis?.[0]
                                  }} 
                                  isAdminMode={true} 
                                />
                              ) : (
                                <div className="flex items-center justify-center p-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                  <span className="ml-2">Loading application details...</span>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus(app.id, 'approved')}
                          disabled={app.status === 'approved'}
                          className="text-green-600 hover:text-green-700"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={app.status === 'rejected'}
                          className="text-red-600 hover:text-red-700"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;