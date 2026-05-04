#!/usr/bin/env node

var path = require("path");
var fs = require("fs");
var http = require("http");

// Load env
[".env", ".env.local"].forEach(function (f) {
  var fp = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(fp)) return;
  fs.readFileSync(fp, "utf8").split("\n").forEach(function (line) {
    var m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
});

var PrismaClient = require("@prisma/client").PrismaClient;

var VALID_DOMAINS = [
  "dawsoncollege.qc.ca","edu.vaniercollege.qc.ca","johnabbottcollege.net",
  "marianopolis.edu","bdeb.qc.ca","cmaisonneuve.qc.ca","crosemont.qc.ca",
  "claurendeau.qc.ca","cstlaurent.qc.ca","etu.cvm.qc.ca",
  "cgodin.qc.ca","cmvictorin.qc.ca","grasset.qc.ca","brebeuf.qc.ca",
  "lasallecollege.com","tav.ca","osullivan.edu",
  "mail.mcgill.ca","mcgill.ca",
  "live.concordia.ca","mail.concordia.ca","concordia.ca",
  "umontreal.ca","hec.ca","polymtl.ca","uqam.ca","courrier.uqam.ca",
  "cmontmorency.qc.ca",
  "champlaincollege.qc.ca","stu.champlaincollege.qc.ca",
  "cegepmontpetit.ca","cstjean.qc.ca",
  "clg.qc.ca","edu.clg.qc.ca","cstjerome.qc.ca","cegep-lanaudiere.qc.ca",
  "colval.qc.ca"
];

function isSuspect(email) {
  if (!email) return true;
  var domain = email.split("@")[1];
  if (!domain) return true;
  domain = domain.toLowerCase();
  for (var i = 0; i < VALID_DOMAINS.length; i++) {
    if (domain === VALID_DOMAINS[i] || domain.endsWith("." + VALID_DOMAINS[i])) return false;
  }
  return true;
}

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function pct(n,d){return d?Math.round(n/d*100):0;}

var PORT = 3456;

function buildPage(users) {
  var total = users.length;
  var verified = users.filter(function(u){return u.phoneVerified}).length;
  var onboarded = users.filter(function(u){return u.onboardingComplete}).length;
  var withPhoto = users.filter(function(u){return u.photoUrl}).length;
  var suspectList = users.filter(function(u){return isSuspect(u.email)});
  var verifiedUsers = users.filter(function(u){return u.phoneVerified});

  var genders = {};
  verifiedUsers.forEach(function(u){ var g=u.gender||"Unknown"; genders[g]=(genders[g]||0)+1; });
  var schools = {};
  verifiedUsers.forEach(function(u){ var s=u.school||"Unknown"; schools[s]=(schools[s]||0)+1; });
  var ages = {};
  verifiedUsers.forEach(function(u){ var a=u.age||"?"; ages[a]=(ages[a]||0)+1; });
  var prefs = {};
  verifiedUsers.forEach(function(u){ var pr=u.genderPreference||"Unknown"; prefs[pr]=(prefs[pr]||0)+1; });

  var refCounts = {};
  users.forEach(function(u){
    if(u.referredBy){
      if(!refCounts[u.referredBy]) refCounts[u.referredBy]={total:0,verified:0};
      refCounts[u.referredBy].total++;
      if(u.phoneVerified) refCounts[u.referredBy].verified++;
    }
  });
  var referrers = Object.keys(refCounts).map(function(code){
    var c=refCounts[code];
    var owner=users.find(function(u){return u.referralCode===code});
    return {code:code,name:owner?owner.firstName:"?",email:owner?owner.email:"?",verified:c.verified,total:c.total};
  }).sort(function(a,b){return b.verified-a.verified});

  var sortedSchools = Object.entries(schools).sort(function(a,b){return b[1]-a[1]});
  var sortedAges = Object.entries(ages).sort(function(a,b){return a[0]-b[0]});

  var genderColors = {Man:"#7c9a6e",Woman:"#d4a574","Non-binary":"#8b7ec8",Other:"#e8a87c"};

  var clientUsers = users.map(function(u){
    return {
      id:u.id,
      n:u.firstName||"",e:u.email||"",s:u.school||"",a:u.age||0,
      g:u.gender||"",gp:u.genderPreference||"",pv:u.phoneVerified,
      pn:u.phoneNumber||"",oc:u.onboardingComplete,ph:u.photoUrl||"",
      rc:u.referralCode||"",rb:u.referredBy||"",
      int:u.intentions||"",vi:u.vibe||"",
      is:(u.interests||[]).join(", "),
      dt:new Date(u.createdAt).toLocaleDateString("en-CA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),
      sus:isSuspect(u.email)
    };
  });

  // Stats
  var statsHtml = '<div class="grid">';
  statsHtml += '<div class="sc"><div class="sl">Total Signups</div><div class="sv">'+total+'</div></div>';
  statsHtml += '<div class="sc"><div class="sl">Phone Verified</div><div class="sv">'+verified+'</div><div class="ss">'+pct(verified,total)+'%</div></div>';
  statsHtml += '<div class="sc"><div class="sl">Onboarding Done</div><div class="sv">'+onboarded+'</div><div class="ss">'+pct(onboarded,total)+'%</div></div>';
  statsHtml += '<div class="sc"><div class="sl">With Photo</div><div class="sv">'+withPhoto+'</div><div class="ss">'+pct(withPhoto,total)+'%</div></div>';
  statsHtml += '<div class="sc"><div class="sl">Suspect Emails</div><div class="sv" style="color:#b91c1c">'+suspectList.length+'</div></div>';
  statsHtml += '<div class="sc"><div class="sl">Drop-offs</div><div class="sv">'+(total-verified)+'</div><div class="ss">'+pct(total-verified,total)+'%</div></div>';
  statsHtml += '</div>';

  // Charts
  var chartsHtml = '<div class="charts">';
  chartsHtml += '<div class="cc"><h3>Gender (verified)</h3>';
  Object.entries(genders).sort(function(a,b){return b[1]-a[1]}).forEach(function(e){
    chartsHtml+='<div class="dr"><div class="dc" style="background:'+(genderColors[e[0]]||"#bbb")+'"></div><div class="dl">'+esc(e[0])+'</div><div class="dv">'+e[1]+' ('+pct(e[1],verified)+'%)</div></div>';
  });
  chartsHtml += '</div>';
  chartsHtml += '<div class="cc"><h3>Looking For</h3>';
  Object.entries(prefs).sort(function(a,b){return b[1]-a[1]}).forEach(function(e){
    chartsHtml+='<div class="dr"><div class="dc" style="background:#a3b899"></div><div class="dl">'+esc(e[0])+'</div><div class="dv">'+e[1]+' ('+pct(e[1],verified)+'%)</div></div>';
  });
  chartsHtml += '</div>';
  chartsHtml += '<div class="cc"><h3>Age</h3>';
  sortedAges.forEach(function(e){
    chartsHtml+='<div class="bw"><div class="bl">'+e[0]+'</div><div class="bar" style="width:'+Math.max(pct(e[1],verified)*3,4)+'px"></div><div class="bc">'+e[1]+'</div></div>';
  });
  chartsHtml += '</div>';
  chartsHtml += '<div class="cc"><h3>Schools</h3>';
  sortedSchools.forEach(function(e){
    chartsHtml+='<div class="bw"><div class="bl" style="min-width:160px">'+esc(e[0])+'</div><div class="bar" style="width:'+Math.max(pct(e[1],verified)*2.5,4)+'px"></div><div class="bc">'+e[1]+' ('+pct(e[1],verified)+'%)</div></div>';
  });
  chartsHtml += '</div></div>';

  // Referrers
  var refHtml = '<div class="sec"><h2>Top Referrers</h2><table><thead><tr><th>Name</th><th>Email</th><th>Code</th><th>Verified</th><th>Total</th></tr></thead><tbody>';
  referrers.forEach(function(r){
    refHtml+='<tr><td><b>'+esc(r.name)+'</b></td><td>'+esc(r.email)+'</td><td><code>'+esc(r.code)+'</code></td><td><span class="bg">'+r.verified+'</span></td><td>'+r.total+'</td></tr>';
  });
  refHtml += '</tbody></table></div>';

  // Suspect
  var susHtml = '';
  if(suspectList.length){
    susHtml='<div class="sec"><h2>Suspect Emails ('+suspectList.length+')</h2><table><thead><tr><th>Name</th><th>Email</th><th>School</th><th>Verified</th></tr></thead><tbody>';
    suspectList.forEach(function(u){
      susHtml+='<tr class="yellow"><td>'+esc(u.firstName||"")+'</td><td>'+esc(u.email)+'</td><td>'+esc(u.school||"")+'</td><td>'+(u.phoneVerified?'<span class="bg">Yes</span>':'<span class="br">No</span>')+'</td></tr>';
    });
    susHtml+='</tbody></table></div>';
  }

  // User cards
  var cardsHtml = '<div class="sec"><h2>All Users ('+total+')</h2>';
  cardsHtml += '<div class="ug">';
  users.forEach(function(u,i){
    var s=isSuspect(u.email);
    cardsHtml+='<div class="uc'+(s?" yellow":"")+'" data-i="'+i+'">';
    if(u.photoUrl) cardsHtml+='<img class="cp" src="'+esc(u.photoUrl)+'" loading="lazy">';
    else cardsHtml+='<div class="cnp">'+esc((u.firstName||"?")[0])+'</div>';
    cardsHtml+='<div class="cn">'+esc(u.firstName||"?")+'</div>';
    cardsHtml+='<div class="cs">'+esc(u.school||"")+'</div>';
    cardsHtml+='<div class="cb">'+(u.phoneVerified?'<span class="bg">phone</span>':'<span class="br">no phone</span>')+(s?'<span class="by">suspect</span>':'')+'</div>';
    cardsHtml+='</div>';
  });
  cardsHtml+='</div></div>';

  var safeJson = JSON.stringify(clientUsers).replace(/<\//g,"<\\/");

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daisy Admin</title><style>';
  html += '*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8f7f4;color:#2c2c2c;padding:24px;max-width:1400px;margin:0 auto}';
  html += '.hdr{display:flex;align-items:center;gap:16px;margin-bottom:4px}';
  html += 'h1{font-size:28px}.sub{color:#888;font-size:14px;margin-bottom:32px}';
  html += '.rbtn{padding:8px 18px;border-radius:10px;border:1px solid #a3b899;background:#f0f5ed;color:#2c2c2c;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s}.rbtn:hover{background:#e2ecdb}';
  html += '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px}';
  html += '.sc{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.sl{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}.sv{font-size:32px;font-weight:700}.ss{font-size:12px;color:#aaa;margin-top:4px}';
  html += '.charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-bottom:32px}';
  html += '.cc{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.cc h3{font-size:14px;margin-bottom:14px;color:#555}';
  html += '.dr{display:flex;align-items:center;gap:16px;margin-bottom:8px}.dc{width:12px;height:12px;border-radius:3px;flex-shrink:0}.dl{font-size:13px;flex:1}.dv{font-size:13px;font-weight:600}';
  html += '.bw{display:flex;align-items:center;gap:8px}.bar{height:18px;border-radius:4px;background:#a3b899;min-width:2px}.bl{font-size:12px;color:#666;white-space:nowrap}.bc{font-size:12px;font-weight:600;min-width:24px}';
  html += '.sec{margin-bottom:32px}.sec h2{font-size:18px;margin-bottom:12px;border-bottom:1px solid #e5e5e5;padding-bottom:8px}';
  html += 'table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}';
  html += 'th{background:#fafaf8;text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:.5px}';
  html += 'td{padding:10px 14px;border-top:1px solid #f0f0f0;font-size:13px}';
  html += '.bg{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#dcfce7;color:#166534}';
  html += '.br{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#fee2e2;color:#991b1b}';
  html += '.by{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#fef9c3;color:#854d0e;margin-left:4px}';
  html += '.yellow{background:#fff3cd}';
  html += '.ug{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}';
  html += '.uc{background:#fff;border-radius:12px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);cursor:pointer;transition:transform .15s;text-align:center}';
  html += '.uc:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}';
  html += '.cp{width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 8px;display:block}';
  html += '.cnp{width:80px;height:80px;border-radius:50%;background:#e8e8e8;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#bbb}';
  html += '.cn{font-weight:600;font-size:14px;margin-bottom:2px}.cs{font-size:11px;color:#888;margin-bottom:4px}.cb{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}';
  html += '#overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:1000}';
  html += '#overlay.on{display:flex}';
  html += '#modal{background:#111;border-radius:16px;width:420px;height:88vh;position:relative;display:flex;flex-direction:column;overflow:hidden}';
  html += '#modal .mphoto{flex:1;min-height:0;position:relative;overflow:hidden}';
  html += '#modal .mphoto img{width:100%;height:100%;object-fit:cover;display:block}';
  html += '#modal .mphoto .mnp{width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;font-size:80px;color:#555}';
  html += '#modal .minfo{background:#fff;padding:16px 20px 14px;flex-shrink:0}';
  html += '#modal .minfo h2{font-size:20px;margin-bottom:2px}#modal .minfo .msub{color:#888;font-size:12px;margin-bottom:10px}';
  html += '.ig{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 12px}.il{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.4px}.iv{font-size:12px;font-weight:500;margin-bottom:4px}';
  html += '.mcnt{font-size:12px;color:#999;text-align:center;margin-top:4px}';
  html += '.xbtn{position:absolute;top:10px;right:14px;font-size:28px;cursor:pointer;color:#fff;background:rgba(0,0,0,.4);border:none;z-index:10;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center}';
  html += '.arw{position:absolute;top:50%;transform:translateY(-50%);font-size:28px;color:#fff;background:rgba(0,0,0,.35);border:none;cursor:pointer;z-index:10;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center}.arw:hover{background:rgba(0,0,0,.6)}';
  html += '.arw.l{left:10px}.arw.r{right:10px}';
  html += '.startbtn{margin-bottom:16px;padding:10px 24px;border-radius:10px;border:1px solid #a3b899;background:#f0f5ed;color:#2c2c2c;font-size:15px;font-weight:600;cursor:pointer}';
  html += '.dangerbtn{margin-top:12px;width:100%;padding:10px 12px;border-radius:10px;border:1px solid #ef4444;background:#fee2e2;color:#991b1b;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s}.dangerbtn:hover{background:#fecaca}.dangerbtn:disabled{opacity:.7;cursor:not-allowed}';
  html += '</style></head><body>';
  html += '<div class="hdr"><h1>Daisy Admin Dashboard</h1><button class="rbtn" onclick="location.reload()">Refresh Data</button></div>';
  html += '<p class="sub">Generated ' + new Date().toLocaleString() + '</p>';
  html += statsHtml + chartsHtml + refHtml + susHtml;
  html += '<button class="startbtn" id="startBtn">Start viewing profiles</button>';
  html += cardsHtml;
  html += '<div id="overlay"><div id="modal"></div></div>';
  html += '<script>var U=' + safeJson + ';var ci=0;';
  html += 'function show(i){ci=i;var u=U[ci];var m=document.getElementById("modal");';
  html += 'var ph=u.ph?"<img src=\\""+u.ph+"\\">":" <div class=mnp>"+u.n[0]+"<\\/div>";';
  html += 'var rb=u.rb;if(rb){var ow=U.find(function(x){return x.rc===rb});if(ow)rb=ow.n+" ("+rb+")"}else{rb="\\u2014"}';
  html += 'var h="<div class=mphoto><button class=\\"arw l\\" id=pb>\\u2190<\\/button><button class=\\"arw r\\" id=nb>\\u2192<\\/button><button class=xbtn id=xb>\\u00d7<\\/button>"+ph+"<\\/div>";';
  html += 'h+="<div class=minfo><h2>"+u.n+", "+u.a+(u.sus?" <span class=by>suspect<\\/span>":"")+"<\\/h2>";';
  html += 'h+="<div class=msub>"+u.e+" \\u00b7 "+u.s+" \\u00b7 "+u.g+" \\u2192 "+u.gp+"<\\/div><div class=ig>";';
  html += 'h+="<div><div class=il>Intentions<\\/div><div class=iv>"+u.int+"<\\/div><\\/div>";';
  html += 'h+="<div><div class=il>Vibe<\\/div><div class=iv>"+u.vi+"<\\/div><\\/div>";';
  html += 'h+="<div><div class=il>Interests<\\/div><div class=iv>"+u.is+"<\\/div><\\/div>";';
  html += 'h+="<div><div class=il>Phone<\\/div><div class=iv>"+(u.pv?"\\u2713 "+u.pn:"\\u2717 no")+"<\\/div><\\/div>";';
  html += 'h+="<div><div class=il>Referral<\\/div><div class=iv>"+u.rc+"<\\/div><\\/div>";';
  html += 'h+="<div><div class=il>Referred By<\\/div><div class=iv>"+rb+"<\\/div><\\/div>";';
  html += 'h+="<\\/div><button class=dangerbtn id=delb>Delete user<\\/button><div class=mcnt>"+(ci+1)+" \\/ "+U.length+" \\u00b7 "+u.dt+"<\\/div><\\/div>";';
  html += 'm.innerHTML=h;';
  html += 'document.getElementById("pb").onclick=function(e){e.stopPropagation();show((ci-1+U.length)%U.length)};';
  html += 'document.getElementById("nb").onclick=function(e){e.stopPropagation();show((ci+1)%U.length)};';
  html += 'document.getElementById("xb").onclick=function(e){e.stopPropagation();document.getElementById("overlay").className=""};';
  html += 'document.getElementById("delb").onclick=function(e){e.stopPropagation();if(!confirm("Delete "+u.n+" ("+u.e+")? This cannot be undone."))return;var b=this;b.disabled=true;b.textContent="Deleting...";fetch("/delete-user",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:u.id})}).then(function(r){if(!r.ok)return r.json().then(function(x){throw new Error(x.error||"Delete failed")});return r.json()}).then(function(){location.reload()}).catch(function(err){alert(err.message||"Failed to delete user");b.disabled=false;b.textContent="Delete user"})};';
  html += 'document.getElementById("overlay").className="on";}';
  html += 'document.getElementById("startBtn").onclick=function(){show(0)};';
  html += 'document.addEventListener("click",function(e){var c=e.target;while(c&&c!==document){if(c.getAttribute&&c.getAttribute("data-i")!==null){show(parseInt(c.getAttribute("data-i")));return}c=c.parentNode}});';
  html += 'document.getElementById("overlay").onclick=function(e){if(e.target===this)this.className=""};';
  html += 'document.onkeydown=function(e){if(document.getElementById("overlay").className!=="on")return;if(e.key==="Escape")document.getElementById("overlay").className="";if(e.key==="ArrowLeft")show((ci-1+U.length)%U.length);if(e.key==="ArrowRight")show((ci+1)%U.length)};';
  html += '<\/script></body></html>';

  return html;
}

var server = http.createServer(function(req, res) {
  if (req.url === "/favicon.ico") { res.writeHead(204); res.end(); return; }

  if (req.url === "/delete-user" && req.method === "POST") {
    var body = "";
    req.on("data", function(chunk) {
      body += chunk;
      if (body.length > 1e6) req.socket.destroy();
    });
    req.on("end", function() {
      var payload;
      try {
        payload = JSON.parse(body || "{}");
      } catch (e) {
        res.writeHead(400, {"Content-Type":"application/json"});
        res.end(JSON.stringify({error:"Invalid JSON"}));
        return;
      }

      if (!payload.id) {
        res.writeHead(400, {"Content-Type":"application/json"});
        res.end(JSON.stringify({error:"Missing user id"}));
        return;
      }

      var prisma = new PrismaClient();
      prisma.user.delete({ where: { id: payload.id } }).then(function() {
        prisma.$disconnect();
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ok:true}));
      }).catch(function(err) {
        prisma.$disconnect();
        res.writeHead(500, {"Content-Type":"application/json"});
        res.end(JSON.stringify({error:err.message || "Failed to delete user"}));
      });
    });
    return;
  }

  if (req.url !== "/" || req.method !== "GET") {
    res.writeHead(404);
    res.end();
    return;
  }

  var prisma = new PrismaClient();
  prisma.user.findMany({
    select: {
      id:true,email:true,firstName:true,school:true,age:true,
      gender:true,genderPreference:true,phoneNumber:true,
      phoneVerified:true,photoUrl:true,onboardingComplete:true,
      referralCode:true,referredBy:true,createdAt:true,
      intentions:true,vibe:true,interests:true
    },
    orderBy: { createdAt: "desc" }
  }).then(function(users) {
    prisma.$disconnect();
    var html = buildPage(users);
    res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
    res.end(html);
  }).catch(function(err) {
    prisma.$disconnect();
    res.writeHead(500, {"Content-Type":"text/plain"});
    res.end("Error: " + err.message);
  });
});

server.listen(PORT, function() {
  console.log("Dashboard running at http://localhost:" + PORT);
  try { require("child_process").execSync("open http://localhost:" + PORT); } catch(e){}
});
