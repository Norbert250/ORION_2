import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, ArrowLeft, DollarSign, Calendar, CreditCard, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-new";

const LoanHistory = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          medical_analysis(*),
          credit_evaluation(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCreditScore = (app: any) => {
    return app.credit_evaluation?.[0]?.credit_score || 
           app.medical_analysis?.[0]?.medical_score?.scoring?.total_score || 
           0;
  };

  const getLoanAmount = (creditScore: number) => {
    if (creditScore >= 750) return 'KSh 2,500,000';
    if (creditScore >= 700) return 'KSh 1,500,000';
    if (creditScore >= 650) return 'KSh 1,000,000';
    return 'KSh 500,000';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-blue-500">Active</Badge>;
      case 'Paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Loan History</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{applications.filter(app => app.status === 'approved').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{applications.filter(app => app.status === 'pending').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <Calendar className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{applications.filter(app => app.status === 'rejected').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading applications...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credit Score</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const creditScore = getCreditScore(app);
                    const loanAmount = getLoanAmount(creditScore);
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.loan_id || app.id}</TableCell>
                        <TableCell>{loanAmount}</TableCell>
                        <TableCell>{app.occupation || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="font-semibold">{creditScore}</TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const formData = {
                                ...app,
                                medicalScore: app.medical_analysis?.[0]?.medical_score,
                                creditEvaluation: app.credit_evaluation?.[0],
                                callLogsAnalysis: { credit_score: creditScore }
                              };
                              navigate('/dashboard', { state: { formData } });
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {!loading && applications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No applications found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            size="lg"
            onClick={() => navigate("/apply")}
            className="flex-1"
          >
            Apply for New Loan
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/")}
            className="flex-1"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoanHistory;