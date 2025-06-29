// export.js

function downloadLV() {
    if (!pruefeCredits(5)) return;
    verwendeCredits(5);
    
  const lvContent = document.getElementById('lvContent');
  if (!lvContent) {
    alert('Kein Leistungsverzeichnis gefunden.');
    return;
  }

  const content = lvContent.innerHTML;
  const blob = new Blob([`
    <html>
      <head><meta charset="utf-8"><title>Leistungsverzeichnis</title></head>
      <body>${content}</body>
    </html>
  `], { type: 'application/vnd.ms-word' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leistungsverzeichnis.doc';
  a.click();
  URL.revokeObjectURL(url);

  userCredits -= 5;
  document.getElementById('userCredits').textContent = userCredits;
  alert('Download gestartet! 5 Credits verwendet.');
}
