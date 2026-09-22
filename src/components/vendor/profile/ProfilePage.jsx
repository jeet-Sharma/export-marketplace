import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/vendor/PageHeader";
import StatusPill from "@/components/vendor/StatusPill";
import CompanyForm from "@/components/vendor/profile/CompanyForm";
import VerificationPanel from "@/components/vendor/profile/VerificationPanel";
import { companyProfile, teamMembers, profileMeta } from "@/data/profile";

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        breadcrumb="Vendor Panel / Company Profile"
        actionLabel="+ Invite Member"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Company identity strip */}
          <div
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              backgroundColor: colors.panel,
              border: `1px solid ${colors.line}`,
              borderRadius: "3px",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center font-heading font-bold"
                style={{
                  backgroundColor: colors.blueGrey,
                  color: colors.panel,
                  width: "40px",
                  height: "40px",
                  borderRadius: "3px",
                  fontSize: "14px",
                }}
              >
                {companyProfile.initials}
              </span>
              <span className="flex flex-col">
                <span
                  className="font-heading font-bold"
                  style={{ color: colors.ink, fontSize: "16px" }}
                >
                  {companyProfile.displayName}
                </span>
                <span
                  className="font-body"
                  style={{ color: colors.textDim, fontSize: "12px" }}
                >
                  {companyProfile.legalName}
                </span>
              </span>
            </div>
            <StatusPill status={companyProfile.panelStatus} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CompanyForm />
            </div>
            <div className="lg:col-span-1">
              <VerificationPanel />
            </div>
          </div>

          {/* Team members */}
          <Panel
            title={profileMeta.teamPanelTitle}
            action={
              <Button variant="ghost" size="sm">
                Manage roles
              </Button>
            }
            bodyClassName="p-4"
          >
            <ul className="flex flex-col gap-3">
              {teamMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="flex flex-col">
                    <span
                      className="font-heading font-semibold"
                      style={{ color: colors.ink, fontSize: "13px" }}
                    >
                      {member.name}
                    </span>
                    <span
                      className="font-body"
                      style={{ color: colors.textDim, fontSize: "12px" }}
                    >
                      {member.role} {"\u00B7"} {member.email}
                    </span>
                  </span>
                  <StatusPill status={member.status} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </main>
    </>
  );
}
