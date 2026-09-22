import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { verificationChecklist, profileMeta } from "@/data/profile";

export default function VerificationPanel() {
  const outstanding = verificationChecklist.filter(
    (item) => item.status !== "verified",
  ).length;

  return (
    <Panel
      title={profileMeta.verificationPanelTitle}
      action={
        <span
          className="font-body"
          style={{ color: colors.textDim, fontSize: "12px" }}
        >
          {outstanding} outstanding
        </span>
      }
      bodyClassName="p-4"
    >
      <ul className="flex flex-col gap-3">
        {verificationChecklist.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3"
          >
            <span
              className="font-body"
              style={{ color: colors.text, fontSize: "13px" }}
            >
              {item.label}
            </span>
            <span className="flex items-center gap-2">
              <StatusPill status={item.status} />
              {item.status === "missing" && (
                <Button variant="accent" size="sm">
                  Upload
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
