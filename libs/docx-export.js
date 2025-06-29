// docx-export.js

function exportDocxLV() {
  if (!pruefeCredits(5)) return;
  verwendeCredits(5);

  const lvContent = document.getElementById('lvContent');
  if (!lvContent || !lvContent.innerHTML.trim()) {
    alert('Kein Leistungsverzeichnis zum Exportieren gefunden.');
    return;
  }

  const doc = new window.docx.Document({
    sections: [
      {
        children: [
          new window.docx.Paragraph({
            children: [
              new window.docx.TextRun({
                text: 'Leistungsverzeichnis',
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 300 },
          }),
          ...convertHtmlToDocx(lvContent.innerHTML),
        ],
      },
    ],
  });

  window.docx.Packer.toBlob(doc).then((blob) => {
    saveAs(blob, 'leistungsverzeichnis.docx');
  });
}

function convertHtmlToDocx(htmlString) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  const paragraphs = [];

  tempDiv.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        paragraphs.push(
          new window.docx.Paragraph({
            children: [new window.docx.TextRun({ text })],
            spacing: { after: 200 },
          })
        );
      }
    }
  });

  return paragraphs;
}
