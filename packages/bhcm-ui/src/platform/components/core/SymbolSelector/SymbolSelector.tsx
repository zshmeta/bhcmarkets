import { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import type { SymbolSelectorProps } from './SymbolSelector.types';
import {
    Container,
    TriggerButton,
    Dropdown,
    Tabs,
    Tab,
    SearchBar,
    SearchInput,
    CategoryList,
    CategoryHeader,
    SymbolList,
    SymbolItem,
} from './SymbolSelector.styles';




function SymbolSelector({
    categories, selectedSymbol, onSelect, className,
}: SymbolSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'watchlists' | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleCategory = (id: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    const handleSelect = (symbol: string) => {
        onSelect(symbol);
        setIsOpen(false);
    };

    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0 || searchQuery === ''); // Show empty categories if no search, else hide empty

    return (
        <Container ref={containerRef} className={className}>
            <TriggerButton onClick={() => setIsOpen(!isOpen)}>
                <span>{selectedSymbol || 'Select Market'}</span>
                <Icons name={isOpen ? 'chevron-up' : 'chevron-down'} size="xs" />
            </TriggerButton>

            {isOpen && (
                <Dropdown>
                    <Tabs>
                        <Tab
                            $active={activeTab === 'watchlists'}
                            onClick={() => setActiveTab('watchlists')}
                        >
                            Watchlists
                        </Tab>
                        <Tab
                            $active={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                        >
                            All symbols
                        </Tab>
                    </Tabs>

                    <SearchBar>
                        <div style={{ position: 'relative' }}>
                            <SearchInput
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus />
                            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6E7681' }}>
                                <Icons name="search" size="xs" />
                            </span>
                        </div>
                    </SearchBar>

                    <CategoryList>
                        {filteredCategories.map(category => (
                            <div key={category.id}>
                                <CategoryHeader
                                    $expanded={expandedCategories.has(category.id)}
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <Icons name="play" size="xs" style={{ fontSize: '10px' }} />
                                    {category.label}
                                </CategoryHeader>

                                {expandedCategories.has(category.id) && (
                                    <SymbolList>
                                        {category.items.map(item => (
                                            <SymbolItem
                                                key={item.id}
                                                $selected={item.symbol === selectedSymbol}
                                                onClick={() => handleSelect(item.symbol)}
                                            >
                                                <span>{item.symbol}</span>
                                                {item.description && <span style={{ color: '#6E7681', fontSize: '10px' }}>{item.description}</span>}
                                            </SymbolItem>
                                        ))}
                                    </SymbolList>
                                )}
                            </div>
                        ))}
                    </CategoryList>
                </Dropdown>
            )}
        </Container>
    );
}

export default SymbolSelector;
