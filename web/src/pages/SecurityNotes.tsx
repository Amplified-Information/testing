import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  CheckCircle, 
  AlertTriangle, 
  Info,
  ArrowLeft,
  Lock,
  Database,
  User,
  Code,
  ExternalLink
} from "lucide-react";

const SecurityNotes = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link 
              to="/dev-notes" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dev Notes
            </Link>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Security Analysis</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Comprehensive security review and vulnerability assessment
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Major Issues Resolved
              </Badge>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Auth Integration Required
              </Badge>
            </div>
          </div>

          {/* Smart Contract Notice */}
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Smart contracts have not yet been developed. This security review focuses on the frontend application, 
              backend API, and database security. Smart contract security auditing will be required once blockchain components are implemented.
            </AlertDescription>
          </Alert>

          {/* Security Status Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="text-center border-green-500">
              <CardContent className="pt-6">
                <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <h3 className="text-2xl font-bold text-green-600">3</h3>
                <p className="text-sm text-muted-foreground">Issues Resolved</p>
              </CardContent>
            </Card>
            <Card className="text-center border-red-500">
              <CardContent className="pt-6">
                <ShieldX className="h-12 w-12 mx-auto mb-2 text-red-600" />
                <h3 className="text-2xl font-bold text-red-600">2</h3>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </CardContent>
            </Card>
            <Card className="text-center border-orange-500">
              <CardContent className="pt-6">
                <ShieldAlert className="h-12 w-12 mx-auto mb-2 text-orange-600" />
                <h3 className="text-2xl font-bold text-orange-600">2</h3>
                <p className="text-sm text-muted-foreground">Moderate Issues</p>
              </CardContent>
            </Card>
            <Card className="text-center border-blue-500">
              <CardContent className="pt-6">
                <Info className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                <h3 className="text-2xl font-bold text-blue-600">4</h3>
                <p className="text-sm text-muted-foreground">Config Warnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Resolved Issues */}
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-5 w-5" />
                ✅ Resolved Security Issues
              </CardTitle>
              <CardDescription>
                Critical security vulnerabilities that have been successfully addressed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <Database className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Secrets Table Security</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Restricted access to service roles only. Previously exposed sensitive system configuration data.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <User className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">User Personal Data Protection</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Profiles table properly secured with RLS policies. Removed public read access to sensitive PII.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Financial Data Exposure</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Token balances and voting power snapshots now secure with user-specific access controls.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <ShieldX className="h-5 w-5" />
                🚨 Critical Security Issues
              </CardTitle>
              <CardDescription>
                High-risk vulnerabilities requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                <ShieldX className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-2">
                    <h4 className="font-semibold">1. Missing Authentication Integration</h4>
                    <p className="text-sm">
                      <strong>Risk:</strong> HIGH - Authentication components exist but lack proper integration between Supabase auth and main application flow.
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• SignUpDialog exists but isn't integrated into user flow</li>
                      <li>• Wallet connection operates independently from Supabase auth</li>
                      <li>• No session management or protected routes</li>
                      <li>• Users can access all features without authentication</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                <ShieldX className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-2">
                    <h4 className="font-semibold">2. Wallet-Supabase Auth Disconnect</h4>
                    <p className="text-sm">
                      <strong>Risk:</strong> HIGH - Hedera wallet system operates separately from Supabase auth, creating authorization bypass potential.
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Governance system uses wallet.accountId without Supabase verification</li>
                      <li>• Profile settings expect Supabase user but wallet context is separate</li>
                      <li>• Potential for account ID spoofing or session hijacking</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

            </CardContent>
          </Card>

          {/* Moderate Issues */}
          <Card className="border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <ShieldAlert className="h-5 w-5" />
                ⚠️ Moderate Security Issues
              </CardTitle>
              <CardDescription>
                Medium-risk vulnerabilities that should be addressed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                <Code className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">Input Validation Gaps</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                    <strong>Risk:</strong> MEDIUM - Some user input forms lack comprehensive validation.
                  </p>
                  <ul className="text-xs space-y-1 text-orange-600 dark:text-orange-400">
                    <li>• API endpoint URLs in ProposalForm accept any string without URL validation</li>
                    <li>• Oracle configuration fields accept unvalidated JSON</li>
                    <li>• Date inputs don't validate future dates appropriately</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                <ExternalLink className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">External API Security</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                    <strong>Risk:</strong> MEDIUM - Hedera Mirror Node calls lack proper validation.
                  </p>
                  <ul className="text-xs space-y-1 text-orange-600 dark:text-orange-400">
                    <li>• Mirror Node responses aren't validated for unexpected data structures</li>
                    <li>• No rate limiting on API calls</li>
                    <li>• Potential for malicious responses to cause application errors</li>
                  </ul>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Configuration Warnings */}
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Info className="h-5 w-5" />
                ℹ️ Configuration Warnings
              </CardTitle>
              <CardDescription>
                Low-priority configuration issues that can be addressed when convenient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">Database Config</Badge>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Extensions in public schema</li>
                    <li>• Extension versions slightly outdated</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">Auth Config</Badge>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Auth OTP expiry exceeds threshold</li>
                    <li>• Leaked password protection disabled</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Best Practices */}
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-5 w-5" />
                ✅ Security Best Practices Implemented
              </CardTitle>
              <CardDescription>
                Positive security aspects already in place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Proper RLS Policies</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Database access is correctly restricted with Row Level Security
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">No Hardcoded Credentials</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Environment variables used appropriately in frontend
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Form Validation</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Zod schemas provide good input validation
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Supabase Configuration</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Client properly configured with security settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Security Fix Implementation Plan
              </CardTitle>
              <CardDescription>
                Prioritized roadmap for addressing security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Priority 1</Badge>
                  <h4 className="font-semibold">Critical Authentication Integration</h4>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Implement Unified Authentication System</p>
                      <p className="text-xs text-muted-foreground">Combine Supabase auth with wallet connection, add protected routes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Secure Wallet-Auth Bridge</p>
                      <p className="text-xs text-muted-foreground">Link Hedera accounts to Supabase users with proper validation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Add Route Protection</p>
                      <p className="text-xs text-muted-foreground">Create authentication guards and session management</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">Priority 2</Badge>
                  <h4 className="font-semibold">Input Validation & API Security</h4>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Enhance Input Validation</p>
                      <p className="text-xs text-muted-foreground">Add URL/JSON validation, sanitize inputs, validate date ranges</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Secure External API Calls</p>
                      <p className="text-xs text-muted-foreground">Add response validation, rate limiting, error boundaries</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">Priority 3</Badge>
                  <h4 className="font-semibold">Configuration Hardening</h4>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Database Configuration Security</p>
                      <p className="text-xs text-muted-foreground">Update extensions, adjust auth settings, security headers</p>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Next Steps */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Focus on implementing unified authentication system first, as this addresses the most critical security gaps. 
              Smart contract security audit will be required once blockchain components are developed.
            </AlertDescription>
          </Alert>

        </div>
      </main>
    </div>
  );
};

export default SecurityNotes;