import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Clock, 
  MousePointer, 
  Wifi, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Timer,
  Activity
} from "lucide-react";

const WalletSecurityImplementation = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Shield className="h-10 w-10 text-primary" />
              Wallet Security Implementation
            </h1>
            <p className="text-muted-foreground text-lg">
              20-minute inactivity timeout system for enhanced wallet security
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="default">Implemented</Badge>
              <Badge variant="outline">Security Feature</Badge>
              <Badge variant="outline">Auto-Disconnect</Badge>
            </div>
          </div>

          {/* Implementation Overview */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Enhancement Complete:</strong> Wallet connections now automatically 
              timeout after 20 minutes of user inactivity, with a 2-minute warning dialog allowing 
              users to extend their session.
            </AlertDescription>
          </Alert>

          {/* System Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Architecture
              </CardTitle>
              <CardDescription>
                Multi-component timeout system with activity monitoring and user warnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Monitor
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Tracks mouse movements, clicks, and keyboard events</li>
                    <li>• Mobile touch support included</li>
                    <li>• Page visibility and focus detection</li>
                    <li>• Debounced activity tracking (30-second intervals)</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Timer Management
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 20-minute session timeout</li>
                    <li>• 2-minute warning threshold</li>
                    <li>• Automatic timer resets on activity</li>
                    <li>• Session time remaining display</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  useActivityMonitor Hook
                </CardTitle>
                <CardDescription>
                  Core activity detection and timer management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2">Key Features:</h5>
                  <ul className="text-xs space-y-1">
                    <li>• Configurable timeout duration</li>
                    <li>• Warning threshold customization</li>
                    <li>• Activity debouncing for performance</li>
                    <li>• Automatic cleanup on unmount</li>
                    <li>• Cross-browser event compatibility</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <strong>Location:</strong> <code>src/hooks/useActivityMonitor.ts</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  InactivityWarningDialog
                </CardTitle>
                <CardDescription>
                  User-friendly warning interface with countdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2">Features:</h5>
                  <ul className="text-xs space-y-1">
                    <li>• Real-time countdown display</li>
                    <li>• Progress bar visualization</li>
                    <li>• "Extend Session" button</li>
                    <li>• "Disconnect Now" option</li>
                    <li>• Automatic timeout handling</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <strong>Location:</strong> <code>src/components/Wallet/InactivityWarningDialog.tsx</code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Timeout settings and security parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">20 min</div>
                  <div className="text-sm text-muted-foreground">Session Timeout</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-warning">2 min</div>
                  <div className="text-sm text-muted-foreground">Warning Threshold</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">30 sec</div>
                  <div className="text-sm text-muted-foreground">Activity Debounce</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Experience Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                User Experience Flow
              </CardTitle>
              <CardDescription>
                Step-by-step security timeout process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Wallet Connected</h4>
                    <p className="text-sm text-muted-foreground">
                      20-minute timer starts, activity monitoring begins
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Activity Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Mouse, keyboard, and touch events reset the timer automatically
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center text-warning-foreground text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Warning Dialog (18 minutes)</h4>
                    <p className="text-sm text-muted-foreground">
                      2-minute warning with countdown and "Extend Session" option
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">Auto-Disconnect (20 minutes)</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatic wallet disconnection with notification
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Details */}
          <Card>
            <CardHeader>
              <CardTitle>WalletContext Integration</CardTitle>
              <CardDescription>
                Enhanced wallet context with timeout management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">New Context Properties:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <code className="text-sm">extendSession(): void</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manually extend the session by 20 minutes
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <code className="text-sm">sessionTimeRemaining: number | null</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current session time remaining in milliseconds
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Enhanced Features:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Session start time tracking</li>
                  <li>• Automatic session cleanup on disconnect</li>
                  <li>• Toast notifications for timeout events</li>
                  <li>• Warning dialog state management</li>
                  <li>• Activity monitor integration</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Security Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Benefits
              </CardTitle>
              <CardDescription>
                Enhanced protection against unauthorized access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">Protection Against:</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Unattended wallet access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Session hijacking attempts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Forgotten active connections
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Shared device vulnerabilities
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600">User Experience:</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Non-intrusive activity monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Clear warning notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Easy session extension
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Graceful timeout handling
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Implementation */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Implementation Notes</CardTitle>
              <CardDescription>
                Key implementation details and considerations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Performance Optimizations:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Event listeners use passive option for better performance</li>
                  <li>• Activity debouncing prevents excessive timer resets</li>
                  <li>• Timer cleanup prevents memory leaks</li>
                  <li>• useRef for stable event handlers</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Browser Compatibility:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Cross-browser event handling</li>
                  <li>• Mobile touch event support</li>
                  <li>• Page visibility API integration</li>
                  <li>• Focus/blur event handling</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Error Handling:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Graceful timeout handling</li>
                  <li>• Cleanup on component unmount</li>
                  <li>• Session state consistency</li>
                  <li>• Debug logging for troubleshooting</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default WalletSecurityImplementation;