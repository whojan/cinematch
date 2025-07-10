import React, { useState } from 'react';
import { ChevronDown, Star, Film, Award } from 'lucide-react';
import { BfiTopFilms } from './BfiTopFilms';
import { BfiDirectorsTopFilms } from './BfiDirectorsTopFilms';
import { Best300Movies } from './Best300Movies';

type ListType = 'bfi' | 'bfi-directors' | 'rotten-tomatoes';

interface ListOption {
  id: ListType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  emoji: string;
}

const listOptions: ListOption[] = [
  {
    id: 'bfi',
    name: 'BFI Sight & Sound En İyi Filmler',
    description: 'Sight & Sound dergisinin eleştirmenlerin en iyi 250 filmi listesi',
    icon: Film,
    emoji: '🎬'
  },
  {
    id: 'bfi-directors',
    name: 'BFI Sight & Sound Yönetmenlerin En İyi Filmleri',
    description: 'Dünya\'nın en iyi yönetmenlerinin seçtiği en iyi filmler',
    icon: Award,
    emoji: '🎭'
  },
  {
    id: 'rotten-tomatoes',
    name: 'Rotten Tomatoes En İyi Filmler',
    description: 'Tüm zamanların en iyi 300 filmi',
    icon: Star,
    emoji: '🍅'
  }
];

export const FeaturedLists: React.FC = () => {
  const [selectedList, setSelectedList] = useState<ListType>('bfi');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedOption = listOptions.find(option => option.id === selectedList);

  const renderSelectedList = () => {
    switch (selectedList) {
      case 'bfi':
        return <BfiTopFilms />;
      case 'bfi-directors':
        return <BfiDirectorsTopFilms />;
      case 'rotten-tomatoes':
        return <Best300Movies />;
      default:
        return <BfiTopFilms />;
    }
  };

  return (
    <div className="w-full">
      {/* Header ve Dropdown */}
      <div className="px-2 sm:px-4 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 rounded-xl border border-purple-500/30">
              <Star className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-primary">Öne Çıkan Listeler</h1>
              <p className="text-theme-secondary text-sm">Dünya sinema tarihinin en prestijli listeleri</p>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        <div className="relative mb-6">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-auto bg-theme-card border border-theme-primary rounded-xl px-4 py-3 text-left flex items-center justify-between space-x-3 hover:bg-theme-secondary transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{selectedOption?.emoji}</span>
              <div>
                <div className="text-theme-primary font-medium">{selectedOption?.name}</div>
                <div className="text-theme-tertiary text-xs">{selectedOption?.description}</div>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-theme-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card border border-theme-primary rounded-xl shadow-xl z-20 overflow-hidden">
                {listOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.id === selectedList;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedList(option.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors ${
                        isSelected 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-l-4 border-purple-500' 
                          : 'hover:bg-theme-secondary'
                      }`}
                    >
                      <span className="text-lg">{option.emoji}</span>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-purple-400' : 'text-theme-secondary'}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${isSelected ? 'text-purple-300' : 'text-theme-primary'}`}>
                          {option.name}
                        </div>
                        <div className="text-theme-tertiary text-xs">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected List Content */}
      <div>
        {renderSelectedList()}
      </div>
    </div>
  );
};

export default FeaturedLists;