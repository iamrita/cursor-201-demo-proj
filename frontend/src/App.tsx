import { useState } from 'react';
import { View, Heading, Text, Button, Flex, Content } from '@adobe/react-spectrum';
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
    <View backgroundColor="gray-75" minHeight="100vh">
      <Content>
          <View marginTop="size-800" marginBottom="size-600">
            <Flex direction="column" alignItems="center" gap="size-200">
              <Heading level={1}>Between Two Stars</Heading>
              <Text>Find the connection between any two actors through their movies.</Text>
            </Flex>
          </View>

          <View 
            backgroundColor="gray-50" 
            padding="size-600" 
            borderRadius="regular"
            marginBottom="size-400"
            UNSAFE_style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          >
            <Flex direction="column" gap="size-400">
              <Flex direction={{ base: 'column', M: 'row' }} gap="size-400">
                <View flex="1">
                  <ActorSearch
                    label="Actor 1"
                    onSelect={setActor1}
                    selectedActor={actor1}
                  />
                </View>

                <View flex="1">
                  <ActorSearch
                    label="Actor 2"
                    onSelect={setActor2}
                    selectedActor={actor2}
                  />
                </View>
              </Flex>

              <Button
                variant="cta"
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
      </Content>
    </View>
  );
}

export default App;

