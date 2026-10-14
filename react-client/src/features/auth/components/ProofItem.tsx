type ProofItemProps = {
  value: string;
  label: string;
};

export function ProofItem({ value, label }: ProofItemProps) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <p className="text-[20px] font-bold text-bloom-amber">{value}</p>
      <p className="text-[11px] leading-[1.35] text-white opacity-70">
        {label}
      </p>
    </div>
  );
}
