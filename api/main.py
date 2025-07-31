from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from PyPDF2 import PdfReader, PdfWriter
from PyPDF2.generic import NameObject, BooleanObject

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# PDF-Generierung (z.B. für VHB 124)
@app.post("/api/generate_formblatt_124")
async def generate_formblatt_124(request: Request):
    data = await request.json()
    projekt_id = str(data.get("projekt_id"))
    baumaßnahme = data.get("baumaßnahme", "")
    leistung = data.get("leistung", "")
    maßnahme_nr = data.get("maßnahme_nr", "")
    vergabe_nr = data.get("vergabe_nr", "")

    projekt_dir = f"static/projekte/{projekt_id}/"
    os.makedirs(projekt_dir, exist_ok=True)
    input_pdf = "vorlagen/124_Eigenerklärung_zur_Eignung.pdf"
    output_pdf = os.path.join(projekt_dir, f"124_Eigenerklaerung_{vergabe_nr}.pdf")

    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    mapping = {
        "ag_massnahme_bez_1": baumaßnahme,
        "ag_leistung_bez": leistung,
        "ag_massnahme_bez_2": maßnahme_nr,
        "ag_vergabe_nr": vergabe_nr,
    }
    writer.update_page_form_field_values(writer.pages[0], mapping)
    if "/AcroForm" in writer._root_object:
        writer._root_object["/AcroForm"].update({
            NameObject("/NeedAppearances"): BooleanObject(True)
        })
    with open(output_pdf, "wb") as f_out:
        writer.write(f_out)

    # Rückgabe für Frontend
    return JSONResponse({
        "filename": os.path.basename(output_pdf),
        "url": f"/static/projekte/{projekt_id}/{os.path.basename(output_pdf)}"
    })

# Dokument löschen (per Button)
@app.delete("/api/delete_file")
async def delete_file(projekt_id: str, filename: str):
    file_path = f"static/projekte/{projekt_id}/{filename}"
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    else:
        return {"status": "not found"}, 404
