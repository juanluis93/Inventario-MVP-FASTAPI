import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface SearchContextValue {
  query: string;
  setQuery: (value: string) => void;
  resetQuery: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState('');

  const value = useMemo(
    () => ({
      query,
      setQuery,
      resetQuery: () => setQuery(''),
    }),
    [query]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};
