import subprocess, os, pathlib
S = pathlib.Path(__file__).parent
# file, accent, eyebrow, headline, subline, callout html, callout position css, badge
FRAMES = [
 ("IMG_0306.PNG", "#7CB342", "READINESS COACH", "Your daily<br><b>readiness score</b>", "Built from your HRV, sleep and resting heart rate",
  None, "", "Works with<br><span>the watch</span><br>you already own"),
 ("IMG_0310.PNG", "#A78BFA", "AI COACH", "An <b>AI coach</b> that<br>knows your numbers", "Ask why. Get an answer built on your own data.",
  '<div class="k">GROUNDED IN</div><div class="v">Your data</div><div class="s">HRV, sleep, heart rate, training</div>', "right:36px;top:1720px;transform:rotate(4deg)", None),
 ("IMG_0307.PNG", "#60A5FA", "SCORE BREAKDOWN", "<b>Recovery, sleep</b><br>and <b>stress</b> explained", "See exactly what moved today's score",
  '<div class="k">OPEN FORMULA</div><div class="v">45 · 40 · 15</div><div class="s">recovery · sleep · stress</div>', "left:36px;top:1060px;transform:rotate(-4deg)", None),
 ("IMG_0309.PNG", "#34D399", "3-DAY FORECAST", "Know your <b>best day</b><br>before it arrives", "Plan hard sessions around your readiness forecast",
  '<div class="k">TOMORROW</div><div class="v">73 · Ready</div><div class="s">plan your hardest work here</div>', "left:36px;top:1010px;transform:rotate(-4deg)", None),
 ("IMG_0311.PNG", "#F5A623", "HISTORY &amp; TRENDS", "Track your <b>HRV</b> and<br><b>recovery</b> trends", "7 and 28 day history, with CSV export",
  '<div class="k">THIS WEEK</div><div class="v">+15 vs avg</div><div class="s">today against your 7-day average</div>', "left:36px;top:2010px;transform:rotate(-4deg)", None),
 ("IMG_0313.PNG|-300", "#FBBF24", "PERSONAL PATTERNS", "Find the <b>patterns</b><br>behind your good days", "Insights from your data, not generic advice",
  '<div class="k">YOUR DATA SAYS</div><div class="v">+10 pts</div><div class="s">when resting HR stays low</div>', "left:36px;top:1040px;transform:rotate(-4deg)", None),
 ("IMG_0308.PNG", "#F97316", "DAILY NUTRITION", "<b>Nutrition</b> matched<br>to your recovery", "Hydration and protein scaled to your body",
  '<div class="k">TODAY</div><div class="v">3.1 L · 160 g</div><div class="s">water · protein</div>', "right:36px;top:1500px;transform:rotate(4deg)", None),
]
TEMPLATE = """<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1284px;height:2778px;overflow:hidden}
body{--a:__ACCENT__;font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif;color:#F0F2F8;
  background:
    radial-gradient(1000px 760px at 50% 27%, color-mix(in srgb, var(--a) 26%, transparent), transparent 70%),
    linear-gradient(180deg,#1A2033 0%,#10131C 45%,#0B0D12 100%);}
.arc{position:absolute;left:50%;top:612px;width:1720px;height:1720px;transform:translateX(-50%) rotate(-38deg);border-radius:50%;
  background:conic-gradient(from 0deg, var(--a) 0deg, color-mix(in srgb, var(--a) 0%, transparent) 250deg, transparent 360deg);
  -webkit-mask:radial-gradient(circle, transparent 0 822px, #000 824px 858px, transparent 860px);opacity:.42}
.head{position:absolute;top:108px;left:80px;right:80px;text-align:center}
.eyebrow{display:inline-block;padding:14px 34px;border-radius:999px;border:2px solid color-mix(in srgb, var(--a) 55%, transparent);
  color:var(--a);font-size:32px;font-weight:700;letter-spacing:6px;margin-bottom:40px;background:color-mix(in srgb, var(--a) 10%, transparent)}
h1{font-size:104px;line-height:1.08;font-weight:800;letter-spacing:-2.5px}
h1 b{color:#F5A623;font-weight:800}
p{margin-top:32px;font-size:46px;line-height:1.3;color:#A9B1C6;font-weight:500}
.phone{position:absolute;top:720px;left:50%;transform:translateX(-50%);width:1064px;padding:26px;
  border-radius:150px;background:linear-gradient(145deg,#3A4058,#15182370 40%,#0A0C11);
  box-shadow:0 60px 140px rgba(0,0,0,.65),0 0 0 3px #2A3050 inset, 0 0 120px color-mix(in srgb, var(--a) 18%, transparent)}
.screen{position:relative;width:1012px;border-radius:126px;overflow:hidden;background:#0D0F14}
.screen img{display:block;width:1012px}
.bar{position:absolute;top:0;left:0;right:0;height:128px;background:#0D0F14;display:flex;align-items:center;
  justify-content:space-between;padding:22px 84px 0;font-size:40px;font-weight:600}
.island{position:absolute;top:30px;left:50%;transform:translateX(-50%);width:300px;height:86px;border-radius:50px;background:#000}
.icons{display:flex;gap:14px;align-items:center}
.chip{position:absolute;padding:34px 44px;border-radius:44px;background:#1C2030;border:3px solid color-mix(in srgb, var(--a) 70%, transparent);
  box-shadow:0 40px 90px rgba(0,0,0,.7), 0 0 60px color-mix(in srgb, var(--a) 22%, transparent);max-width:620px}
.chip .k{font-size:28px;font-weight:700;letter-spacing:5px;color:var(--a)}
.chip .v{font-size:92px;font-weight:800;letter-spacing:-2px;line-height:1.1;margin-top:6px}
.chip .s{font-size:34px;color:#A9B1C6;font-weight:500;margin-top:4px}
.chip .q{font-size:52px;font-weight:700;line-height:1.2}
.badge{position:absolute;right:56px;top:2240px;width:400px;height:400px;border-radius:50%;background:#F5A623;color:#0D0F14;
  display:flex;align-items:center;justify-content:center;text-align:center;font-size:44px;line-height:1.15;font-weight:700;
  box-shadow:0 30px 80px rgba(0,0,0,.6);transform:rotate(6deg)}
.badge span{font-size:60px;font-weight:800}
</style></head><body>
<div class="arc"></div>
<div class="head"><div class="eyebrow">__EYEBROW__</div><h1>__H1__</h1><p>__SUB__</p></div>
<div class="phone"><div class="screen"><img src="raw/__FILE__" style="margin-top:__OFF__px">
  <div class="bar"><span>9:41</span><div class="island"></div>
    <div class="icons">
      <svg width="50" height="34" viewBox="0 0 50 34"><rect x="0" y="22" width="9" height="12" rx="2" fill="#F0F2F8"/><rect x="13" y="15" width="9" height="19" rx="2" fill="#F0F2F8"/><rect x="26" y="8" width="9" height="26" rx="2" fill="#F0F2F8"/><rect x="39" y="0" width="9" height="34" rx="2" fill="#F0F2F8"/></svg>
      <svg width="48" height="34" viewBox="0 0 48 34"><path d="M24 30l7-8a10 10 0 0 0-14 0z" fill="#F0F2F8"/><path d="M8 13a23 23 0 0 1 32 0" stroke="#F0F2F8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 20a14 14 0 0 1 20 0" stroke="#F0F2F8" stroke-width="5" fill="none" stroke-linecap="round"/></svg>
      <svg width="74" height="34" viewBox="0 0 74 34"><rect x="1.5" y="1.5" width="62" height="31" rx="9" stroke="#F0F2F8" stroke-opacity=".5" stroke-width="3" fill="none"/><rect x="6" y="6" width="53" height="22" rx="5" fill="#F0F2F8"/><rect x="67" y="11" width="5" height="12" rx="2" fill="#F0F2F8" fill-opacity=".5"/></svg>
    </div></div>
</div></div>
__CHIP____BADGE__
</body></html>"""
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if not os.path.exists(chrome): chrome = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
for i,(f,acc,eye,h,sub,chip,pos,badge) in enumerate(FRAMES,1):
    f,off = (f.split("|")+["0"])[:2]
    html = (TEMPLATE.replace("__ACCENT__",acc).replace("__EYEBROW__",eye).replace("__H1__",h).replace("__SUB__",sub).replace("__FILE__",f).replace("__OFF__",off)
            .replace("__CHIP__", f'<div class="chip" style="{pos}">{chip}</div>' if chip else "")
            .replace("__BADGE__", f'<div class="badge"><div>{badge}</div></div>' if badge else ""))
    hp = S/f"v2_frame{i}.html"; hp.write_text(html)
    out = S/"final"/f"{i:02d}.png"
    subprocess.run([chrome,"--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1","--allow-file-access-from-files","--window-size=1284,2778",f"--screenshot={out}",f"file://{hp}"],capture_output=True)
    print(out.name, os.path.getsize(out))
