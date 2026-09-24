export interface FieldErrorProps {
  message?: string;
}

// Inline field-level error text, shown under an Input when validation fails.
export default function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p role="alert" className="font-body text-coral text-[12px]">
      {message}
    </p>
  );
}
