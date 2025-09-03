import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Layout/Header";
import ProposalForm from "@/components/Governance/ProposalForm";
import GovernanceDashboard from "@/components/Governance/GovernanceDashboard";

const CreateMarket = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto py-8">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Proposal</TabsTrigger>
            <TabsTrigger value="governance">Governance Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create">
            <ProposalForm />
          </TabsContent>
          
          <TabsContent value="governance">
            <GovernanceDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CreateMarket;