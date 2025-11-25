import { useState } from 'react';

export const useAuth = () => {
  const [user] = useState(null);
  
  return { user };
};