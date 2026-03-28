import { useState, useEffect } from 'react';

/**
 * Debounce a value — returns the debounced version that only updates
 * after `delay` ms of inactivity.
 *
 * Usage:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *   useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
