interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = "" }: GlitchTextProps) {
  return (
    <span className={`glitch-wrapper ${className}`}>
      <span className="glitch" data-text={text}>
        {text}
      </span>
    </span>
  );
}
