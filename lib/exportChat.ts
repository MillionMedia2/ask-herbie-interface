import { IMessage } from "@/types";

/**
 * Removes AI citation markers like 【4:12†source】 from text
 */
function stripCitations(text: string): string {
  return text.replace(/【[^】]*†[^】]*】/g, "");
}

/**
 * Export chat messages as a TXT file
 */
export function exportChatAsTXT(
  messages: IMessage[],
  conversationTitle: string
) {
  if (messages.length === 0) return;

  let txtContent = `Chat: ${conversationTitle}\n`;
  txtContent += `Exported: ${new Date().toLocaleString()}\n`;
  txtContent += "=".repeat(50) + "\n\n";

  messages.forEach((message) => {
    const sender = message.senderId === "user" ? "You" : "Herbie";
    const timestamp = new Date(message.createdAt).toLocaleString();
    const content = stripCitations(message.content);

    txtContent += `[${timestamp}] ${sender}:\n${content}\n\n`;
  });

  // Create and download file
  const blob = new Blob([txtContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${conversationTitle.replace(
    /[^a-z0-9]/gi,
    "_"
  )}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export chat messages as a PDF file
 */
export async function exportChatAsPDF(
  messages: IMessage[],
  conversationTitle: string
) {
  if (messages.length === 0) return;

  // Check if jsPDF is available
  if (typeof window === "undefined") return;

  try {
    // Dynamically import jsPDF
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(conversationTitle, margin, yPosition);
    yPosition += 10;

    // Export date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 10;

    // Separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Messages
    messages.forEach((message, index) => {
      const sender = message.senderId === "user" ? "You" : "Herbie";
      const timestamp = new Date(message.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const content = stripCitations(message.content);

      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Sender name and timestamp
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(message.senderId === "user" ? "#2563eb" : "#059669");
      doc.text(`${sender} • ${timestamp}`, margin, yPosition);
      yPosition += 7;

      // Message content
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#000000");

      const lines = doc.splitTextToSize(content, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      yPosition += 8; // Space between messages
    });

    // Save the PDF
    doc.save(
      `${conversationTitle.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(
      "Failed to generate PDF. Please try exporting as TXT instead."
    );
  }
}
