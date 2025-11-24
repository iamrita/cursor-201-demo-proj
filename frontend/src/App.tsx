import { useState } from 'react';
import { 
  View, 
  Heading, 
  Text, 
  Button, 
  Grid, 
  Flex 
} from '@adobe/react-spectrum';
import ActorSearch from './components/ActorSearch';
import ConnectionPath from './components/ConnectionPath';
import { Actor, PathResult, findPath } from './services/api';

function App() {
  const [actor1, setActor1] = useState<Actor | null>(null);
  const [actor2, setActor2] = useState<Actor | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frontendDurationMs, setFrontendDurationMs] = useState<number | null>(null);

  const handleFindPath = async () => {
    if (!actor1 || !actor2) {
      setError('Please select both actors');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setFrontendDurationMs(null);

    const startTime = Date.now();
    try {
      const pathResult = await findPath(actor1.id, actor2.id);
      const endTime = Date.now();
      const frontendDurationMs = endTime - startTime;
      
      setResult(pathResult);
      setFrontendDurationMs(frontendDurationMs);
    } catch (err: any) {
      const endTime = Date.now();
      const frontendDurationMs = endTime - startTime;
      setFrontendDurationMs(frontendDurationMs);
      
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to find connection. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View 
      backgroundColor="gray-100" 
      minHeight="100vh" 
      padding="size-400"
    >
      <View 
        maxWidth="size-6000" 
        marginX="auto"
      >
        <Flex direction="column" gap="size-300" alignItems="center" marginBottom="size-400">
          <Heading level={1} marginTop="size-300">
            Between Two Stars
          </Heading>
          <Text>
            Find the connection between any two actors through their movies.
          </Text>
        </Flex>

        <View 
          backgroundColor="gray-50" 
          borderRadius="medium" 
          padding="size-400"
          marginBottom="size-300"
        >
          <Flex direction="column" gap="size-300">
            <Grid 
              columns={['1fr', '1fr']} 
              gap="size-300"
              autoRows="auto"
            >
              <ActorSearch
                label="Actor 1"
                onSelect={setActor1}
                selectedActor={actor1}
              />

              <ActorSearch
                label="Actor 2"
                onSelect={setActor2}
                selectedActor={actor2}
              />
            </Grid>

            <Button
              variant="accent"
              onPress={handleFindPath}
              isDisabled={!actor1 || !actor2 || isLoading}
              width="100%"
            >
              {isLoading ? 'Finding Connection...' : 'Find Connection'}
            </Button>
          </Flex>
        </View>

        <ConnectionPath 
          result={result} 
          isLoading={isLoading} 
          error={error}
          frontendDurationMs={frontendDurationMs}
        />
      </View>
    </View>
  );
}

export default App;

