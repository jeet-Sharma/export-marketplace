import colors from "@/theme/colors";

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
        <label
          htmlFor={id}
          className="font-body"
          style={{ color: colors.textDim, fontSize: "12px" }}
        >
          {label}
        </label>
      )}
      <div
        className="flex items-center gap-2"
        style={{
          backgroundColor: colors.panel,
          border: `1px solid ${colors.line}`,
          borderRadius: "3px",
          padding: "7px 10px",
        }}
      >
        {adornment && (
          <span style={{ color: colors.textDim, fontSize: "13px" }}>
            {adornment}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="font-body w-full focus:outline-none"
          style={{
            color: colors.text,
            backgroundColor: "transparent",
            border: "none",
            fontSize: "13px",
          }}
          {...rest}
        />
      </div>
    </div>
  );
}
