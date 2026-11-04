"""1.2.1 store frames. Same design and captures as build_110.py, but the
status bar is the real iOS one from the capture: App Review rejected the
1.2.0 frames under 2.3.10 for the drawn "9:41" bar and icons. Only the
island pill stays, drawn over the capture's own island gap.

Raw captures and output live outside the repo:
  python3 build_121.py ~/Downloads ~/Downloads/readiness-store-screenshots-121
"""
import subprocess, os, pathlib, re, shutil, sys
S = pathlib.Path(__file__).parent
SRC = pathlib.Path(sys.argv[1]).expanduser()
OUT = pathlib.Path(sys.argv[2]).expanduser()
TEMPLATE = re.search(r'TEMPLATE = """(.*?)"""', (S / "build_final.py").read_text(), re.S).group(1)
TEMPLATE = re.sub(r'<div class="bar">.*?</div></div>\n', '<div class="bar"><div class="island"></div></div>\n', TEMPLATE, count=1, flags=re.S)
TEMPLATE = TEMPLATE.replace("</style>", ".bar{background:transparent}</style>", 1)
assert "9:41" not in TEMPLATE and '<div class="icons">' not in TEMPLATE
FRAMES = re.search(r'FRAMES = \[(.*?)\n\]', (S / "build_110.py").read_text(), re.S).group(0)
FRAMES = eval(FRAMES.split("=", 1)[1])

(OUT / "raw").mkdir(parents=True, exist_ok=True)
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if not os.path.exists(chrome): chrome = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
for i,(f,acc,eye,h,sub,chip,pos,badge) in enumerate(FRAMES,1):
    f,off = (f.split("|")+["0"])[:2]
    shutil.copy(SRC / f, OUT / "raw" / f)
    html = (TEMPLATE.replace("__ACCENT__",acc).replace("__EYEBROW__",eye).replace("__H1__",h).replace("__SUB__",sub).replace("__FILE__",f).replace("__OFF__",off)
            .replace("__CHIP__", f'<div class="chip" style="{pos}">{chip}</div>' if chip else "")
            .replace("__BADGE__", f'<div class="badge"><div>{badge}</div></div>' if badge else ""))
    hp = OUT / f"frame{i}.html"; hp.write_text(html)
    out = OUT / f"{i:02d}.png"
    subprocess.run([chrome,"--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1","--allow-file-access-from-files","--window-size=1284,2778",f"--screenshot={out}",f"file://{hp}"],capture_output=True)
    print(out.name, os.path.getsize(out))
