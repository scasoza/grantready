import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrsDocTemplate } from "@/lib/trs-documents";
import { parseStaffMembers, type StaffMember } from "@/lib/staff-utils";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const colors = {
  navy: "#1a1a2e",
  darkGray: "#333333",
  medGray: "#555555",
  lightGray: "#999999",
  border: "#cccccc",
  lightBorder: "#e5e5e5",
  background: "#f9f9fb",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: colors.darkGray,
    backgroundColor: colors.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },

  /* Header */
  header: {
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
    paddingBottom: 14,
    marginBottom: 28,
  },
  centerName: {
    fontSize: 9,
    color: colors.medGray,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 4,
  },
  docDate: {
    fontSize: 9,
    color: colors.lightGray,
  },

  /* Body */
  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    marginBottom: 12,
    color: colors.darkGray,
  },
  emptyNotice: {
    fontSize: 11,
    color: colors.lightGray,
    fontStyle: "italic",
  },

  /* Staff binder */
  staffCard: {
    marginBottom: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  staffName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  staffRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  staffLabel: {
    width: 130,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.medGray,
  },
  staffValue: {
    flex: 1,
    fontSize: 10,
    color: colors.darkGray,
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: colors.lightGray,
  },
});

/* ------------------------------------------------------------------ */
/*  Credential label helper                                           */
/* ------------------------------------------------------------------ */

function credentialLabel(type: StaffMember["credentialType"]): string {
  const map: Record<StaffMember["credentialType"], string> = {
    none: "None",
    cda: "CDA",
    associates: "Associate's Degree",
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
  };
  return map[type] ?? type;
}

/* ------------------------------------------------------------------ */
/*  PDF Components                                                     */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  centerName: string;
  title: string;
  date: string;
}

const Header = ({ centerName, title, date }: HeaderProps) => (
  <View style={styles.header}>
    <Text style={styles.centerName}>{centerName}</Text>
    <Text style={styles.docTitle}>{title}</Text>
    <Text style={styles.docDate}>Generated {date}</Text>
  </View>
);

interface FooterProps {
  centerName: string;
}

const Footer = ({ centerName }: FooterProps) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      CareLadder — {centerName} — Confidential
    </Text>
    <Text
      style={styles.footerText}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  </View>
);

/* Staff Binder PDF */

interface StaffBinderPdfProps {
  centerName: string;
  staff: StaffMember[];
  date: string;
}

const StaffBinderPdf = ({ centerName, staff, date }: StaffBinderPdfProps) => (
  <Document
    title={`Staff Credentials Binder — ${centerName}`}
    author="CareLadder"
  >
    <Page size="LETTER" style={styles.page}>
      <Header
        centerName={centerName}
        title="Staff Credentials Binder"
        date={date}
      />

      {staff.length === 0 ? (
        <Text style={styles.emptyNotice}>No staff members on file.</Text>
      ) : (
        staff.map((m) => (
          <View key={m.id} style={styles.staffCard} wrap={false}>
            <Text style={styles.staffName}>{m.name}</Text>

            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Role</Text>
              <Text style={styles.staffValue}>{m.role}</Text>
            </View>
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Credential</Text>
              <Text style={styles.staffValue}>
                {credentialLabel(m.credentialType)}
              </Text>
            </View>
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Hire Date</Text>
              <Text style={styles.staffValue}>{m.hireDate || "\u2014"}</Text>
            </View>
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>CPR Expiry</Text>
              <Text style={styles.staffValue}>{m.cprExpiry || "\u2014"}</Text>
            </View>
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Training Hours</Text>
              <Text style={styles.staffValue}>{m.trainingHours} hrs</Text>
            </View>
          </View>
        ))
      )}

      <Footer centerName={centerName} />
    </Page>
  </Document>
);

/* Standard Document PDF */

interface StandardDocPdfProps {
  centerName: string;
  docTitle: string;
  aiDraft: string;
  date: string;
}

const StandardDocPdf = ({
  centerName,
  docTitle,
  aiDraft,
  date,
}: StandardDocPdfProps) => {
  const paragraphs = aiDraft
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Document title={`${docTitle} — ${centerName}`} author="CareLadder">
      <Page size="LETTER" style={styles.page}>
        <Header centerName={centerName} title={docTitle} date={date} />

        {paragraphs.length === 0 ? (
          <Text style={styles.emptyNotice}>
            No content has been drafted for this document yet.
          </Text>
        ) : (
          paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))
        )}

        <Footer centerName={centerName} />
      </Page>
    </Document>
  );
};

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType");
    const applicationId = searchParams.get("applicationId");

    if (!docType || !applicationId) {
      return NextResponse.json(
        { error: "Missing required query params: docType, applicationId" },
        { status: 400 }
      );
    }

    const template = getTrsDocTemplate(docType);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown docType: ${docType}` },
        { status: 400 }
      );
    }

    // Load center info
    const { data: centerRow } = await supabase
      .from("centers")
      .select("id, center_name")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const centerId = centerRow?.id as string | undefined;
    const centerName = (centerRow?.center_name as string) || "Your Center";

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Staff binder: special path — pull from center_data, not application_sections
    if (docType === "staff_binder") {
      let staff: StaffMember[] = [];

      if (centerId) {
        const { data: row } = await supabase
          .from("center_data")
          .select("data_value")
          .eq("center_id", centerId)
          .eq("data_key", "staff_members")
          .maybeSingle();

        staff = parseStaffMembers(row?.data_value ?? null);
      }

      const buffer = await renderToBuffer(
        <StaffBinderPdf centerName={centerName} staff={staff} date={date} />
      );

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="staff-credentials-binder.pdf"`,
        },
      });
    }

    // Standard docs: load from application_sections
    const { data: sectionRow } = await supabase
      .from("application_sections")
      .select("ai_draft")
      .eq("application_id", applicationId)
      .eq("section_type", docType)
      .limit(1)
      .single();

    const aiDraft = (sectionRow?.ai_draft as string) || "";

    const buffer = await renderToBuffer(
      <StandardDocPdf
        centerName={centerName}
        docTitle={template.title}
        aiDraft={aiDraft}
        date={date}
      />
    );

    const safeTitle = template.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
