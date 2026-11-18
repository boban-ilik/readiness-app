"""1.3 store frames: the redesign. Same frame design as build_final.py (its
TEMPLATE is reused) and, as in build_121.py, the status bar is the real iOS
one from the capture (App Review rejected a drawn one under 2.3.10). Only the
island pill is drawn, over the capture's own island gap.

A badge can carry a position override ("text|css"). A capture can be shifted up ("FILE|-440") to start lower on the screen. The
status bar then stays in place: it is the top strip of the same capture, laid
over the shifted image.

Raw captures and output live outside the repo:
  python3 build_130.py ~/Downloads ~/Downloads/readiness-store-screenshots-130
"""
import subprocess, os, pathlib, re, shutil, sys
S = pathlib.Path(__file__).parent
SRC = pathlib.Path(sys.argv[1]).expanduser()
OUT = pathlib.Path(sys.argv[2]).expanduser()
TEMPLATE = re.search(r'TEMPLATE = """(.*?)"""', (S / "build_final.py").read_text(), re.S).group(1)
TEMPLATE = re.sub(r'<div class="bar">.*?</div></div>\n', '__STRIP__<div class="bar"><div class="island"></div></div>\n', TEMPLATE, count=1, flags=re.S)
TEMPLATE = TEMPLATE.replace("</style>", ".bar{background:transparent}"
    ".sb{position:absolute;top:0;left:0;right:0;height:148px;overflow:hidden;background:#0D0F14}"
    ".sb img{display:block;width:1012px}</style>", 1)
assert "9:41" not in TEMPLATE and '<div class="icons">' not in TEMPLATE

# file, accent, eyebrow, headline, subline, callout html, callout position css, badge
FRAMES = [
 ("IMG_1223.PNG", "#7CB342", "READINESS COACH", "Your daily<br><b>readiness score</b>", "Built from your HRV, sleep and resting heart rate",
  None, "", "Works with<br><span>the watch</span><br>you already own|top:2370px"),
 ("IMG_1224.PNG", "#A78BFA", "MORNING BRIEFING", "A <b>briefing</b> written<br>from your numbers", "What happened overnight, and what to do today",
  '<div class="k">EVERY MORNING</div><div class="v" style="font-size:76px">Your data</div><div class="s">sleep, HRV, heart rate, training</div>', "left:150px;right:150px;max-width:none;text-align:center;padding:22px 44px;top:2556px;transform:rotate(-1.5deg)", None),
 ("IMG_1234.PNG|-440", "#4ADE80", "TODAY'S PLAN", "What to do <b>today</b>,<br>in three lines", "Training, food and water, set by your score",
  '<div class="k">STRONG WORKOUT DAY</div><div class="q">60 to 75 min</div><div class="s">effort 6 to 7 out of 10</div>', "left:150px;right:150px;max-width:none;text-align:center;top:2148px", None),
 ("IMG_1229.PNG", "#60A5FA", "SCORE BREAKDOWN", "<b>Recovery, sleep</b><br>and <b>stress</b> explained", "See exactly what went into today's score",
  '<div class="k">OPEN FORMULA</div><div class="v" style="font-size:76px">45 · 40 · 15</div><div class="s">recovery · sleep · stress</div>', "left:150px;right:150px;max-width:none;text-align:center;padding:22px 44px;top:2556px;transform:rotate(1.5deg)", None),
 ("IMG_1225.PNG", "#F5A623", "AI COACH", "An <b>AI coach</b> that<br>knows your numbers", "Ask why. Get an answer built on your own data.",
  '<div class="k">GROUNDED IN</div><div class="q">Your own data</div><div class="s">HRV, sleep, heart rate, training</div>', "left:150px;right:150px;max-width:none;text-align:center;top:1326px;transform:rotate(-1.5deg)", None),
 ("IMG_1243.PNG", "#FBBF24", "PERSONAL PATTERNS", "Find the <b>patterns</b><br>behind your good days", "Insights from your data, not generic advice",
  '<div class="k">YOUR DATA SAYS</div><div class="v" style="font-size:76px">+23 pts</div><div class="s">on nights with 7 hours of sleep or more</div>', "left:150px;right:150px;max-width:none;text-align:center;padding:22px 44px;top:2556px;transform:rotate(1.5deg)", None),
 ("IMG_1240.PNG", "#34D399", "HISTORY AND TRENDS", "Track your <b>HRV</b> and<br><b>recovery</b> trends", "7 and 28 day history, with CSV export",
  '<div class="k">TODAY</div><div class="v" style="font-size:76px">+20 vs avg</div><div class="s">against your 7-day average</div>', "left:150px;right:150px;max-width:none;text-align:center;padding:22px 44px;top:2498px", None),
 ("IMG_1237.PNG", "#F97316", "TRAINING LOAD", "Building, steady<br>or <b>overreaching</b>?", "This week's load from Strava, against your own average",
  '<div class="k">THIS WEEK</div><div class="v">Steady</div><div class="s">in line with your 4-week average</div>', "right:36px;top:2420px;transform:rotate(4deg)", None),
]

(OUT / "raw").mkdir(parents=True, exist_ok=True)
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if not os.path.exists(chrome): chrome = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
for i,(f,acc,eye,h,sub,chip,pos,badge) in enumerate(FRAMES,1):
    f,off = (f.split("|")+["0"])[:2]
    shutil.copy(SRC / f, OUT / "raw" / f)
    strip = f'<div class="sb"><img src="raw/{f}"></div>' if off != "0" else ""
    html = (TEMPLATE.replace("__ACCENT__",acc).replace("__EYEBROW__",eye).replace("__H1__",h).replace("__SUB__",sub).replace("__FILE__",f).replace("__OFF__",off)
            .replace("__STRIP__", strip)
            .replace("__CHIP__", f'<div class="chip" style="{pos}">{chip}</div>' if chip else "")
            .replace("__BADGE__", (lambda t, css="": f'<div class="badge" style="{css}"><div>{t}</div></div>')(*badge.split("|")) if badge else ""))
    hp = OUT / f"frame{i}.html"; hp.write_text(html)
    out = OUT / f"{i:02d}.png"
    subprocess.run([chrome,"--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1","--allow-file-access-from-files","--window-size=1284,2778",f"--screenshot={out}",f"file://{hp}"],capture_output=True)
    print(out.name, os.path.getsize(out))
