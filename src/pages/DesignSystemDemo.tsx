import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, Clock, Users, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const DesignSystemDemo = () => {
  return (
    <div className="min-h-screen bg-neutral-bg">
      {/* Navigation Header */}
      <header className="bg-nav-bg border-b border-neutral-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-light-blue rounded-base flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Design System Demo</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" className="text-nav-inactive hover:text-white hover:bg-nav-active">
                Home
              </Button>
              <Button className="bg-light-blue hover:brightness-95">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Inter font family with semantic sizing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-primary">Heading 1 - Primary Blue</h1>
              <h2 className="text-primary">Heading 2 - Primary Blue</h2>
              <h3 className="text-primary">Heading 3 - Primary Blue</h3>
              <p className="text-base text-primary">Body text (16px) - Primary Blue</p>
              <p className="text-small text-neutral-secondary">Small text (14px) - Secondary Gray</p>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Primary colors and neutrals from the design guide</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-primary rounded-base"></div>
                <p className="text-small text-neutral-secondary">Primary Blue<br/>#103153</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-light-blue rounded-base"></div>
                <p className="text-small text-neutral-secondary">Light Blue<br/>#1F9BF6</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-accent-red rounded-base"></div>
                <p className="text-small text-neutral-secondary">Accent Red<br/>#E42D35</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-neutral-light rounded-base border border-neutral-border"></div>
                <p className="text-small text-neutral-secondary">Light Surface<br/>#F3F5F6</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>8px radius with hover effects (darken 5%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Danger Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>White background, focus states, and error handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="normal">Normal Input</Label>
              <Input id="normal" placeholder="Enter text here..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focused">Focused Input (Light Blue)</Label>
              <Input id="focused" placeholder="Focus to see blue border" className="ring-2 ring-light-blue border-light-blue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="error">Error Input (Red)</Label>
              <Input id="error" placeholder="Error state" error />
              <p className="text-small text-accent-red">This field is required</p>
            </div>
          </CardContent>
        </Card>

        {/* Cards & Shadows */}
        <Card>
          <CardHeader>
            <CardTitle>Cards & Elevation</CardTitle>
            <CardDescription>12px radius with three shadow levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-level-1">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary mb-2">Level 1 Shadow</h4>
                  <p className="text-small text-neutral-secondary">Subtle elevation for basic cards</p>
                </CardContent>
              </Card>
              <Card className="shadow-level-2">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary mb-2">Level 2 Shadow</h4>
                  <p className="text-small text-neutral-secondary">Medium elevation for interactive elements</p>
                </CardContent>
              </Card>
              <Card className="shadow-level-3">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary mb-2">Level 3 Shadow</h4>
                  <p className="text-small text-neutral-secondary">High elevation for modals and overlays</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Icons & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Icons & Status Indicators</CardTitle>
            <CardDescription>Rounded, modern icons with semantic colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-card flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Secure</h4>
                  <p className="text-small text-neutral-secondary">Bank-level security</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-light-blue rounded-card flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Fast</h4>
                  <p className="text-small text-neutral-secondary">Quick processing</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-red rounded-card flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Inclusive</h4>
                  <p className="text-small text-neutral-secondary">For everyone</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
            <CardDescription>Semantic status indicators with proper contrast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <Badge className="bg-primary/10 text-primary border border-primary/20">Success</Badge>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-light-blue" />
                <Badge className="bg-light-blue/10 text-light-blue border border-light-blue/20">Warning</Badge>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-accent-red" />
                <Badge className="bg-accent-red/10 text-accent-red border border-accent-red/20">Error</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacing System */}
        <Card>
          <CardHeader>
            <CardTitle>Spacing System</CardTitle>
            <CardDescription>8px base unit with consistent spacing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-primary rounded-sm"></div>
                <span className="text-small text-neutral-secondary">8px (1 unit)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-4 bg-primary rounded-sm"></div>
                <span className="text-small text-neutral-secondary">16px (2 units)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-4 bg-primary rounded-sm"></div>
                <span className="text-small text-neutral-secondary">24px (3 units)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-4 bg-primary rounded-sm"></div>
                <span className="text-small text-neutral-secondary">32px (4 units)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesignSystemDemo;