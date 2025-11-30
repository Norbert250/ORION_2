import { useState, useEffect } from "react";
import { Activity, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatabaseService } from "@/lib/database";
import { supabase } from "@/lib/supabase-new";

interface UserSession {
  id: string;
  session_id: string;
  phone_number: string;
  current_step: number;
  current_field: string;
  status: 'inprogress' | 'submitted' | 'left';
  started_at: string;
  last_activity: string;
}

const UserTracker = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel('user_sessions_realtime')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'user_sessions' },
        (payload) => {
          console.log('Session updated:', payload.new);
          setSessions(prev => prev.map(session => 
            session.id === payload.new.id ? payload.new as UserSession : session
          ));
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'user_sessions' },
        (payload) => {
          console.log('New session:', payload.new);
          setSessions(prev => [payload.new as UserSession, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Real-time connection established');
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          console.log('Real-time connection closed');
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      console.log('Starting fetchSessions...');
      const data = await DatabaseService.getUserSessions();
      console.log('Received data:', data);
      
      // Auto-update sessions that have been inactive for more than 5 minutes
      const updatedData = data.map(session => {
        const lastActivity = new Date(session.last_activity).getTime();
        const now = Date.now();
        const inactiveMinutes = (now - lastActivity) / (1000 * 60);
        
        if (session.status === 'inprogress' && inactiveMinutes > 10) {
          return { ...session, status: 'left' };
        }
        return session;
      });
      
      setSessions(updatedData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'inprogress':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'submitted':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'left':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Left</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStepName = (step: number) => {
    const steps = {
      1: 'Personal Info',
      2: 'Medical Info',
      3: 'Asset Info',
      4: 'Guarantor Info',
      5: 'Review & Submit'
    };
    return steps[step as keyof typeof steps] || `Step ${step}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeDiff = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 30) return 'Just now';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Auto-refresh data every 5 seconds to reduce load
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, [loading]);

  const stats = {
    total: sessions.length,
    inProgress: sessions.filter(s => s.status === 'inprogress').length,
    submitted: sessions.filter(s => s.status === 'submitted').length,
    left: sessions.filter(s => s.status === 'left').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading user sessions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">CheckupsMed Admin</h1>
              <p className="text-sm text-gray-500">User Application Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-gray-600">
                {isConnected ? 'Live Updates' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abandoned</p>
                <p className="text-2xl font-bold text-red-600">{stats.left}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <p className="text-sm text-gray-500">Monitor user application progress in real-time</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.phone_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {session.current_step}
                        </div>
                        <span className="font-medium">{getStepName(session.current_step)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          session.status === 'inprogress' ? 'bg-blue-500' :
                          session.status === 'submitted' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="capitalize font-medium">{session.status.replace('inprogress', 'In Progress')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTime(session.started_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>{formatTime(session.last_activity)}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeDiff(session.last_activity)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sessions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No applications found</p>
                <p className="text-sm">Applications will appear here as users start the process</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTracker;