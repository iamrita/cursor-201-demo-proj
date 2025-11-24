import { 
  View, 
  Flex, 
  Heading, 
  Text, 
  ProgressCircle
} from '@adobe/react-spectrum';
import Alert from '@spectrum-icons/workflow/Alert';
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
        borderRadius="medium" 
        padding="size-600"
      >
        <Flex 
          direction="column" 
          alignItems="center" 
          justifyContent="center" 
          gap="size-200"
        >
          <ProgressCircle 
            aria-label="Finding connection" 
            isIndeterminate 
            size="L"
          />
          <Text>Finding the connection...</Text>
          <Text UNSAFE_style={{ fontSize: '14px', color: 'var(--spectrum-global-color-gray-600)' }}>
            This may take a moment
          </Text>
        </Flex>
      </View>
    );
  }

  if (error) {
    return (
      <View 
        backgroundColor="negative" 
        borderRadius="medium" 
        padding="size-300"
        borderWidth="thin"
        borderColor="negative"
      >
        <Flex gap="size-100" alignItems="start">
          <Alert color="negative" size="M" />
          <Flex direction="column" gap="size-50">
            <Heading level={4}>Error</Heading>
            <Text UNSAFE_style={{ fontSize: '14px' }}>{error}</Text>
          </Flex>
        </Flex>
      </View>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <View 
      backgroundColor="gray-50" 
      borderRadius="medium" 
      padding="size-400"
    >
      <Flex direction="column" gap="size-300" alignItems="center">
        <Heading level={2}>Connection Found!</Heading>
        <Text>
          Degrees of Separation: <strong style={{ color: 'var(--spectrum-global-color-blue-600)' }}>{result.degrees}</strong>
        </Text>
        {frontendDurationMs !== null && (
          <Text UNSAFE_style={{ fontSize: '14px', color: 'var(--spectrum-global-color-gray-600)' }}>
            Total time: <strong>{(frontendDurationMs / 1000).toFixed(2)}s</strong>
          </Text>
        )}
      </Flex>

      <View 
        backgroundColor="gray-100" 
        borderRadius="medium" 
        padding="size-300" 
        marginTop="size-300"
        UNSAFE_style={{ overflowX: 'auto' }}
      >
        <Flex 
          wrap="wrap" 
          alignItems="center" 
          justifyContent="center" 
          gap="size-200"
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

      <Flex justifyContent="center" marginTop="size-300">
        <Text UNSAFE_style={{ fontSize: '14px', color: 'var(--spectrum-global-color-gray-600)', textAlign: 'center' }}>
          Path: {result.path
            .map((step) =>
              step.type === 'actor'
                ? (step.data as any).name
                : (step.data as any).title
            )
            .join(' → ')}
        </Text>
      </Flex>
    </View>
  );
}

