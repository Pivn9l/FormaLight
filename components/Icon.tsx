type Props = {
  name: string;
  className?: string;
  filled?: boolean;
};

/** Иконка из Google Material Symbols (Outlined) */
export function Icon({ name, className = "", filled = false }: Props) {
  return (
    <span
      className={`material-symbols-outlined icon ${filled ? "icon-filled" : ""} ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
