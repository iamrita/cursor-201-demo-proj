import { useState, useEffect, useRef, useMemo } from 'react';
import { ComboBox, Item, Button } from '@adobe/react-spectrum';
import { Actor, searchActors } from '../services/api';

interface ActorSearchProps {
  label: string;
  onSelect: (actor: Actor | null) => void;
  selectedActor: Actor | null;
}

export default function ActorSearch({
  label,
  onSelect,
  selectedActor,
}: ActorSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Actor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync inputValue with selectedActor prop when it changes externally
  useEffect(() => {
    if (selectedActor) {
      setInputValue(selectedActor.name);
    }
  }, [selectedActor?.id]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If input is empty, clear suggestions
    if (!inputValue.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Debounce search
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchActors(inputValue);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching actors:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [inputValue]);

  const items = useMemo(() => {
    const suggestionItems = suggestions.map((actor) => ({
      id: actor.id.toString(),
      name: actor.name,
      actor: actor,
    }));
    
    // Include selectedActor in items if it's not already in suggestions
    if (selectedActor && !suggestions.find(a => a.id === selectedActor.id)) {
      return [{
        id: selectedActor.id.toString(),
        name: selectedActor.name,
        actor: selectedActor,
      }, ...suggestionItems];
    }
    
    return suggestionItems;
  }, [suggestions, selectedActor]);

  const handleSelectionChange = (key: React.Key | null) => {
    if (key === null) {
      onSelect(null);
      setInputValue('');
      return;
    }
    const selectedItem = items.find((item) => item.id === key.toString());
    if (selectedItem) {
      onSelect(selectedItem.actor);
      setInputValue(selectedItem.name);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    onSelect(null);
  };

  const selectedKey = selectedActor ? selectedActor.id.toString() : null;

  return (
    <div>
      <ComboBox
        label={label}
        inputValue={inputValue}
        onInputChange={setInputValue}
        selectedKey={selectedKey}
        onSelectionChange={handleSelectionChange}
        items={items}
        loadingState={isLoading ? 'loading' : 'idle'}
        allowsCustomValue={false}
        menuTrigger="focus"
        width="100%"
      >
        {(item) => <Item key={item.id}>{item.name}</Item>}
      </ComboBox>
      {selectedActor && (
        <Button
          variant="secondary"
          onPress={handleClear}
          marginTop="size-100"
          width="100%"
        >
          Clear Selection
        </Button>
      )}
    </div>
  );
}

