import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  onTimeUp: () => void;
  maxMinutes?: number;
}

export const Timer = ({ onTimeUp, maxMinutes = 5 }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(maxMinutes * 60); // Convert to seconds
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const isWarning = timeLeft <= 60; // Last minute warning
  
  return (
    <div className={`fixed top-20 right-6 z-50 bg-white/95 backdrop-blur-md border rounded-lg px-3 py-2 shadow-lg ${
      isWarning ? 'border-red-300 bg-red-50/95' : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${isWarning ? 'text-red-600' : 'text-gray-600'}`} />
        <span className={`text-sm font-medium ${isWarning ? 'text-red-600' : 'text-gray-700'}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      {isWarning && (
        <p className="text-xs text-red-600 mt-1">Time running out!</p>
      )}
    </div>
  );
};