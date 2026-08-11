import { EditableText } from "./EditableText";

export function Field({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <strong>{label}</strong>
      <EditableText value={value} onChange={onChange} editable={editable} as="p" multiline />
    </div>
  );
}
