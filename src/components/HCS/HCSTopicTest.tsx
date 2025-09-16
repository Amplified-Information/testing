import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Loader2, TestTube } from 'lucide-react';
import { useAsyncHCS } from '@/hooks/useAsyncHCS';
import { HCSJobMonitor } from '@/components/HCS/HCSJobMonitor';
import { TimeoutTestPanel } from '@/components/HCS/TimeoutTestPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HCSTopicTest() {
  const { createTopic, isLoading: isAsyncLoading } = useAsyncHCS();

  const handleAsyncTopicCreation = async (topicType: 'orders' | 'batches' | 'oracle' | 'disputes') => {
    try {
      await createTopic({
        topicType,
        onProgress: (job) => {
          console.log('Job progress:', job);
        },
        timeout: 60000,
      });
    } catch (error) {
      console.error('Async topic creation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Testing</TabsTrigger>
          <TabsTrigger value="timeout">Timeout Testing</TabsTrigger>
          <TabsTrigger value="monitor">Job Monitor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Async HCS Topic Creation
              </CardTitle>
              <CardDescription>
                Create HCS topics asynchronously using the enhanced timeout system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['orders', 'batches', 'oracle', 'disputes'] as const).map((topicType) => (
                  <Button 
                    key={topicType}
                    onClick={() => handleAsyncTopicCreation(topicType)}
                    disabled={isAsyncLoading}
                    variant={topicType === 'orders' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    {isAsyncLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {topicType.charAt(0).toUpperCase() + topicType.slice(1)} Topic
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeout" className="space-y-6">
          <TimeoutTestPanel />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <HCSJobMonitor showHistory={true} compact={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}