type EditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  multiline?: boolean;
};

export function EditableText({
  value,
  onChange,
  editable,
  as = "span",
  className = "",
  multiline = false,
}: EditableTextProps) {
  if (editable) {
    return multiline ? (
      <textarea className={`editable ${className}`} value={value} onChange={(event) => onChange(event.target.value)} />
    ) : (
      <input className={`editable ${className}`} value={value} onChange={(event) => onChange(event.target.value)} />
    );
  }

  const Tag = as;
  return <Tag className={className}>{value}</Tag>;
}
