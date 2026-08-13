from pathlib import Path
p = Path('src/routes/planos.tsx')
s = p.read_text()
anchor = 'import { getCommercialAvailability } from "@/lib/commercial.functions";'
if 'import { openImpulsionito } from "@/lib/impulsionito-tracking";' not in s:
    if anchor not in s:
        raise RuntimeError('commercial import anchor missing')
    s = s.replace(anchor, anchor + '\nimport { openImpulsionito } from "@/lib/impulsionito-tracking";', 1)
p.write_text(s)
for tmp in ['scripts/tmp_fix_planos_fallback_import.py', '.github/workflows/tmp-fix-planos-fallback-import.yml']:
    path = Path(tmp)
    if path.exists():
        path.unlink()
