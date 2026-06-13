import "./Radio.css";

type Props = {
  name: string;
  label: string;
  value: string;
  defaultValue: string;
};

export function Radio({ name, label, value, defaultValue }: Props) {
  return (
    <div className="radio-item">
      <input
        type="radio"
        name={name}
        value={value}
        id={value}
        defaultChecked={defaultValue === value}
      />
      <label htmlFor={value}>{label}</label>
    </div>
  );
}
