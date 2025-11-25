import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Activity, 
  HeartPulse, 
  Shield, 
  Clock, 
  CheckCircle2,
  Menu,
  X,
  ArrowRight,
  Users,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState<'formal' | 'informal' | null>(null);
  const [selectedWorkType, setSelectedWorkType] = useState('');

  const handleSectorSelect = (sector: 'formal' | 'informal') => {
    setSelectedSector(sector);
    setSelectedWorkType('');
  };

  const handleContinue = () => {
    if (selectedSector) {
      setShowSectorModal(false);
      navigate('/apply', { state: { sector: selectedSector } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Checkups Orion</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              {user ? (
                <Button variant="outline" onClick={() => navigate("/admin")}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button onClick={() => setShowSectorModal(true)}>
                    Apply Now
                  </Button>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden bg-card border-t border-border">
              <div className="px-4 py-4 space-y-3">
                {user ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigate("/admin");
                      setShowMobileMenu(false);
                    }}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        navigate("/auth");
                        setShowMobileMenu(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setShowSectorModal(true);
                        setShowMobileMenu(false);
                      }}
                    >
                      Apply for Loan
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {user ? (
            /* Authenticated User View */
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 lg:mb-8 shadow-glow">
                <Activity className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary-foreground" />
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6">
                Welcome back, <span className="text-primary">{user.email?.split('@')[0]}</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto px-2">
                Ready to apply for a loan or manage your existing applications?
              </p>
            </div>
          ) : (
            /* Public Hero */
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 lg:mb-8 shadow-glow">
                <Activity className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary-foreground" />
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8">
                Healthcare Financing,
                <span className="block text-primary">Simplified</span>
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2">
                Access affordable medical care with flexible payment options. Get approved in minutes with our AI-powered credit assessment.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-6 sm:mb-8 lg:mb-12 px-4">
            {user ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center mb-3 lg:mb-6 max-w-4xl mx-auto">
                <Button
                  size="lg"
                  className="text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-6 sm:py-8 h-auto flex items-center justify-center w-full sm:flex-1"
                  onClick={() => setShowSectorModal(true)}
                >
                  Apply for New Loan
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-6 sm:py-8 h-auto flex items-center justify-center w-full sm:flex-1"
                  onClick={() => navigate('/apply')}
                >
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                  Pay Loan
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-6 sm:py-8 h-auto flex items-center justify-center w-full sm:flex-1"
                  onClick={() => navigate('/loan-history')}
                >
                  <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                  Loan History
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto">
                <Button
                  size="lg"
                  className="text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-6 sm:py-8 h-auto flex items-center justify-center w-full sm:flex-1"
                  onClick={() => setShowSectorModal(true)}
                >
                  Apply for Loan
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-6 sm:py-8 h-auto flex items-center justify-center w-full sm:flex-1"
                  onClick={() => navigate('/loan-history')}
                >
                  <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                  Loan History
                </Button>
              </div>
            )}
          </div>


        </div>
      </section>

      {/* Features Section */}
      {!user && (
        <section className="py-8 sm:py-12 lg:py-16 bg-card/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Choose Checkups Orion?
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                We make healthcare financing accessible, transparent, and stress-free
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="p-6 sm:p-8 text-center hover:shadow-elegant-lg transition-all duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 sm:w-8 sm:w-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Secure & Safe</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Your data is protected with bank-level security and encryption
                </p>
              </Card>

              <Card className="p-6 sm:p-8 text-center hover:shadow-elegant-lg transition-all duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-health-green to-health-yellow rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 sm:w-8 sm:w-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Quick Approval</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Get approved in minutes with our AI-powered credit assessment system
                </p>
              </Card>

              <Card className="p-6 sm:p-8 text-center hover:shadow-elegant-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-health-orange to-health-red rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 sm:w-8 sm:w-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">For Everyone</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Tailored solutions for both formal and informal sector workers
                </p>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">Checkups Orion</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Financial Solutions for Everyone</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md text-sm sm:text-base">
                Making healthcare accessible through flexible financing solutions. Fast, secure, and reliable medical loan processing.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Contact</h4>
              <div className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <p>support@orionafrica.com</p>
                <p>+1 (800) 123-4567</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 sm:pt-8 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">
              &copy; {new Date().getFullYear()} Checkups Orion. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Employment Type Modal */}
      {showSectorModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="max-w-md w-full p-4 sm:p-6 lg:p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-glow">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">Choose Your Employment Type</h3>
              <p className="text-muted-foreground text-sm sm:text-base">This helps us customize your application process</p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 lg:mb-8">
              <button
                onClick={() => handleSectorSelect('formal')}
                className={`w-full p-3 sm:p-4 lg:p-6 text-left border-2 rounded-xl transition-all duration-300 group min-h-[70px] sm:min-h-[80px] lg:min-h-[100px] ${
                  selectedSector === 'formal' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-primary/20 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground mb-1 text-sm sm:text-base">Employed/Salaried</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Regular job with salary, bank statements, and payslips available
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSectorSelect('informal')}
                className={`w-full p-3 sm:p-4 lg:p-6 text-left border-2 rounded-xl transition-all duration-300 group min-h-[70px] sm:min-h-[80px] lg:min-h-[100px] ${
                  selectedSector === 'informal' 
                    ? 'border-health-green bg-health-green/5' 
                    : 'border-health-green/20 hover:border-health-green hover:bg-health-green/5'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-health-green to-health-yellow rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground mb-1 text-sm sm:text-base">Self-Employed/Freelance</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Own business, freelance work, or irregular income
                    </div>
                  </div>
                </div>
              </button>


            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowSectorModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedSector}
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Home;