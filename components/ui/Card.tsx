import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-2xl border border-[#D4D4D4] dark:border-[#303030] shadow-xs transition-colors ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`p-6 border-b border-[#D4D4D4] dark:border-[#303030] ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}
