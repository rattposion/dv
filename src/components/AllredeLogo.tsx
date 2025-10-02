import React from 'react';

const AllredeLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-3"
      >
        {/* Triângulo principal */}
        <path 
          d="M20 5 L35 30 L5 30 Z" 
          fill="#2563eb" 
          stroke="#1e40af" 
          strokeWidth="1"
        />
        {/* Linha interna */}
        <path 
          d="M20 12 L28 25 L12 25 Z" 
          fill="#3b82f6" 
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-800">allrede</span>
        <span className="text-xs text-gray-600 -mt-1">telecom</span>
      </div>
    </div>
  );
};

export default AllredeLogo;