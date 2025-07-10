import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { UserProfile, Genre } from '../types';

interface GenreRadarChartProps {
  profile: UserProfile;
  genres: Genre[];
}

export const GenreRadarChart: React.FC<GenreRadarChartProps> = ({ profile, genres }) => {
  // En çok sevilen 8 türü al
  const topGenres = Object.entries(profile.genreDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([genreId, percentage]) => {
      const genre = genres.find(g => g.id === parseInt(genreId));
      return {
        genre: genre?.name || 'Bilinmeyen',
        value: percentage,
        fullMark: 100
      };
    });

  // Eğer 8'den az tür varsa, boş değerlerle tamamla
  while (topGenres.length < 8) {
    topGenres.push({
      genre: '',
      value: 0,
      fullMark: 100
    });
  }

  // En yüksek değeri bul ve ölçeği belirle
  const maxValue = Math.max(...topGenres.map(item => item.value));
  
  // Dinamik ölçek hesaplama
  let dynamicScale: number;
  let tickCount: number;
  
  if (maxValue <= 5) {
    dynamicScale = 5;
    tickCount = 6; // 0, 1, 2, 3, 4, 5
  } else if (maxValue <= 10) {
    dynamicScale = 10;
    tickCount = 6; // 0, 2, 4, 6, 8, 10
  } else if (maxValue <= 20) {
    dynamicScale = 20;
    tickCount = 5; // 0, 5, 10, 15, 20
  } else if (maxValue <= 50) {
    dynamicScale = 50;
    tickCount = 6; // 0, 10, 20, 30, 40, 50
  } else {
    dynamicScale = 100;
    tickCount = 6; // 0, 20, 40, 60, 80, 100
  }

  // Minimum görünürlük için çok küçük değerleri ayarla
  const adjustedData = topGenres.map(item => ({
    ...item,
    // Çok küçük değerleri görünür yapmak için minimum değer ver
    value: item.value > 0 ? Math.max(item.value, dynamicScale * 0.05) : 0,
    fullMark: dynamicScale
  }));

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 text-center">Tür Tercihleri Radar Grafiği</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={adjustedData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="#475569" 
              strokeWidth={1}
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="genre" 
              tick={{ 
                fill: '#e2e8f0', 
                fontSize: 10,
                fontWeight: 500
              }}
              className="text-slate-200"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, dynamicScale]}
              tick={{ 
                fill: '#94a3b8', 
                fontSize: 9 
              }}
              tickCount={tickCount}
              axisLine={false}
              tickLine={false}
            />
            <Radar
              name="Tercih Oranı"
              dataKey="value"
              stroke="#f59e0b"
              fill="rgba(245, 158, 11, 0.2)"
              fillOpacity={0.4}
              strokeWidth={2.5}
              dot={{ 
                fill: '#f59e0b', 
                strokeWidth: 2, 
                stroke: '#ffffff',
                r: 4
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span className="text-slate-300 text-sm">Tercih Skoru (0-{dynamicScale})</span>
        </div>
        <p className="text-slate-400 text-xs mt-2">
          En çok sevdiğin türlerin dağılımı • Max: {maxValue.toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default GenreRadarChart;