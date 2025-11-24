import { View, Flex, Text } from '@adobe/react-spectrum';
import { PathStep as PathStepType, Actor, Movie } from '../services/api';

interface PathStepProps {
  step: PathStepType;
  isLast: boolean;
}

export default function PathStep({ step, isLast }: PathStepProps) {
  if (step.type === 'actor') {
    const actor = step.data as Actor;
    return (
      <Flex alignItems="center" gap="size-200">
        <Flex direction="column" alignItems="center" gap="size-100">
          {actor.profile_path ? (
            <View
              UNSAFE_style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--spectrum-global-color-blue-600)',
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                alt={actor.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </View>
          ) : (
            <View
              backgroundColor="gray-300"
              UNSAFE_style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--spectrum-global-color-blue-600)',
              }}
            >
              <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                No Image
              </Text>
            </View>
          )}
          <Text
            UNSAFE_style={{
              fontSize: '14px',
              fontWeight: 500,
              maxWidth: '120px',
              textAlign: 'center',
            }}
          >
            {actor.name}
          </Text>
        </Flex>
        {!isLast && (
          <Text UNSAFE_style={{ fontSize: '24px', color: 'var(--spectrum-global-color-gray-500)' }}>
            →
          </Text>
        )}
      </Flex>
    );
  } else {
    const movie = step.data as Movie;
    return (
      <Flex alignItems="center" gap="size-200">
        <Flex direction="column" alignItems="center" gap="size-100">
          {movie.poster_path ? (
            <View
              UNSAFE_style={{
                width: '64px',
                height: '96px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '2px solid var(--spectrum-global-color-purple-600)',
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                alt={movie.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </View>
          ) : (
            <View
              backgroundColor="gray-300"
              UNSAFE_style={{
                width: '64px',
                height: '96px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--spectrum-global-color-purple-600)',
              }}
            >
              <Text
                UNSAFE_style={{
                  fontSize: '12px',
                  color: 'var(--spectrum-global-color-gray-700)',
                  textAlign: 'center',
                  padding: '0 4px',
                }}
              >
                No Poster
              </Text>
            </View>
          )}
          <Text
            UNSAFE_style={{
              fontSize: '14px',
              fontWeight: 500,
              maxWidth: '120px',
              textAlign: 'center',
            }}
          >
            {movie.title}
          </Text>
          {movie.release_date && (
            <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-600)' }}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          )}
        </Flex>
        {!isLast && (
          <Text UNSAFE_style={{ fontSize: '24px', color: 'var(--spectrum-global-color-gray-500)' }}>
            →
          </Text>
        )}
      </Flex>
    );
  }
}

