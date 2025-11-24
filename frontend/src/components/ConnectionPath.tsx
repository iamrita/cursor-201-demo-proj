import { View, Heading, Text, ProgressCircle, Flex, Well } from '@adobe/react-spectrum';
import { PathResult } from '../services/api';
import PathStep from './PathStep';

interface ConnectionPathProps {
  result: PathResult | null;
  isLoading: boolean;
  error: string | null;
  frontendDurationMs: number | null;
}

export default function ConnectionPath({
  result,
  isLoading,
  error,
  frontendDurationMs,
}: ConnectionPathProps) {
  if (isLoading) {
    return (
      <View 
        backgroundColor="gray-50" 
        padding="size-800" 
        borderRadius="regular"
        marginTop="size-600"
        UNSAFE_style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
      >
        <Flex direction="column" alignItems="center" justifyContent="center" gap="size-300">
          <ProgressCircle aria-label="Loading..." isIndeterminate />
          <Text>Finding the connection...</Text>
          <Text UNSAFE_style={{ fontSize: '12px' }}>This may take a moment</Text>
        </Flex>
      </View>
    );
  }

  if (error) {
    return (
      <Well marginTop="size-600" UNSAFE_style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: '1px', borderStyle: 'solid' }}>
        <Flex direction="row" gap="size-200" alignItems="start">
          <Text>⚠️</Text>
          <Flex direction="column" gap="size-100">
            <Heading level={3}>Error</Heading>
            <Text>{error}</Text>
          </Flex>
        </Flex>
      </Well>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <View 
      backgroundColor="gray-50" 
      padding="size-800" 
      borderRadius="regular"
      marginTop="size-600"
      UNSAFE_style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
    >
      <Flex direction="column" gap="size-500" alignItems="center">
        <Flex direction="column" gap="size-200" alignItems="center">
          <Heading level={2}>Connection Found!</Heading>
          <Text>
            Degrees of Separation: <span style={{ fontWeight: 'bold', color: '#0066cc' }}>{result.degrees}</span>
          </Text>
          {frontendDurationMs !== null && (
            <Text UNSAFE_style={{ fontSize: '14px' }}>
              Total time: <span style={{ fontWeight: '500' }}>{(frontendDurationMs / 1000).toFixed(2)}s</span>
            </Text>
          )}
        </Flex>

        <View 
          backgroundColor="gray-100" 
          padding="size-400" 
          borderRadius="regular"
          width="100%"
          UNSAFE_style={{ overflowX: 'auto' }}
        >
          <Flex 
            direction="row" 
            wrap 
            alignItems="center" 
            justifyContent="center" 
            gap="size-300"
          >
            {result.path.map((step, index) => (
              <PathStep
                key={`${step.type}-${step.data.id}-${index}`}
                step={step}
                isLast={index === result.path.length - 1}
              />
            ))}
          </Flex>
        </View>

        <View marginTop="size-400">
          <Text UNSAFE_style={{ fontSize: '14px' }}>
            Path: {result.path
              .map((step) =>
                step.type === 'actor'
                  ? (step.data as import('../services/api').Actor).name
                  : (step.data as import('../services/api').Movie).title
              )
              .join(' → ')}
          </Text>
        </View>
      </Flex>
    </View>
  );
}

