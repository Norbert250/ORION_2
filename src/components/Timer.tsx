import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialTime: number;
  onTimeUpdate: (time: number) => void;
  onTimeUp: () => void;
}

export const Timer = ({ initialTime, onTimeUpdate, onTimeUp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        onTimeUpdate(newTime);
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, onTimeUpdate]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const isWarning = timeLeft <= 90; // Red at 1:30 (90 seconds)
  
  return (
    <div className={`fixed top-20 right-6 z-50 bg-white/95 backdrop-blur-md border rounded-lg px-3 py-2 shadow-lg ${
      isWarning ? 'border-[#eb2128] bg-red-50/95' : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${isWarning ? 'text-[#eb2128]' : 'text-gray-600'}`} />
        <span className={`text-sm font-medium ${isWarning ? 'text-[#eb2128]' : 'text-gray-700'}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};