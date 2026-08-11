import { EditableText } from "./EditableText";

export function SectionHeader({
  title,
  editable,
  onChange,
  index,
}: {
  title: string;
  editable: boolean;
  onChange: (value: string) => void;
  index: string;
}) {
  return (
    <div className="section-header">
      <span className="section-index">{index}</span>
      <EditableText value={title} onChange={onChange} editable={editable} as="h2" />
      <span className="section-rule" />
    </div>
  );
}
