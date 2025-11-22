import React from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  href?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, text, onClick, disabled = false, href }) => {
  const content = (
    <div className="flex items-center justify-center gap-3">
      {icon}
      <span>{text}</span>
    </div>
  );

  // Strict Design Tokens
  // Using bg-bg (Void) to ensure border (surface-alt) is visible against the background.
  const className = `
    relative flex items-center justify-center px-6 py-4
    font-mono text-[10px] uppercase tracking-widest
    bg-bg border-2 border-border text-text-muted
    hover:text-text-primary hover:border-accent hover:bg-surface
    active:scale-[0.98] hover:scale-[1.02]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-border
    transition-all duration-300 ease-out
    w-full md:w-auto
  `;

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {content}
    </button>
  );
};

export default ActionButton;
