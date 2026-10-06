"""1.0.5 store frames. Same design as build_final.py (its TEMPLATE is reused).

Raw captures and output live outside the repo:
  python3 build_105.py ~/Downloads ~/Downloads/readiness-store-screenshots-105
"""
import subprocess, os, pathlib, re, shutil, sys
S = pathlib.Path(__file__).parent
SRC = pathlib.Path(sys.argv[1]).expanduser()
OUT = pathlib.Path(sys.argv[2]).expanduser()
TEMPLATE = re.search(r'TEMPLATE = """(.*?)"""', (S / "build_final.py").read_text(), re.S).group(1)

# file, accent, eyebrow, headline, subline, callout html, callout position css, badge
FRAMES = [
 ("IMG_0467.PNG", "#43A047", "READINESS COACH", "Your daily<br><b>readiness score</b>", "Built from your HRV, sleep and resting heart rate",
  None, "", "Works with<br><span>the watch</span><br>you already own"),
 ("IMG_0467.PNG|-420", "#60A5FA", "UNUSUAL FOR YOU", "It <b>asks</b> before<br>it judges", "An odd reading gets a question, not a warning",
  '<div class="k">INSTEAD OF A LABEL</div><div class="v">A question</div><div class="s">then a plain answer</div>', "right:36px;top:1180px;transform:rotate(4deg)", None),
 ("IMG_0474.PNG", "#A78BFA", "AI COACH", "An <b>AI coach</b> that<br>knows your numbers", "Ask why. Get an answer built on your own data.",
  '<div class="k">GROUNDED IN</div><div class="v">Your data</div><div class="s">HRV, sleep, heart rate, training</div>', "right:36px;top:2330px;transform:rotate(4deg)", None),
 ("IMG_0473.PNG", "#34D399", "TREND AND FORECAST", "See where your<br><b>readiness is heading</b>", "7 days measured, 3 days projected",
  '<div class="k">PROJECTED</div><div class="v">Next 3 days</div><div class="s">with the likely range shown</div>', "left:36px;top:2470px;transform:rotate(-4deg)", None),
 ("IMG_0470.PNG", "#60A5FA", "SCORE BREAKDOWN", "<b>Recovery, sleep</b><br>and <b>stress</b> explained", "See exactly what moved today's score",
  '<div class="k">OPEN FORMULA</div><div class="v">45 · 40 · 15</div><div class="s">recovery · sleep · stress</div>', "right:36px;top:2230px;transform:rotate(4deg)", None),
 ("IMG_0475.PNG", "#F5A623", "HISTORY &amp; TRENDS", "Track your <b>HRV</b> and<br><b>recovery</b> trends", "7 and 28 day history, with CSV export",
  '<div class="k">TODAY</div><div class="v">+6 vs avg</div><div class="s">against your 7-day average</div>', "left:36px;top:2040px;transform:rotate(-4deg)", None),
 ("IMG_0476.PNG", "#FBBF24", "PERSONAL PATTERNS", "Find the <b>patterns</b><br>behind your good days", "Insights from your data, not generic advice",
  '<div class="k">YOUR DATA SAYS</div><div class="v">+8 pts</div><div class="s">when resting HR stays low</div>', "left:36px;top:2330px;transform:rotate(-4deg)", None),
 ("IMG_0471.PNG", "#F97316", "DAILY NUTRITION", "<b>Nutrition</b> matched<br>to your recovery", "What to eat today, based on last night",
  '<div class="k">TODAY</div><div class="q">Eat to perform</div><div class="s">carbs, protein and timing</div>', "right:36px;top:2330px;transform:rotate(4deg)", None),
]

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
