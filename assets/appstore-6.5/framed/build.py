import subprocess, os, pathlib, sys
S = pathlib.Path(__file__).parent
FRAMES = [
  # file, headline (use <b> for the amber words), subline, badge or None
  ("IMG_0285.PNG", "Your daily<br><b>readiness score</b>", "Built from your HRV, sleep and resting heart rate", "Works with<br><span>the watch</span><br>you already own"),
  ("IMG_0289.PNG", "An <b>AI coach</b> that<br>knows your numbers", "Ask why. Get an answer built on your own data.", None),
  ("IMG_0286.PNG", "<b>Recovery, sleep</b><br>and <b>stress</b> explained", "See exactly what moved today's score", None),
  ("IMG_0290.PNG", "Track your <b>HRV</b> and<br><b>recovery</b> trends", "7 and 28 day history, with CSV export", None),
  ("IMG_0291.PNG", "Find the <b>patterns</b><br>behind your good days", "Insights from your data, not generic advice", None),
  ("IMG_0287.PNG", "<b>Nutrition</b> matched<br>to your recovery", "Hydration and protein scaled to your body", None),
]
TEMPLATE = """<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1284px;height:2778px;overflow:hidden}
body{font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif;color:#F0F2F8;
  background:
    radial-gradient(900px 700px at 50% 30%, rgba(245,166,35,.20), rgba(245,166,35,0) 70%),
    linear-gradient(180deg,#1A2033 0%,#10131C 45%,#0B0D12 100%);}
.head{position:absolute;top:150px;left:90px;right:90px;text-align:center}
h1{font-size:104px;line-height:1.08;font-weight:800;letter-spacing:-2.5px}
h1 b{color:#F5A623;font-weight:800}
p{margin-top:34px;font-size:46px;line-height:1.3;color:#A9B1C6;font-weight:500}
.phone{position:absolute;top:640px;left:50%;transform:translateX(-50%);width:1064px;padding:26px;
  border-radius:150px;background:linear-gradient(145deg,#3A4058,#15182370 40%,#0A0C11);
  box-shadow:0 60px 140px rgba(0,0,0,.65),0 0 0 3px #2A3050 inset}
.screen{position:relative;width:1012px;border-radius:126px;overflow:hidden;background:#0D0F14}
.screen img{display:block;width:1012px}
.bar{position:absolute;top:0;left:0;right:0;height:128px;background:#0D0F14;display:flex;align-items:center;
  justify-content:space-between;padding:22px 84px 0;font-size:40px;font-weight:600;color:#F0F2F8}
.island{position:absolute;top:30px;left:50%;transform:translateX(-50%);width:300px;height:86px;border-radius:50px;background:#000}
.icons{display:flex;gap:14px;align-items:center}
.badge{position:absolute;right:70px;top:1830px;width:400px;height:400px;border-radius:50%;background:#F5A623;color:#0D0F14;
  display:flex;align-items:center;justify-content:center;text-align:center;font-size:44px;line-height:1.15;font-weight:700;
  box-shadow:0 30px 80px rgba(0,0,0,.55)}
.badge span{font-size:60px;font-weight:800}
</style></head><body>
<div class="head"><h1>__H1__</h1><p>__SUB__</p></div>
<div class="phone"><div class="screen"><img src="raw/__FILE__">
  <div class="bar"><span>9:41</span><div class="island"></div>
    <div class="icons">
      <svg width="50" height="34" viewBox="0 0 50 34"><rect x="0" y="22" width="9" height="12" rx="2" fill="#F0F2F8"/><rect x="13" y="15" width="9" height="19" rx="2" fill="#F0F2F8"/><rect x="26" y="8" width="9" height="26" rx="2" fill="#F0F2F8"/><rect x="39" y="0" width="9" height="34" rx="2" fill="#F0F2F8"/></svg>
      <svg width="48" height="34" viewBox="0 0 48 34"><path d="M24 30l7-8a10 10 0 0 0-14 0z" fill="#F0F2F8"/><path d="M8 13a23 23 0 0 1 32 0" stroke="#F0F2F8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 20a14 14 0 0 1 20 0" stroke="#F0F2F8" stroke-width="5" fill="none" stroke-linecap="round"/></svg>
      <svg width="74" height="34" viewBox="0 0 74 34"><rect x="1.5" y="1.5" width="62" height="31" rx="9" stroke="#F0F2F8" stroke-opacity=".5" stroke-width="3" fill="none"/><rect x="6" y="6" width="53" height="22" rx="5" fill="#F0F2F8"/><rect x="67" y="11" width="5" height="12" rx="2" fill="#F0F2F8" fill-opacity=".5"/></svg>
    </div></div>
</div></div>
__BADGE__
</body></html>"""
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if not os.path.exists(chrome): chrome = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
for i,(f,h,sub,badge) in enumerate(FRAMES,1):
    html = TEMPLATE.replace("__H1__",h).replace("__SUB__",sub).replace("__FILE__",f).replace("__BADGE__", f'<div class="badge"><div>{badge}</div></div>' if badge else "")
    hp = S/f"frame{i}.html"; hp.write_text(html)
    out = S/"out"/f"{i:02d}.png"
    subprocess.run([chrome,"--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1","--allow-file-access-from-files","--window-size=1284,2778",f"--screenshot={out}",f"file://{hp}"],capture_output=True)
    print(out.name, os.path.getsize(out))
