import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { 
  Database, 
  Settings, 
  Shield, 
  Cloud,
  ArrowLeft,
  Code,
  ExternalLink,
  CheckCircle,
  Clock,
  Users,
  Lock,
  Zap,
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react";

const SystemConfigManagement = () => {
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
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">System Configuration Management</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Centralized environment variable management with Supabase integration
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Architecture Design
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Database className="h-3 w-3 mr-1" />
                Database Schema
              </Badge>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <RefreshCw className="h-3 w-3 mr-1" />
                Migration Plan
              </Badge>
            </div>
          </div>

          {/* Migration Overview */}
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Migration Strategy:</strong> This implementation will gradually migrate from environment variables 
              to a centralized database-driven configuration system, maintaining backward compatibility during the transition.
            </AlertDescription>
          </Alert>

          {/* Current State Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="text-center border-blue-500">
              <CardContent className="pt-6">
                <Settings className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                <h3 className="text-2xl font-bold text-blue-600">15+</h3>
                <p className="text-sm text-muted-foreground">Environment Variables</p>
              </CardContent>
            </Card>
            <Card className="text-center border-green-500">
              <CardContent className="pt-6">
                <Cloud className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <h3 className="text-2xl font-bold text-green-600">3</h3>
                <p className="text-sm text-muted-foreground">Config Types</p>
              </CardContent>
            </Card>
            <Card className="text-center border-orange-500">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 mx-auto mb-2 text-orange-600" />
                <h3 className="text-2xl font-bold text-orange-600">5</h3>
                <p className="text-sm text-muted-foreground">Secrets</p>
              </CardContent>
            </Card>
            <Card className="text-center border-purple-500">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                <h3 className="text-2xl font-bold text-purple-600">8</h3>
                <p className="text-sm text-muted-foreground">Implementation Phases</p>
              </CardContent>
            </Card>
          </div>

          {/* Database Schema Design */}
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Database className="h-5 w-5" />
                📋 Database Schema Design
              </CardTitle>
              <CardDescription>
                Comprehensive system_config table structure with security and environment separation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-3">system_config Table Structure</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><code className="bg-background px-2 py-1 rounded">id</code> - UUID primary key</div>
                    <div><code className="bg-background px-2 py-1 rounded">config_key</code> - Unique text identifier</div>
                    <div><code className="bg-background px-2 py-1 rounded">config_value</code> - Text value</div>
                    <div><code className="bg-background px-2 py-1 rounded">config_type</code> - Enum: frontend/backend/secret</div>
                  </div>
                  <div className="space-y-2">
                    <div><code className="bg-background px-2 py-1 rounded">environment</code> - Enum: dev/staging/prod</div>
                    <div><code className="bg-background px-2 py-1 rounded">is_sensitive</code> - Boolean encryption flag</div>
                    <div><code className="bg-background px-2 py-1 rounded">description</code> - Config documentation</div>
                    <div><code className="bg-background px-2 py-1 rounded">created_at/updated_at</code> - Timestamps</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Row Level Security Policies</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h5 className="font-medium text-green-800 dark:text-green-200">Frontend Configs</h5>
                    <p className="text-xs text-green-700 dark:text-green-300">Public read access for client-side configs</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <h5 className="font-medium text-orange-800 dark:text-orange-200">Backend Configs</h5>
                    <p className="text-xs text-orange-700 dark:text-orange-300">Service role access only</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <h5 className="font-medium text-red-800 dark:text-red-200">Secret Configs</h5>
                    <p className="text-xs text-red-700 dark:text-red-300">Encrypted, admin access only</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Components */}
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Code className="h-5 w-5" />
                🏗️ Architecture Components
              </CardTitle>
              <CardDescription>
                ConfigService layer and React hooks for centralized configuration access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Frontend Integration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>ConfigService</code> class for centralized access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>useSystemConfig()</code> React hook
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>useConfigValue(key)</code> individual access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Real-time updates via Supabase subscriptions
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Backend Integration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>getConfig(key)</code> Edge Function utility
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Cached config retrieval
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Environment-aware resolution
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      CLOB relayer integration
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Migration Strategy */}
          <Card className="border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <RefreshCw className="h-5 w-5" />
                🔄 8-Phase Migration Strategy
              </CardTitle>
              <CardDescription>
                Gradual implementation with backward compatibility and risk mitigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Phase 1-4 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Phase 1</Badge>
                      <span className="font-medium">Database Schema Design</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Create system_config table with RLS policies and validation triggers</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Phase 2</Badge>
                      <span className="font-medium">Migration & Data Population</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Migrate existing environment variables with environment-specific configs</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Phase 3</Badge>
                      <span className="font-medium">Configuration Service Layer</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Create ConfigService with caching and fallback mechanisms</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Phase 4</Badge>
                      <span className="font-medium">Frontend Integration</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Create React hooks and update existing components</p>
                  </div>
                  
                  {/* Phase 5-8 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Phase 5</Badge>
                      <span className="font-medium">Backend Integration</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Update Edge Functions with config utilities and caching</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Phase 6</Badge>
                      <span className="font-medium">Admin Interface</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Build config management UI with CRUD operations</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Phase 7</Badge>
                      <span className="font-medium">Security & Validation</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Implement encryption, validation rules, and audit trails</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Phase 8</Badge>
                      <span className="font-medium">Migration Completion</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Remove environment variable fallbacks and deploy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Implementation */}
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                🔒 Security Implementation
              </CardTitle>
              <CardDescription>
                Encryption, access control, and audit trail implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <Lock className="h-5 w-5 text-red-600 mb-2" />
                  <h5 className="font-medium text-red-800 dark:text-red-200">Encryption</h5>
                  <p className="text-xs text-red-700 dark:text-red-300">Sensitive configurations encrypted at rest</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600 mb-2" />
                  <h5 className="font-medium text-orange-800 dark:text-orange-200">Access Control</h5>
                  <p className="text-xs text-orange-700 dark:text-orange-300">Role-based RLS policies by config type</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-blue-600 mb-2" />
                  <h5 className="font-medium text-blue-800 dark:text-blue-200">Audit Trail</h5>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Complete change history and rollback</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Points */}
          <Card className="border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Zap className="h-5 w-5" />
                🔌 Integration Points
              </CardTitle>
              <CardDescription>
                Components and services that will be updated during migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Frontend Components</h4>
                  <div className="space-y-1 text-sm">
                    <div>• <code>WalletContext</code> - Hedera network configuration</div>
                    <div>• <code>hcs.ts</code> - HCS topic and mirror node URLs</div>
                    <div>• <code>hedera.ts</code> - Network and RPC endpoints</div>
                    <div>• <code>apiClient.ts</code> - Mirror node API configuration</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Backend Services</h4>
                  <div className="space-y-1 text-sm">
                    <div>• <code>clob-relayer</code> - Edge function configuration</div>
                    <div>• <code>supabase/config.toml</code> - Function settings</div>
                    <div>• Future edge functions - Automated config access</div>
                    <div>• HCS operators - Network and topic configuration</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits & Considerations */}
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                ✅ Benefits & Technical Considerations
              </CardTitle>
              <CardDescription>
                Advantages of centralized configuration management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">Key Benefits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Centralized configuration management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Environment-specific configs without code changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time configuration updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Audit trail for configuration changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Reduced deployment complexity</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600">Technical Considerations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Caching strategy for performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Fallback mechanisms during migration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Type-safe configuration access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Database availability considerations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Configuration validation and testing</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Interface Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Admin Interface Features (Phase 6)
              </CardTitle>
              <CardDescription>
                Planned configuration management UI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">Configuration CRUD</h5>
                  <p className="text-sm text-muted-foreground">Create, read, update, and delete system configurations with validation</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">Environment Management</h5>
                  <p className="text-sm text-muted-foreground">Switch between dev/staging/production configurations seamlessly</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">Change History</h5>
                  <p className="text-sm text-muted-foreground">Complete audit trail with rollback capabilities and change notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default SystemConfigManagement;