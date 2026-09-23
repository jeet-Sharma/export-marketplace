import Panel from "@/components/ui/Panel";

// Shipping info card: ready-to-ship window, origin port and incoterms.
export default function ShippingInfo({ shipping }) {
  if (!shipping) return null;

  const rows = [
    { label: "Ready to Ship", value: shipping.readyToShip },
    { label: "Shipped From", value: shipping.shippedFrom },
    { label: "Incoterms", value: shipping.incoterms },
  ];

  return (
    <Panel title="Shipping Info" bodyClassName="p-4 flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="font-body text-text-dim text-[12px]">{row.label}</span>
          <span className="font-body text-text text-[12px] text-right">{row.value}</span>
        </div>
      ))}
    </Panel>
  );
}
