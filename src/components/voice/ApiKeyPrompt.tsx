
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoice } from '@/contexts/VoiceContext';

export default function ApiKeyPrompt() {
  const [apiKey, setApiKey] = useState('');
  const { setApiKey: saveApiKey } = useVoice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      saveApiKey(apiKey.trim());
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ElevenLabs API Key Required</CardTitle>
        <CardDescription>
          Please enter your ElevenLabs API key to enable speech-to-text functionality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your ElevenLabs API key"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Save API Key
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">
          You can find your API key in your ElevenLabs dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
