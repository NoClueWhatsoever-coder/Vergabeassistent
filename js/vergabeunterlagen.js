// vergabeunterlagen.js

// Globale Variablen für Kriterien, Formulare etc.
let criteria = [];
let forms = [];
let contracts = [];

// Tabs/Steps Navigation
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".step-tab");
  const contents = document.querySelectorAll(".step-content");
  let currentStep = 1;

  function showStep(step) {
    tabs.forEach(tab => tab.classList.remove("active"));
    contents.forEach(content => content.classList.remove("active"));
    tabs[step-1].classList.add("active");
    contents[step-1].classList.add("active");
    currentStep = step;
  }
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      showStep(Number(tab.dataset.step));
    });
  });

  // Buttons Step1 → Step2
  const saveLVBtn = document.getElementById("saveLVBtn");
  if (saveLVBtn) saveLVBtn.onclick = () => showStep(2);

  // Step2: Kriterien
  function renderCriteria() {
    const list = document.getElementById("criteriaList");
    if (!list) return;
    list.innerHTML = "";
    if (!criteria.length) {
      list.innerHTML = "<i>Noch keine Kriterien hinzugefügt.</i>";
    } else {
      criteria.forEach((crit, idx) => {
        const div = document.createElement("div");
        div.className = "criteria-item";
        div.innerHTML = `
          <input type="text" value="${crit.name}" data-idx="${idx}" style="width:60%;">
          <input type="number" min="0" max="100" value="${crit.weight}" data-idx="${idx}" style="width:3em;"> %
          <button data-del="${idx}">🗑️</button>
        `;
        list.appendChild(div);
      });
      list.querySelectorAll("input[type='text']").forEach(inp => {
        inp.onchange = e => {
          const i = +inp.dataset.idx;
          criteria[i].name = inp.value;
        };
      });
      list.querySelectorAll("input[type='number']").forEach(inp => {
        inp.onchange = e => {
          const i = +inp.dataset.idx;
          criteria[i].weight = inp.value;
        };
      });
      list.querySelectorAll("button[data-del]").forEach(btn => {
        btn.onclick = () => {
          criteria.splice(+btn.dataset.del, 1);
          renderCriteria();
        };
      });
    }
  }
  const addCriterionBtn = document.getElementById("addCriterionBtn");
  if (addCriterionBtn) addCriterionBtn.onclick = () => {
    criteria.push({ name: "", weight: 0 });
    renderCriteria();
  };
  const criteriaPrevBtn = document.getElementById("criteriaPrevBtn");
  if (criteriaPrevBtn) criteriaPrevBtn.onclick = () => showStep(1);
  const criteriaNextBtn = document.getElementById("criteriaNextBtn");
  if (criteriaNextBtn) criteriaNextBtn.onclick = () => showStep(3);

  // Step3: Formulare (Eigenerklärungen)
  function renderForms() {
    const list = document.getElementById("formList");
    if (!list) return;
    list.innerHTML = "";
    const allForms = [
      {id: "zuverlässigkeit", label: "Eigenerklärung Zuverlässigkeit"},
      {id: "steuer", label: "Eigenerklärung Steuerehrlichkeit"},
      {id: "tariftreue", label: "Eigenerklärung Tariftreue"},
      {id: "berufshaft", label: "Nachweis Berufshaftpflicht"}
    ];
    allForms.forEach(f => {
      const checked = forms.includes(f.id) ? "checked" : "";
      const el = document.createElement("div");
      el.innerHTML = `<label><input type="checkbox" value="${f.id}" ${checked}> ${f.label}</label>`;
      list.appendChild(el);
    });
    list.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.onchange = () => {
        if(cb.checked) forms.push(cb.value);
        else forms = forms.filter(x => x !== cb.value);
      };
    });
  }
  const formsPrevBtn = document.getElementById("formsPrevBtn");
  if (formsPrevBtn) formsPrevBtn.onclick = () => showStep(2);
  const formsNextBtn = document.getElementById("formsNextBtn");
  if (formsNextBtn) formsNextBtn.onclick = () => showStep(4);

  // Step4: Vertragsbedingungen
  function renderContracts() {
    const list = document.getElementById("contractList");
    if (!list) return;
    list.innerHTML = "";
    const allContracts = [
      {id:"bvb", label:"BVB für Bau"},
      {id:"evb-it", label:"EVB-IT für IT"},
      {id:"volb", label:"VOL/B für Lieferungen"},
      {id:"uvgo", label:"UVgO für Kommunen"}
    ];
    allContracts.forEach(c => {
      const checked = contracts.includes(c.id) ? "checked" : "";
      const el = document.createElement("div");
      el.innerHTML = `<label><input type="checkbox" value="${c.id}" ${checked}> ${c.label}</label>`;
      list.appendChild(el);
    });
    list.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.onchange = () => {
        if(cb.checked) contracts.push(cb.value);
        else contracts = contracts.filter(x => x !== cb.value);
      };
    });
  }
  const contractsPrevBtn = document.getElementById("contractsPrevBtn");
  if (contractsPrevBtn) contractsPrevBtn.onclick = () => showStep(3);
  const finishBtn = document.getElementById("finishBtn");
  if (finishBtn) finishBtn.onclick = () => {
    alert("Vergabeunterlagen erstellt! (Export folgt …)");
  };

  // Initial Renderings
  renderCriteria();
  renderForms();
  renderContracts();

  // LV mit KI generieren
  const generateLVBtn = document.getElementById("generateLVBtn");
  if (generateLVBtn) generateLVBtn.onclick = async () => {
    const lvInput = document.getElementById("lvInput");
    const spinner = document.getElementById("lvLoadingSpinner");
    const beschreibung = lvInput.value;
    spinner.style.display = "block";
    lvInput.value = "";
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const resp = await fetch('/api/lv-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          messages: [ { role: "user", content: beschreibung } ],
          projekt_id: new URLSearchParams(window.location.search).get('id')
        })
      });
      const result = await resp.json();
      if (result.result) {
        lvInput.value = result.result;
      } else {
        lvInput.value = "Fehler: Keine Antwort von der KI.";
      }
    } catch (err) {
      lvInput.value = "Fehler beim Generieren: " + err.message;
    }
    spinner.style.display = "none";
  };

  // --- NEU: Formblatt 124 Button ---
  const formblatt124Btn = document.getElementById("addFormblatt124Btn");
  if (formblatt124Btn) formblatt124Btn.onclick = async function() {
    // Projekt-ID ermitteln
    const urlParams = new URLSearchParams(window.location.search);
    const projektId = urlParams.get('id');
    // Werte abfragen (später automatisch füllen!)
    const baumaßnahme = prompt("Baumaßnahme (wird ins Formular übernommen):", "");
    const leistung = prompt("Leistung (wird ins Formular übernommen):", "");
    const maßnahme_nr = prompt("Maßnahmenummer (optional):", "");
    const vergabe_nr = prompt("Vergabenummer (optional):", "");
    await generateFormblatt124(projektId, {
      baumaßnahme, leistung, maßnahme_nr, vergabe_nr
    });
  };
});

