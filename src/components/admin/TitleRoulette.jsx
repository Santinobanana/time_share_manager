import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Componente de Ruleta para sorteo de títulos
 * Con animación visual tipo slot machine
 */
export default function TitleRoulette({ titles, onWinnerSelected, isSpinning }) {
  const [displayedTitle, setDisplayedTitle] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const intervalRef = useRef(null);
  const spinCountRef = useRef(0);

  useEffect(() => {
    if (isSpinning && titles.length > 0) {
      startSpinning();
    } else {
      stopSpinning();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSpinning, titles]);

  const startSpinning = () => {
    spinCountRef.current = 0;
    setAnimationSpeed(50);

    intervalRef.current = setInterval(() => {
      // Seleccionar título aleatorio
      const randomIndex = Math.floor(Math.random() * titles.length);
      setDisplayedTitle(titles[randomIndex]);

      spinCountRef.current++;

      // Desacelerar gradualmente después de 3 segundos (60 iteraciones a 50ms)
      if (spinCountRef.current > 60) {
        const slowdownFactor = Math.min((spinCountRef.current - 60) / 30, 1);
        const newSpeed = 50 + (slowdownFactor * 200); // De 50ms a 250ms
        setAnimationSpeed(newSpeed);

        // Detener después de ~5 segundos total
        if (spinCountRef.current > 100) {
          stopSpinning();
          // Seleccionar ganador final
          const finalIndex = Math.floor(Math.random() * titles.length);
          const winner = titles[finalIndex];
          setDisplayedTitle(winner);
          onWinnerSelected(winner);
        }
      }
    }, animationSpeed);
  };

  const stopSpinning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getSerieColor = (titleId) => {
    if (!titleId) return 'bg-gray-100';
    const serie = titleId.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-100';
  };

  return (
    <div className="relative">
      {/* Ruleta principal */}
      <div className={`
        relative overflow-hidden rounded-2xl border-4 
        ${isSpinning ? 'border-yellow-400 shadow-lg shadow-yellow-200' : 'border-gray-300'}
        transition-all duration-300
      `}>
        {/* Efecto de brillo cuando está girando */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        )}

        {/* Display del título */}
        <div className={`
          ${displayedTitle ? getSerieColor(displayedTitle.id) : 'bg-gray-50'} 
          p-12 text-center relative z-10
          ${isSpinning ? 'animate-pulse' : ''}
        `}>
          {displayedTitle ? (
            <>
              <div className="text-6xl font-bold text-gray-900 mb-4">
                {displayedTitle.id}
              </div>
              <div className="text-xl text-gray-700">
                Serie {displayedTitle.serie} · Subserie {displayedTitle.subserie} · #{displayedTitle.number}
              </div>
            </>
          ) : (
            <div className="text-2xl text-gray-400">
              {titles.length > 0 ? 'Presiona "Girar Ruleta"' : 'Cargando títulos...'}
            </div>
          )}
        </div>

        {/* Indicador de giro */}
        {isSpinning && (
          <div className="absolute top-4 right-4 z-20">
            <Sparkles className="animate-spin text-yellow-500" size={32} />
          </div>
        )}
      </div>

      {/* Lista visual de títulos deslizándose (opcional) */}
      {isSpinning && (
        <div className="mt-4 overflow-hidden">
          <div className="flex gap-2 animate-scroll">
            {titles.slice(0, 10).map((title, index) => (
              <div
                key={`preview-${index}`}
                className={`
                  ${getSerieColor(title.id)} 
                  px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
                  flex-shrink-0
                `}
              >
                {title.id}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contador de títulos participantes */}
      <div className="mt-4 text-center text-sm text-gray-600">
        {titles.length} títulos participando
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 2s linear infinite;
        }
      `}</style>
    </div>
  );
}