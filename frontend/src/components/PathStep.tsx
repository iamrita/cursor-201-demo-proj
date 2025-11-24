import { View, Text, Image, Flex } from '@adobe/react-spectrum';
import { PathStep as PathStepType, Actor, Movie } from '../services/api';

interface PathStepProps {
  step: PathStepType;
  isLast: boolean;
}

export default function PathStep({ step, isLast }: PathStepProps) {
  if (step.type === 'actor') {
    const actor = step.data as Actor;
    return (
      <Flex direction="row" alignItems="center" gap="size-300">
        <Flex direction="column" alignItems="center" gap="size-100">
          {actor.profile_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
              alt={actor.name}
              width="64px"
              height="64px"
              objectFit="cover"
              UNSAFE_style={{ 
                borderRadius: '50%',
                border: '2px solid #0066cc'
              }}
            />
          ) : (
            <View
              width="64px"
              height="64px"
              backgroundColor="gray-300"
              UNSAFE_style={{ 
                borderRadius: '50%',
                border: '2px solid #0066cc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text UNSAFE_style={{ fontSize: '10px' }}>No Image</Text>
            </View>
          )}
          <Text UNSAFE_style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            maxWidth: '120px',
            textAlign: 'center'
          }}>
            {actor.name}
          </Text>
        </Flex>
        {!isLast && (
          <Text UNSAFE_style={{ fontSize: '24px', color: '#999' }}>→</Text>
        )}
      </Flex>
    );
  } else {
    const movie = step.data as Movie;
    return (
      <Flex direction="row" alignItems="center" gap="size-300">
        <Flex direction="column" alignItems="center" gap="size-100">
          {movie.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
              width="64px"
              height="96px"
              objectFit="cover"
              UNSAFE_style={{ 
                borderRadius: '4px',
                border: '2px solid #8B5CF6'
              }}
            />
          ) : (
            <View
              width="64px"
              height="96px"
              backgroundColor="gray-300"
              UNSAFE_style={{ 
                borderRadius: '4px',
                border: '2px solid #8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <Text UNSAFE_style={{ fontSize: '10px', textAlign: 'center' }}>
                No Poster
              </Text>
            </View>
          )}
          <Text UNSAFE_style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            maxWidth: '120px',
            textAlign: 'center'
          }}>
            {movie.title}
          </Text>
          {movie.release_date && (
            <Text UNSAFE_style={{ fontSize: '12px', color: '#666' }}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          )}
        </Flex>
        {!isLast && (
          <Text UNSAFE_style={{ fontSize: '24px', color: '#999' }}>→</Text>
        )}
      </Flex>
    );
  }
}

