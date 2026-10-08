from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
out=root/'site'
if out.exists():shutil.rmtree(out)
# Publish public/ at the domain root, preserving existing URLs and assets.
shutil.copytree(root/'public',out)
