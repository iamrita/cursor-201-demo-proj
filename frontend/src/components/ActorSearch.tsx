import { useState, useEffect, useRef } from 'react';
import { ComboBox, Item } from '@adobe/react-spectrum';
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
  const [items, setItems] = useState<Actor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If query is empty, clear suggestions
    if (!inputValue.trim()) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Debounce search
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchActors(inputValue);
        setItems(results);
      } catch (error) {
        console.error('Error searching actors:', error);
        setItems([]);
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

  const handleSelectionChange = (key: any) => {
    if (key) {
      const actor = items.find(a => a.id.toString() === key);
      if (actor) {
        onSelect(actor);
      }
    } else {
      onSelect(null);
    }
  };

  return (
    <ComboBox
      label={label}
      width="100%"
      placeholder="Search for an actor..."
      inputValue={inputValue}
      onInputChange={setInputValue}
      items={items}
      selectedKey={selectedActor?.id.toString() || null}
      onSelectionChange={handleSelectionChange}
      loadingState={isLoading ? 'loading' : 'idle'}
      allowsCustomValue
    >
      {(item: Actor) => <Item key={item.id.toString()}>{item.name}</Item>}
    </ComboBox>
  );
}

