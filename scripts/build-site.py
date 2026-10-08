from pathlib import Path
import os, runpy, sys
os.chdir(Path(__file__).resolve().parents[1])
sys.path.insert(0,str(Path('src/design-options').resolve()))
runpy.run_path('src/design-options/build-options.py',run_name='__main__')
