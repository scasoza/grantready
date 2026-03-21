import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_ADDRESS = "CareLadder <notifications@careladder.app>";

export async function sendSubmissionConfirmation(
  to: string,
  centerName: string
): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Application Received — CareLadder",
      text: [
        `Hi,`,
        ``,
        `We've received the TRS certification application for ${centerName}.`,
        ``,
        `Our team is now reviewing your submission and will process it with your local Workforce Board. You can track the status of your application from your CareLadder dashboard at any time.`,
        ``,
        `If you have any questions, just reply to this email.`,
        ``,
        `Thank you,`,
        `The CareLadder Team`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[email] Failed to send submission confirmation:", err);
  }
}

export async function sendSubmissionComplete(
  to: string,
  centerName: string
): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "TRS Application Submitted to Workforce Board — CareLadder",
      text: [
        `Hi,`,
        ``,
        `Great news! The TRS certification application for ${centerName} has been submitted to your local Workforce Board.`,
        ``,
        `You'll be notified of any updates as they come in. In the meantime, you can view the status on your CareLadder dashboard.`,
        ``,
        `If you have any questions, just reply to this email.`,
        ``,
        `Thank you,`,
        `The CareLadder Team`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[email] Failed to send submission complete email:", err);
  }
}
