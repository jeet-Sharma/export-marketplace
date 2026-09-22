// Generic text input with an optional leading adornment (used for search).
export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  adornment,
  label,
  id,
  className = "",
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-body text-text-dim text-[12px]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 bg-panel border border-line rounded px-[10px] py-[7px] focus-within:border-saffron">
        {adornment && (
          <span className="text-text-dim text-[13px]">{adornment}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="font-body w-full bg-transparent border-none text-text text-[13px] focus:outline-none"
          {...rest}
        />
      </div>
    </div>
  );
}
