import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/contexts/WalletContext";
import { CheckCircle, AlertCircle, Clock, FileText, Settings, Gavel } from "lucide-react";
import type { CreateProposalData, OracleType } from "@/types/governance";

const STEPS = [
  { id: 1, title: "Market Details", icon: FileText },
  { id: 2, title: "Resolution Parameters", icon: Settings },
  { id: 3, title: "Economic Parameters", icon: Gavel },
  { id: 4, title: "Review & Submit", icon: CheckCircle },
];

const ProposalForm = () => {
  const { wallet } = useWallet();
  const { 
    userBalance, 
    canCreateProposal, 
    getVotingPowerRequirement,
    createProposal, 
    isCreatingProposal 
  } = useGovernance();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateProposalData>({
    title: "",
    description: "",
    market_title: "",
    market_description: "",
    market_outcomes: { yes: "", no: "" },
    resolution_date: "",
    oracle_type: "api_endpoint" as OracleType,
    oracle_config: {},
    initial_liquidity: 100,
    collateral_type: "HBAR",
  });

  const updateFormData = (field: keyof CreateProposalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createProposal(formData);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.market_title && formData.market_description;
      case 2:
        return formData.resolution_date && formData.oracle_type;
      case 3:
        return formData.initial_liquidity > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!wallet.isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to create a market proposal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!canCreateProposal()) {
    const required = getVotingPowerRequirement();
    const current = userBalance?.total_voting_power || 0;
    
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need at least {required.toLocaleString()} PROTOCOL_TOKEN voting power to create proposals. 
              You currently have {current.toLocaleString()} voting power.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Create Market Proposal</CardTitle>
          <CardDescription>
            Submit a new event market for DAO voting and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isValid = isStepValid(step.id);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                    isActive ? 'border-primary text-primary' :
                    'border-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-2">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {step.id < STEPS.length && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={(currentStep / STEPS.length) * 100} className="mb-6" />
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Market Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="proposal-title">Proposal Title</Label>
                <Input
                  id="proposal-title"
                  placeholder="Brief title for the governance proposal..."
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-description">Proposal Description</Label>
                <Textarea
                  id="proposal-description"
                  placeholder="Detailed description of why this market should be created..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="market-title">Market Question</Label>
                <Input
                  id="market-title"
                  placeholder="e.g., Will Bitcoin reach $100K by Dec 31, 2025?"
                  value={formData.market_title}
                  onChange={(e) => updateFormData('market_title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="market-description">Market Description</Label>
                <Textarea
                  id="market-description"
                  placeholder="Detailed information about this prediction market..."
                  rows={4}
                  value={formData.market_description}
                  onChange={(e) => updateFormData('market_description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yes-outcome">YES Outcome</Label>
                  <Input
                    id="yes-outcome"
                    placeholder="Description of YES outcome..."
                    value={formData.market_outcomes.yes}
                    onChange={(e) => updateFormData('market_outcomes', { 
                      ...formData.market_outcomes, 
                      yes: e.target.value 
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="no-outcome">NO Outcome</Label>
                  <Input
                    id="no-outcome"
                    placeholder="Description of NO outcome..."
                    value={formData.market_outcomes.no}
                    onChange={(e) => updateFormData('market_outcomes', { 
                      ...formData.market_outcomes, 
                      no: e.target.value 
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resolution Parameters</h3>
              
              <div className="space-y-2">
                <Label htmlFor="resolution-date">Resolution Date</Label>
                <Input
                  id="resolution-date"
                  type="datetime-local"
                  value={formData.resolution_date}
                  onChange={(e) => updateFormData('resolution_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oracle-type">Oracle Type</Label>
                <Select 
                  value={formData.oracle_type} 
                  onValueChange={(value: OracleType) => updateFormData('oracle_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select oracle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chainlink">Chainlink Oracle</SelectItem>
                    <SelectItem value="supra">SUPRA Oracle</SelectItem>
                    <SelectItem value="api_endpoint">API Endpoint</SelectItem>
                    <SelectItem value="manual">Manual Resolution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.oracle_type === 'api_endpoint' && (
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="https://api.example.com/data"
                    value={formData.oracle_config.endpoint || ''}
                    onChange={(e) => updateFormData('oracle_config', { 
                      ...formData.oracle_config, 
                      endpoint: e.target.value 
                    })}
                  />
                </div>
              )}

              {formData.oracle_type === 'chainlink' && (
                <div className="space-y-2">
                  <Label htmlFor="chainlink-address">Chainlink Contract Address</Label>
                  <Input
                    id="chainlink-address"
                    placeholder="0x..."
                    value={formData.oracle_config.contractAddress || ''}
                    onChange={(e) => updateFormData('oracle_config', { 
                      ...formData.oracle_config, 
                      contractAddress: e.target.value 
                    })}
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Economic Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial-liquidity">Initial Liquidity</Label>
                  <Input
                    id="initial-liquidity"
                    type="number"
                    placeholder="100"
                    min="1"
                    value={formData.initial_liquidity}
                    onChange={(e) => updateFormData('initial_liquidity', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collateral-type">Collateral Type</Label>
                  <Select 
                    value={formData.collateral_type} 
                    onValueChange={(value) => updateFormData('collateral_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collateral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HBAR">HBAR</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The initial liquidity will be provided by the DAO treasury upon market deployment.
                  Market creators are not required to provide initial liquidity themselves.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Proposal Title</h4>
                  <p className="text-muted-foreground">{formData.title}</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Market Question</h4>
                  <p className="text-muted-foreground">{formData.market_title}</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Resolution Date</h4>
                  <p className="text-muted-foreground">
                    {new Date(formData.resolution_date).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Oracle Type</h4>
                  <Badge variant="outline">{formData.oracle_type}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Initial Liquidity</h4>
                    <p className="text-muted-foreground">{formData.initial_liquidity} {formData.collateral_type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Collateral</h4>
                    <Badge variant="outline">{formData.collateral_type}</Badge>
                  </div>
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  After submission, your proposal will be stored as a draft. You can then submit it for 
                  the proposal phase, which lasts 24 hours and requires 5M voting power quorum.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button 
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isCreatingProposal || !isStepValid(currentStep)}
              >
                {isCreatingProposal ? 'Creating...' : 'Create Proposal'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalForm;