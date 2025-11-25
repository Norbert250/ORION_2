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
      setSessions(data);
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
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">User Form Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.submitted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Left</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.left}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Current Field</TableHead>
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
                      <Badge variant="outline">
                        {getStepName(session.current_step)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.current_field}
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
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
              <div className="text-center py-8 text-muted-foreground">
                No user sessions found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserTracker;