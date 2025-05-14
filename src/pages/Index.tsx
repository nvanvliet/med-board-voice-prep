
import { ElevenLabsProvider } from '@11labs/react';
import HomePage from './HomePage';

const Index = () => {
  return (
    <ElevenLabsProvider apiKey={process.env.ELEVEN_LABS_API_KEY || ''}>
      <HomePage />
    </ElevenLabsProvider>
  );
};

export default Index;