// --- Backend-Kommunikation für Formblatt 124 ---
async function generateFormblatt124(projektId, projektDaten) {
  const resp = await fetch('/api/generate_formblatt_124', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projekt_id: projektId,
      baumaßnahme: projektDaten.baumaßnahme,
      leistung: projektDaten.leistung,
      maßnahme_nr: projektDaten.maßnahme_nr,
      vergabe_nr: projektDaten.vergabe_nr
    })
  });
  const data = await resp.json();
  addDocumentToList(data.filename, data.url, projektId);
}

function addDocumentToList(filename, url, projektId) {
  const list = document.getElementById('declarationList');
  if (list.children.length === 1 && list.children[0].textContent.includes('Keine')) {
    list.innerHTML = '';
  }
  const li = document.createElement('li');
  li.innerHTML = `<a href="${url}" target="_blank">${filename}</a> 
    <button onclick="deleteDocument('${filename}', '${projektId}', this)">Entfernen</button>`;
  list.appendChild(li);
}

async function deleteDocument(filename, projektId, btn) {
  const resp = await fetch(`/api/delete_file?projekt_id=${encodeURIComponent(projektId)}&filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE'
  });
  const data = await resp.json();
  if (data.status === "deleted") {
    btn.parentElement.remove();
  } else {
    alert("Löschen fehlgeschlagen!");
  }
}
