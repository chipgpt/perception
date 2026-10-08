from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
out=root/'site'
if out.exists():shutil.rmtree(out)
out.mkdir()
for name in ['index.html','focus.html','night-lab.html','studio.html','focus.css','night-lab.css','CNAME','.nojekyll']:shutil.copyfile(root/name,out/name)
shutil.copytree(root/'assets/fonts',out/'assets/fonts')
