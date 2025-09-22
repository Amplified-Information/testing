import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, TestTube } from 'lucide-react';
import { useSimpleHCSTesting } from '@/hooks/useSimpleHCSTesting';
import { SimpleTimeoutTest } from '@/components/HCS/SimpleTimeoutTest';
import { SimpleHCSTest } from '@/components/HCS/SimpleHCSTest';
import { MirrorNodePoller } from '@/components/HCS/MirrorNodePoller';

export default function SimpleHCSTopicTest() {
  const { createTopic, isLoading } = useSimpleHCSTesting();

  const handleSimpleTopicCreation = async (topicType: string) => {
    try {
      await createTopic(`${topicType} topic test`, topicType);
      console.log(`✅ ${topicType} topic creation initiated`);
    } catch (error) {
      console.error(`❌ ${topicType} topic creation failed:`, error);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Testing</TabsTrigger>
          <TabsTrigger value="timeout">Timeout Testing</TabsTrigger>
          <TabsTrigger value="monitor">Mirror Node</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Simple HCS Topic Creation
              </CardTitle>
              <CardDescription>
                Create different types of HCS topics using the simple approach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => handleSimpleTopicCreation('orders')}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Zap className="h-5 w-5" />
                  <span>Orders Topic</span>
                </Button>
                <Button
                  onClick={() => handleSimpleTopicCreation('batches')}
                  disabled={isLoading}
                  variant="secondary"
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Zap className="h-5 w-5" />
                  <span>Batches Topic</span>
                </Button>
                <Button
                  onClick={() => handleSimpleTopicCreation('oracle')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Zap className="h-5 w-5" />
                  <span>Oracle Topic</span>
                </Button>
                <Button
                  onClick={() => handleSimpleTopicCreation('disputes')}
                  disabled={isLoading}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Zap className="h-5 w-5" />
                  <span>Disputes Topic</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <SimpleHCSTest />
        </TabsContent>

        <TabsContent value="timeout" className="space-y-6">
          <SimpleTimeoutTest />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <MirrorNodePoller />
        </TabsContent>
      </Tabs>
    </div>
  );
}