import PDFDocument from "pdfkit";

export const generatePDF = (profile: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: any[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Add profile details to the PDF
    doc.fontSize(16).text("User Profile", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${profile.name}`);
    doc.text(`Address: ${profile.address}`);
    doc.text(`Phone Number: ${profile.phoneNumber}`);

    // Add education information
    doc.moveDown();
    doc.text("Education:");
    profile.education.forEach((edu: any, index: number) => {
      doc.text(
        `  ${index + 1}. Degree: ${edu.degree}, Institution: ${edu.institution}`
      );
    });

    // Add work history
    doc.moveDown();
    doc.text("Work History:");
    profile.workHistory.forEach((work: any, index: number) => {
      doc.text(
        `  ${index + 1}. Job Title: ${work.jobTitle}, Company: ${
          work.companyName
        }`
      );
    });

    // Add skills
    doc.moveDown();
    doc.text("Skills:");
    profile.skills.forEach((skill: any, index: number) => {
      doc.text(`  ${index + 1}. ${skill.skill}`);
    });

    doc.end();
  });
};
