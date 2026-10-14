"""Create a PRIVATE review worksheet and rendered page; never mark OCR as verified.

Requires PyMuPDF (python3 -m pip install pymupdf). This adapter is for the supplied
50-page, two-column word-list PDF. Another edition/layout must be adapted first.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import fitz

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', required=True)
    ap.add_argument('--html', required=True)
    ap.add_argument('--day', type=int, required=True)
    ap.add_argument('--output', default='.private')
    a = ap.parse_args()
    if not 1 <= a.day <= 48:
        ap.error('DAY must be 1..48')
    pdf = Path(a.pdf)
    doc = fitz.open(pdf)
    if len(doc) != 50:
        ap.error('Expected the supplied 50-page layout; adapt before using another PDF')
    page = doc[a.day - 1]
    if not re.search(r'DAY\s*'+str(a.day)+r'\b', page.get_text()):
        ap.error('DAY label does not match selected PDF page')
    out = Path(a.output)
    out.mkdir(parents=True, exist_ok=True)
    entries = []
    for half, (x1, x2, right) in enumerate([(59.52,179.4,299.4),(327.72,446.28,564.84)]):
        for j in range(20):
            y = 104.64 + j * 33.96
            english = page.get_text('text', clip=fitz.Rect(x1+.5,y+.5,x2-.5,y+33.5), sort=True).strip()
            meaning = page.get_text('text', clip=fitz.Rect(x2+.5,y+.5,right-.5,y+33.5), sort=True).strip()
            entries.append({'no':half*20+j+1, 'english':english, 'rawPdfMeaning':meaning,
                            'pdfFirstMeaning':'', 'checked':False})
    review = {'format':'wm2000-source-review', 'schema':1, 'day':a.day, 'pdfPage':a.day,
              'htmlSha256':hashlib.sha256(Path(a.html).read_bytes()).hexdigest(),
              'pdfSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),
              'reviewer':'', 'reviewedAt':'', 'visuallyReviewed':False, 'entries':entries}
    (out / f'DAY{a.day}_review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
    page.get_pixmap(matrix=fitz.Matrix(2,2)).save(str(out / f'DAY{a.day}_page.png'))
    print(f'PRIVATE worksheet created for DAY {a.day}; visually confirm all 40 rows before building')

if __name__ == '__main__':
    main()
