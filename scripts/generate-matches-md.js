#!/usr/bin/env node
/**
 * Generates ../matches.md from live DB — read-only, no Match rows created.
 * Run: node scripts/generate-matches-md.js
 *
 * Product rules (Apr 2026): see header block in matches.md output.
 */

var path = require("path");
var fs = require("fs");

[".env", ".env.local"].forEach(function (f) {
  var p = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split("\n").forEach(function (line) {
    var m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
});

var PrismaClient = require("@prisma/client").PrismaClient;

var VALID_DOMAINS = [
  "dawsoncollege.qc.ca",
  "edu.vaniercollege.qc.ca",
  "johnabbottcollege.net",
  "marianopolis.edu",
  "bdeb.qc.ca",
  "cmaisonneuve.qc.ca",
  "crosemont.qc.ca",
  "claurendeau.qc.ca",
  "cstlaurent.qc.ca",
  "etu.cvm.qc.ca",
  "cgodin.qc.ca",
  "cmvictorin.qc.ca",
  "grasset.qc.ca",
  "brebeuf.qc.ca",
  "lasallecollege.com",
  "tav.ca",
  "osullivan.edu",
  "mail.mcgill.ca",
  "mcgill.ca",
  "live.concordia.ca",
  "mail.concordia.ca",
  "concordia.ca",
  "umontreal.ca",
  "hec.ca",
  "polymtl.ca",
  "uqam.ca",
  "courrier.uqam.ca",
  "cmontmorency.qc.ca",
  "champlaincollege.qc.ca",
  "stu.champlaincollege.qc.ca",
  "cegepmontpetit.ca",
  "cstjean.qc.ca",
  "clg.qc.ca",
  "edu.clg.qc.ca",
  "cstjerome.qc.ca",
  "cegep-lanaudiere.qc.ca",
  "colval.qc.ca",
  "ubishops.ca",
];

/** Marketing / org accounts: exclude the profile that owns this code */
var MARKETING_REFERRAL_CODES = ["Gc1D1NUw"];

/**
 * Team accounts that should never be matched, keyed on email rather than
 * first name. The old first-name list caught anyone who happened to share a
 * name with the team — a real Kamil at Concordia was being dropped from every
 * drop without anyone noticing.
 */
var EXCLUDE_EMAILS = [
  "malik@johnabbottcollege.net",     // Malik — founder
  "o_krimly@live.concordia.ca",      // Omar — founder
  "6255782@edu.vaniercollege.qc.ca", // Sky — team
];

/** Promo/marketing profiles, also by email. */
var EXCLUDE_PROMO_EMAILS = [
  "thedawsonhuzz@dawsoncollege.qc.ca", // Dawson promo profile
];

/** Specific emails to force-include even if domain looks suspect */
var WHITELISTED_EMAILS = [
  "y_zahe@liveconcordia.onmicrosoft.com", // Yehia — Concordia Microsoft 365 backend domain
  "ayushassi365@gmail.comr", // Ayush — typo in domain, real user at JAC
  "maddie.raposo@dawson.qc.ca",
  "2432482@marianopolis.com",
  "adam.msefer@stgeoges.qc.ca",
  "2531494@marianopolis.com",
  "jcgibanez@etu.uqac.ca",
  "alex.33@videotron.ca",
  "julietahcasanova@gmail.con",
  "6304900@vaniercollege.qc.ca",
  "j_agulni@live.concordia.com",
  "pitmanbrett25@mcgill.com",
  "jacob.kingi@mila.quebec",
  "672252@vaniercollege.com",
  "2530090@marianopolis.com",
  "i_velezf@live.concordia.com",
  "pe_zahr@concordia.ca.edu",
  "ai_segal@concordia.live.ca",
  "houssamlebal@dawson.com",
  "47772@vanier.com",
];

/** Match last: greedy processes edges without these before any edge involving them */
var DEPRIORITIZE_FIRST_NAMES = [];

function normName(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function isSuspectEmail(email) {
  if (!email) return true;
  var domain = email.split("@")[1];
  if (!domain) return true;
  domain = domain.toLowerCase();
  for (var i = 0; i < VALID_DOMAINS.length; i++) {
    if (domain === VALID_DOMAINS[i] || domain.endsWith("." + VALID_DOMAINS[i]))
      return false;
  }
  return true;
}

function isWhitelistedEmail(email) {
  if (!email) return false;
  var lower = email.toLowerCase();
  for (var i = 0; i < WHITELISTED_EMAILS.length; i++) {
    if (lower === WHITELISTED_EMAILS[i].toLowerCase()) return true;
  }
  return false;
}

function isExcludedFromMatching(u) {
  if (isSuspectEmail(u.email) && !isWhitelistedEmail(u.email))
    return "non-school / suspect email";
  var em = String(u.email || "").toLowerCase();
  if (em.indexOf("confessions") !== -1) return "org / confessions-style account";
  if (em.indexOf("@office.") !== -1) return "org / office email";
  if (EXCLUDE_EMAILS.indexOf(em) !== -1) return "team account";
  if (EXCLUDE_PROMO_EMAILS.indexOf(em) !== -1) return "promo account";
  if (u.referralCode && MARKETING_REFERRAL_CODES.indexOf(u.referralCode) !== -1)
    return "marketing referral account (owns code)";
  return "";
}

function isDeprioritized(u) {
  return DEPRIORITIZE_FIRST_NAMES.indexOf(normName(u.firstName)) !== -1;
}

function edgeTouchesDeprio(e) {
  return isDeprioritized(e.a) || isDeprioritized(e.b);
}

function parseCsv(s) {
  if (s == null || !String(s).trim()) return [];
  return String(s)
    .split(",")
    .map(function (x) {
      return x.trim();
    })
    .filter(Boolean);
}

function isAsianWoman(u) {
  if (u.gender !== "Woman") return false;
  var labels = parseCsv(u.ethnicity);
  for (var i = 0; i < labels.length; i++) {
    if (labels[i].indexOf("Asian") !== -1) return true;
  }
  return false;
}

function findOmar(users) {
  for (var i = 0; i < users.length; i++) {
    if (normName(users[i].firstName) === "omar") return users[i];
  }
  return null;
}

function findSky(users) {
  for (var i = 0; i < users.length; i++) {
    if (normName(users[i].firstName) === "sky" && users[i].gender === "Woman")
      return users[i];
  }
  return null;
}

function findYehia(users) {
  for (var i = 0; i < users.length; i++) {
    if (normName(users[i].firstName) === "yehia") return users[i];
  }
  return null;
}

function findAyush(users) {
  for (var i = 0; i < users.length; i++) {
    if (normName(users[i].firstName) === "ayush") return users[i];
  }
  return null;
}

function isWomanSeekingWomen(u) {
  return (
    u.gender === "Woman" &&
    (u.genderPreference === "Women" || u.genderPreference === "Everyone")
  );
}

function genderCompatible(pref, partnerGender) {
  if (!pref || !partnerGender) return false;
  if (pref === "Everyone") return true;
  if (pref === "Men") return partnerGender === "Man";
  if (pref === "Women") return partnerGender === "Woman";
  return false;
}

function schoolOk(viewerPref, viewerSchool, partnerSchool) {
  var p = viewerPref || "any";
  if (p === "any") return true;
  if (!viewerSchool || !partnerSchool) return false;
  if (p === "same") return viewerSchool === partnerSchool;
  if (p === "nearby") return true;
  return true;
}

function ethnicityOk(viewerPrefRaw, partnerEthnicityRaw) {
  var wanted = parseCsv(viewerPrefRaw);
  if (wanted.length === 0) return true;
  var partnerLabels = parseCsv(partnerEthnicityRaw);
  if (partnerLabels.length === 0) return false;
  for (var i = 0; i < wanted.length; i++) {
    if (partnerLabels.indexOf(wanted[i]) !== -1) return true;
  }
  return false;
}

function ageInRange(age, min, max) {
  if (age == null || isNaN(age)) return false;
  var lo = min != null ? min : 18;
  var hi = max != null ? max : 25;
  return age >= lo && age <= hi;
}

function pairEligible(a, b) {
  if (!genderCompatible(a.genderPreference, b.gender)) return false;
  if (!genderCompatible(b.genderPreference, a.gender)) return false;
  if (!ageInRange(a.age, b.ageRangeMin, b.ageRangeMax)) return false;
  if (!ageInRange(b.age, a.ageRangeMin, a.ageRangeMax)) return false;
  if (!schoolOk(a.schoolPreference, a.school, b.school)) return false;
  if (!schoolOk(b.schoolPreference, b.school, a.school)) return false;
  if (!ethnicityOk(a.ethnicityPreference, b.ethnicity)) return false;
  if (!ethnicityOk(b.ethnicityPreference, a.ethnicity)) return false;
  return true;
}

/** Relaxed fallback: keep only bilateral gender + age compatibility. */
function pairEligibleRelaxed(a, b) {
  if (!genderCompatible(a.genderPreference, b.gender)) return false;
  if (!genderCompatible(b.genderPreference, a.gender)) return false;
  if (!ageInRange(a.age, b.ageRangeMin, b.ageRangeMax)) return false;
  if (!ageInRange(b.age, a.ageRangeMin, a.ageRangeMax)) return false;
  return true;
}

/** Omar priority pin only: gender + age + Asian woman; ignores school/ethnicity *preference*. */
function pairEligibleOmarPin(omar, woman) {
  if (!genderCompatible(omar.genderPreference, woman.gender)) return false;
  if (!genderCompatible(woman.genderPreference, omar.gender)) return false;
  if (!ageInRange(omar.age, woman.ageRangeMin, woman.ageRangeMax)) return false;
  if (!ageInRange(woman.age, omar.ageRangeMin, omar.ageRangeMax)) return false;
  if (!isAsianWoman(woman)) return false;
  return true;
}

function overlap(a, b) {
  if (!a || !b) return 0;
  var set = {};
  var n = 0;
  for (var i = 0; i < a.length; i++) set[a[i]] = true;
  for (var j = 0; j < b.length; j++) if (set[b[j]]) n++;
  return n;
}

/** Ideal hangout is a comma-separated multi-select; any overlap counts. */
function hangoutList(raw) {
  if (!raw) return [];
  return String(raw).split(",").map(function (x) { return x.trim(); })
    .filter(function (x) { return !!x; });
}

function softScore(a, b) {
  var s = 0;
  if (a.intentions && a.intentions === b.intentions) s += 3;
  if (a.vibe && a.vibe === b.vibe) s += 2;
  var sh = overlap(a.interests || [], b.interests || []);
  s += Math.min(5, sh);
  if (overlap(hangoutList(a.idealHangout), hangoutList(b.idealHangout))) s += 2;
  s += Math.min(4, overlap(a.availability || [], b.availability || []));
  if (a.majorPreference && a.majorPreference === b.major) s += 2;
  if (b.majorPreference && b.majorPreference === a.major) s += 2;
  if (a.school && a.school === b.school) s += 1;
  return s;
}

var _previouslyMatched = {};
var _matchedInPreviousWeek = {};

function buildEdges(pool) {
  var edges = [];
  for (var i = 0; i < pool.length; i++) {
    for (var j = i + 1; j < pool.length; j++) {
      var a = pool[i];
      var b = pool[j];
      var pairKey = a.id + ":" + b.id;
      if (_previouslyMatched[pairKey]) continue;
      if (!pairEligible(a, b)) continue;
      var score = softScore(a, b) + softScore(b, a);
      var interestOverlap = overlap(a.interests || [], b.interests || []);
      var unmatchedLastWeek = !_matchedInPreviousWeek[a.id] || !_matchedInPreviousWeek[b.id];
      edges.push({
        a: a,
        b: b,
        score: score,
        interestOverlap: interestOverlap,
        unmatchedLastWeek: unmatchedLastWeek,
      });
    }
  }
  return edges;
}

function sortEdgesGreedy(edges) {
  edges.sort(function (x, y) {
    /* Priority 1: edges involving someone unmatched in previous week go first */
    if (x.unmatchedLastWeek !== y.unmatchedLastWeek)
      return x.unmatchedLastWeek ? -1 : 1;
    /* Priority 2: deprioritized names go last */
    var xd = edgeTouchesDeprio(x);
    var yd = edgeTouchesDeprio(y);
    if (xd !== yd) return xd ? 1 : -1;
    if (y.score !== x.score) return y.score - x.score;
    if (y.interestOverlap !== x.interestOverlap)
      return y.interestOverlap - x.interestOverlap;
    return x.a.createdAt - y.a.createdAt;
  });
}

function greedyMatch(edges, used, pairs) {
  used = used || {};
  pairs = pairs || [];
  sortEdgesGreedy(edges);
  for (var e = 0; e < edges.length; e++) {
    var ed = edges[e];
    if (used[ed.a.id] || used[ed.b.id]) continue;
    used[ed.a.id] = true;
    used[ed.b.id] = true;
    pairs.push(ed);
  }
  return { used: used, pairs: pairs };
}

function esc(s) {
  return String(s == null ? "" : s).replace(/\|/g, "\\|");
}

var prisma = new PrismaClient();

var nowLocal = new Date();
var localDayStart = new Date(nowLocal);
localDayStart.setHours(0, 0, 0, 0);
var previousWeekStart = new Date(localDayStart);
previousWeekStart.setDate(previousWeekStart.getDate() - 7);

prisma.user
  .findMany({
    where: {
      phoneVerified: true,
      onboardingComplete: true,
      // Synthetic reviewer accounts are never proposed to real students.
      isTestAccount: false,
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      school: true,
      major: true,
      age: true,
      gender: true,
      ethnicity: true,
      intentions: true,
      vibe: true,
      interests: true,
      idealHangout: true,
      availability: true,
      genderPreference: true,
      schoolPreference: true,
      ageRangeMin: true,
      ageRangeMax: true,
      majorPreference: true,
      ethnicityPreference: true,
      photoUrl: true,
      referralCode: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })
  .then(function (users) {
    return Promise.all([
      prisma.match.findMany({
        where: {
          status: { in: ["PENDING", "MUTUAL"] },
          dropDate: { gte: localDayStart },
        },
        select: { userAId: true, userBId: true },
      }),
      prisma.match.findMany({
        select: { userAId: true, userBId: true },
      }),
      prisma.match.findMany({
        where: {
          dropDate: {
            gte: previousWeekStart,
            lt: localDayStart,
          },
        },
        select: { userAId: true, userBId: true },
      }),
    ]).then(function (results) {
      return {
        users: users,
        activeMatches: results[0],
        allHistoricalMatches: results[1],
        previousWeekMatches: results[2],
      };
    });
  })
  .then(function (_ref) {
    var users = _ref.users;
    var active = _ref.activeMatches;
    var allHistory = _ref.allHistoricalMatches;
    var previousWeekMatches = _ref.previousWeekMatches;

    var busy = {};
    for (var m = 0; m < active.length; m++) {
      busy[active[m].userAId] = true;
      busy[active[m].userBId] = true;
    }

    /* Build set of previously matched pairs (both directions) */
    var previouslyMatched = {};
    for (var h = 0; h < allHistory.length; h++) {
      var keyAB = allHistory[h].userAId + ":" + allHistory[h].userBId;
      var keyBA = allHistory[h].userBId + ":" + allHistory[h].userAId;
      previouslyMatched[keyAB] = true;
      previouslyMatched[keyBA] = true;
    }

    /* Track who was matched during previous week only */
    var matchedInPreviousWeek = {};
    for (var am = 0; am < previousWeekMatches.length; am++) {
      matchedInPreviousWeek[previousWeekMatches[am].userAId] = true;
      matchedInPreviousWeek[previousWeekMatches[am].userBId] = true;
    }

    /* Expose to buildEdges */
    _previouslyMatched = previouslyMatched;
    _matchedInPreviousWeek = matchedInPreviousWeek;

    var excluded = [];
    var eligible = [];
    for (var u = 0; u < users.length; u++) {
      var usr = users[u];
      if (busy[usr.id]) continue;
      var why = isExcludedFromMatching(usr);
      if (why) {
        excluded.push({ u: usr, why: why });
        continue;
      }
      eligible.push(usr);
    }

    /* No photo means no match. These members used to be paired with each
       other in a separate bucket, which produced matches nobody could judge
       and a pool too small to be worth it. They are excluded outright and
       listed at the end of the file so they can be nudged. */
    var withPhoto = eligible.filter(function (u) {
      return !!u.photoUrl;
    });
    var noPhoto = [];
    var photoless = eligible.filter(function (u) {
      return !u.photoUrl;
    });
    for (var pl = 0; pl < photoless.length; pl++) {
      excluded.push({ u: photoless[pl], why: "no photo" });
    }

    var used = {};
    var pairs = [];
    var notes = [];

    /* Priority: Omar × Asian woman (same photo bucket as Omar) */
    var omar = findOmar(eligible);
    if (omar) {
      var omarPool = omar.photoUrl ? withPhoto : noPhoto;
      var best = null;
      for (var oi = 0; oi < omarPool.length; oi++) {
        var cand = omarPool[oi];
        if (cand.id === omar.id) continue;
        if (_previouslyMatched[omar.id + ":" + cand.id]) continue;
        if (!isAsianWoman(cand)) continue;
        if (!pairEligible(omar, cand)) continue;
        var sc = softScore(omar, cand) + softScore(cand, omar);
        var io = overlap(omar.interests || [], cand.interests || []);
        if (!best || sc > best.score || (sc === best.score && io > best.interestOverlap)) {
          best = { a: omar, b: cand, score: sc, interestOverlap: io, pinned: true };
        }
      }
      if (!best) {
        for (var oj = 0; oj < omarPool.length; oj++) {
          var c2 = omarPool[oj];
          if (c2.id === omar.id) continue;
          if (_previouslyMatched[omar.id + ":" + c2.id]) continue;
          if (!pairEligibleOmarPin(omar, c2)) continue;
          var sc2 = softScore(omar, c2) + softScore(c2, omar);
          var io2 = overlap(omar.interests || [], c2.interests || []);
          if (!best || sc2 > best.score || (sc2 === best.score && io2 > best.interestOverlap)) {
            best = {
              a: omar,
              b: c2,
              score: sc2,
              interestOverlap: io2,
              pinned: true,
              relaxedPin: true,
            };
          }
        }
      }
      if (best) {
        used[best.a.id] = true;
        used[best.b.id] = true;
        pairs.push(best);
        notes.push(
          "Pinned **Omar** with **" +
            (best.b.firstName || "?") +
            "** (Asian woman" +
            (best.relaxedPin
              ? "; **relaxed** school/ethnicity preference for this pin only"
              : "") +
            ", best score in bucket).",
        );
      } else {
        notes.push(
          "Could not pin Omar to an Asian woman — none in his photo/no-photo bucket with compatible gender/age.",
        );
      }
    } else {
      notes.push("No user named **Omar** in eligible pool.");
    }

    /* Priority: Sky × woman who seeks women (same photo bucket as Sky) */
    var sky = findSky(eligible);
    if (sky && !used[sky.id]) {
      var skyPool = sky.photoUrl ? withPhoto : noPhoto;
      var skyBest = null;
      for (var si = 0; si < skyPool.length; si++) {
        var sc3 = skyPool[si];
        if (sc3.id === sky.id || used[sc3.id]) continue;
        if (_previouslyMatched[sky.id + ":" + sc3.id]) continue;
        if (!isWomanSeekingWomen(sc3)) continue;
        if (!pairEligible(sky, sc3)) continue;
        var skyS = softScore(sky, sc3) + softScore(sc3, sky);
        var skyO = overlap(sky.interests || [], sc3.interests || []);
        if (!skyBest || skyS > skyBest.score || (skyS === skyBest.score && skyO > skyBest.interestOverlap)) {
          skyBest = { a: sky, b: sc3, score: skyS, interestOverlap: skyO, pinNote: "Sky pin (W4W)" };
        }
      }
      if (skyBest) {
        used[skyBest.a.id] = true;
        used[skyBest.b.id] = true;
        pairs.push(skyBest);
        notes.push(
          "Pinned **Sky** with **" + (skyBest.b.firstName || "?") + "** (woman seeking women, best score).",
        );
      } else {
        notes.push("Could not pin Sky to a woman seeking women — none eligible in her bucket.");
      }
    } else if (!sky) {
      notes.push("No user named **Sky** (Woman) in eligible pool.");
    }

    /* Priority: ensure Yehia gets a match */
    /* Pinned by email: guaranteed a match ahead of the greedy pass. Used for
       people we have specifically promised one to, on the surplus side of the
       pool where the greedy pass would otherwise leave them out. */
    var PIN_EMAILS = ["ka_khala@live.concordia.ca"];
    for (var pe = 0; pe < PIN_EMAILS.length; pe++) {
      var pinUser = null;
      for (var pu = 0; pu < eligible.length; pu++) {
        if (String(eligible[pu].email || "").toLowerCase() === PIN_EMAILS[pe]) { pinUser = eligible[pu]; break; }
      }
      if (!pinUser || used[pinUser.id]) continue;
      var pinPool = pinUser.photoUrl ? withPhoto : noPhoto;
      var pinBest = null;
      for (var pi = 0; pi < pinPool.length; pi++) {
        var pc = pinPool[pi];
        if (pc.id === pinUser.id || used[pc.id]) continue;
        if (_previouslyMatched[pinUser.id + ":" + pc.id]) continue;
        if (!pairEligible(pinUser, pc)) continue;
        var pS = softScore(pinUser, pc) + softScore(pc, pinUser);
        var pO = overlap(pinUser.interests || [], pc.interests || []);
        if (!pinBest || pS > pinBest.score || (pS === pinBest.score && pO > pinBest.interestOverlap)) {
          pinBest = { a: pinUser, b: pc, score: pS, interestOverlap: pO, pinNote: "pinned" };
        }
      }
      if (pinBest) {
        used[pinBest.a.id] = true;
        used[pinBest.b.id] = true;
        pairs.push(pinBest);
        notes.push("Pinned **" + (pinBest.a.firstName || "?") + "** with **" + (pinBest.b.firstName || "?") + "** (best score in bucket).");
      }
    }

    var yehia = findYehia(eligible);
    if (yehia && !used[yehia.id]) {
      var yehiaPool = yehia.photoUrl ? withPhoto : noPhoto;
      var yehiaBest = null;
      for (var yi = 0; yi < yehiaPool.length; yi++) {
        var yc = yehiaPool[yi];
        if (yc.id === yehia.id || used[yc.id]) continue;
        if (_previouslyMatched[yehia.id + ":" + yc.id]) continue;
        if (!pairEligible(yehia, yc)) continue;
        var yS = softScore(yehia, yc) + softScore(yc, yehia);
        var yO = overlap(yehia.interests || [], yc.interests || []);
        if (!yehiaBest || yS > yehiaBest.score || (yS === yehiaBest.score && yO > yehiaBest.interestOverlap)) {
          yehiaBest = { a: yehia, b: yc, score: yS, interestOverlap: yO, pinNote: "Yehia pin" };
        }
      }
      if (yehiaBest) {
        used[yehiaBest.a.id] = true;
        used[yehiaBest.b.id] = true;
        pairs.push(yehiaBest);
        notes.push(
          "Pinned **Yehia** with **" + (yehiaBest.b.firstName || "?") + "** (best score in bucket).",
        );
      } else {
        notes.push("Could not pin Yehia — no eligible partner in his bucket.");
      }
    } else if (!yehia) {
      notes.push("No user named **Yehia** in eligible pool.");
    }

    /* Priority: ensure Ayush gets a match */
    var ayush = findAyush(eligible);
    if (ayush && !used[ayush.id]) {
      var ayushPool = ayush.photoUrl ? withPhoto : noPhoto;
      var ayushBest = null;
      for (var ai = 0; ai < ayushPool.length; ai++) {
        var ac = ayushPool[ai];
        if (ac.id === ayush.id || used[ac.id]) continue;
        if (_previouslyMatched[ayush.id + ":" + ac.id]) continue;
        if (!pairEligible(ayush, ac)) continue;
        var aS = softScore(ayush, ac) + softScore(ac, ayush);
        var aO = overlap(ayush.interests || [], ac.interests || []);
        if (!ayushBest || aS > ayushBest.score || (aS === ayushBest.score && aO > ayushBest.interestOverlap)) {
          ayushBest = { a: ayush, b: ac, score: aS, interestOverlap: aO, pinNote: "Ayush pin" };
        }
      }
      if (ayushBest) {
        used[ayushBest.a.id] = true;
        used[ayushBest.b.id] = true;
        pairs.push(ayushBest);
        notes.push(
          "Pinned **Ayush** with **" + (ayushBest.b.firstName || "?") + "** (best score in bucket).",
        );
      } else {
        notes.push("Could not pin Ayush — no eligible partner in his bucket.");
      }
    } else if (!ayush) {
      notes.push("No user named **Ayush** in eligible pool.");
    }

    var edgesPhoto = buildEdges(withPhoto);
    var edgesNoPhoto = buildEdges(noPhoto);

    var r1 = greedyMatch(edgesPhoto, used, pairs);
    used = r1.used;
    pairs = r1.pairs;

    var r2 = greedyMatch(edgesNoPhoto, used, pairs);
    used = r2.used;
    pairs = r2.pairs;

    var poolAll = withPhoto.concat(noPhoto);
    var unmatched = poolAll.filter(function (u) {
      return !used[u.id];
    });

    /* Last-resort pass: pair remaining unmatched users with suspect-email-only
       excluded users (photo bucket rules still apply). */
    var suspectOnly = excluded.filter(function (row) {
      return row.why === "non-school / suspect email";
    }).map(function (row) { return row.u; });

    var suspectWithPhoto = suspectOnly.filter(function (u) { return !!u.photoUrl; });
    var suspectNoPhoto = suspectOnly.filter(function (u) { return !u.photoUrl; });

    var lastResortPairs = [];
    var unmatchedWithPhoto = unmatched.filter(function (u) { return !!u.photoUrl; });
    var unmatchedNoPhoto = unmatched.filter(function (u) { return !u.photoUrl; });

    function lastResortGreedy(unmatchedBucket, suspectBucket) {
      var edges = [];
      for (var i = 0; i < unmatchedBucket.length; i++) {
        for (var j = 0; j < suspectBucket.length; j++) {
          var a = unmatchedBucket[i];
          var b = suspectBucket[j];
          if (used[a.id] || used[b.id]) continue;
          if (_previouslyMatched[a.id + ":" + b.id]) continue;
          if (!pairEligible(a, b)) continue;
          var s = softScore(a, b) + softScore(b, a);
          var io = overlap(a.interests || [], b.interests || []);
          edges.push({ a: a, b: b, score: s, interestOverlap: io, pinNote: "last-resort (suspect email)" });
        }
      }
      edges.sort(function (x, y) {
        if (y.score !== x.score) return y.score - x.score;
        if (y.interestOverlap !== x.interestOverlap) return y.interestOverlap - x.interestOverlap;
        return 0;
      });
      for (var e = 0; e < edges.length; e++) {
        var ed = edges[e];
        if (used[ed.a.id] || used[ed.b.id]) continue;
        used[ed.a.id] = true;
        used[ed.b.id] = true;
        pairs.push(ed);
        lastResortPairs.push(ed);
      }
    }

    lastResortGreedy(unmatchedWithPhoto, suspectWithPhoto);
    lastResortGreedy(unmatchedNoPhoto, suspectNoPhoto);

    if (lastResortPairs.length > 0) {
      notes.push("**Last-resort pass:** matched " + lastResortPairs.length + " additional pair(s) using suspect-email users.");
      // Remove newly matched suspect users from the excluded list
      for (var lr = 0; lr < lastResortPairs.length; lr++) {
        var lrB = lastResortPairs[lr].b.id;
        var lrA = lastResortPairs[lr].a.id;
        excluded = excluded.filter(function (row) {
          return row.u.id !== lrB && row.u.id !== lrA;
        });
      }
    } else {
      notes.push("**Last-resort pass:** no additional pairs found from suspect-email pool.");
    }

    // Recompute unmatched
    unmatched = poolAll.filter(function (u) {
      return !used[u.id];
    });

    /* Relaxed fallback pass: reduce unmatched by relaxing school/ethnicity/major prefs.
       Still enforces: no repeats, no cross photo buckets, bilateral gender + age. */
    var relaxedPairs = [];
    function relaxedGreedy(unmatchedBucket) {
      var edges = [];
      for (var i = 0; i < unmatchedBucket.length; i++) {
        for (var j = i + 1; j < unmatchedBucket.length; j++) {
          var a = unmatchedBucket[i];
          var b = unmatchedBucket[j];
          if (used[a.id] || used[b.id]) continue;
          if (_previouslyMatched[a.id + ":" + b.id]) continue;
          if (!pairEligibleRelaxed(a, b)) continue;
          var s = softScore(a, b) + softScore(b, a);
          var io = overlap(a.interests || [], b.interests || []);
          edges.push({
            a: a,
            b: b,
            score: s,
            interestOverlap: io,
            pinNote: "relaxed fallback (gender+age only)",
          });
        }
      }
      edges.sort(function (x, y) {
        if (y.score !== x.score) return y.score - x.score;
        if (y.interestOverlap !== x.interestOverlap) return y.interestOverlap - x.interestOverlap;
        return 0;
      });
      for (var e = 0; e < edges.length; e++) {
        var ed = edges[e];
        if (used[ed.a.id] || used[ed.b.id]) continue;
        used[ed.a.id] = true;
        used[ed.b.id] = true;
        pairs.push(ed);
        relaxedPairs.push(ed);
      }
    }

    var unmatchedWithPhoto2 = unmatched.filter(function (u) { return !!u.photoUrl; });
    var unmatchedNoPhoto2 = unmatched.filter(function (u) { return !u.photoUrl; });
    relaxedGreedy(unmatchedWithPhoto2);
    relaxedGreedy(unmatchedNoPhoto2);

    if (relaxedPairs.length > 0) {
      notes.push("**Relaxed fallback pass:** matched " + relaxedPairs.length + " additional pair(s) with gender+age-only hard filters.");
    } else {
      notes.push("**Relaxed fallback pass:** no additional pairs found.");
    }

    // Final unmatched after all passes
    unmatched = poolAll.filter(function (u) {
      return !used[u.id];
    });

    // Every pair is a Wednesday drop. Extra matches are bought one at a
    // time via paid rerolls, so there are no per-tier extra rounds.
    for (var wp = 0; wp < pairs.length; wp++) {
      if (!pairs[wp].dropSlot) pairs[wp].dropSlot = "WED";
    }

    var skippedBusy = users.filter(function (u) {
      return busy[u.id];
    });

    var lines = [];
    lines.push("# Daisy — proposed matches (draft)");
    lines.push("");
    lines.push(
      "**Generated:** " +
        new Date().toISOString() +
        " — **not saved to the database.** Regenerate with `node daisy/scripts/generate-matches-md.js`.",
    );
    lines.push("");
    lines.push("## Special rules for this run");
    lines.push("");
    lines.push(
      "- **Excluded from matching:** non-school / suspect emails (except whitelisted); emails with **confessions** or **`@office.`**; **no photo**; team accounts (Malik, Omar, Sky) and the Dawson promo profile, keyed on email.",
    );
    lines.push(
      "- **Photo buckets:** users **with photo** only match others **with photo**; users **without photo** only match others **without photo** (no cross-bucket pairs).",
    );
    lines.push(
      "- **Omar:** if present, pinned to the best-scoring **Asian woman** in his bucket. Full filters first; if none, **relaxed pin** (still gender + age + her ethnicity contains “Asian”; school/ethnicity *preference* waived for that pair only).",
    );
    lines.push(
      "- **Sky:** if present, pinned to a **woman seeking women** (best score in her bucket).",
    );
    lines.push(
      "- **Yehia:** whitelisted email (`liveconcordia.onmicrosoft.com`); pinned to best-scoring partner in his bucket.",
    );
    lines.push(
      "- **Ayush:** whitelisted email (`gmail.comr` typo); pinned to best-scoring partner in his bucket.",
    );
    lines.push(
      "- **No repeats:** pairs that were matched in any previous week are excluded.",
    );
    lines.push(
      "- **Delivery:** everyone gets one curated **Wednesday** drop. Extra matches come from paid rerolls, not from tiers.",
    );
    lines.push(
      "- **Previous-week unmatched priority:** users who did not get a match in the previous week are prioritized in greedy ordering.",
    );
    lines.push(
      "- **History:** " + allHistory.length + " historical match(es) loaded; " + Object.keys(previouslyMatched).length / 2 + " unique pairs blocked.",
    );
    lines.push("");
    for (var n = 0; n < notes.length; n++) lines.push("- " + notes[n]);
    lines.push("");
    lines.push("## Base algorithm (see `matchingAlgorithm.md`)");
    lines.push("");
    lines.push(
      "- Hard: bidirectional gender pref ↔ gender, age in range, school pref (same / any; **nearby** = any for now), ethnicity pref optional.",
    );
    lines.push(
      "- Soft score: intentions +3, vibe +2, shared interests +1 (cap 5), ideal hangout +2, availability overlap +1 (cap 4), major pref +2 each side, same school +1.",
    );
    lines.push("");
    lines.push("## Pairings (" + pairs.length + ")");
    lines.push("");

    if (pairs.length === 0) {
      lines.push("_No eligible pairs in the current pool._");
      lines.push("");
    } else {
      lines.push("| # | Person A | Person B | Drop | Score | Shared interests | Note |");
      lines.push("|---|----------|----------|------|-------|------------------|------|");
      for (var p = 0; p < pairs.length; p++) {
        var pr = pairs[p];
        var an = pr.a.firstName || "?";
        var bn = pr.b.firstName || "?";
        var shared = pr.interestOverlap;
        var note = pr.pinNote
          ? pr.pinNote
          : pr.pinned
            ? (pr.relaxedPin ? "Omar pin (relaxed)" : "Omar pin")
            : "";
        lines.push(
          "| " +
            (p + 1) +
            " | " +
            esc(an) +
            " (" +
            esc(pr.a.school || "—") +
            ", " +
            (pr.a.age != null ? pr.a.age : "?") +
            (pr.a.photoUrl ? "" : ", no photo") +
            ") | " +
            esc(bn) +
            " (" +
            esc(pr.b.school || "—") +
            ", " +
            (pr.b.age != null ? pr.b.age : "?") +
            (pr.b.photoUrl ? "" : ", no photo") +
            ") | " +
            (pr.dropSlot || "WED") +
            " | " +
            pr.score +
            " | " +
            shared +
            " | " +
            esc(note) +
            " |",
        );
      }
      lines.push("");
      lines.push("### Detail per pair");
      lines.push("");
      for (var q = 0; q < pairs.length; q++) {
        var pr2 = pairs[q];
        lines.push(
          "#### Pair " +
            (q + 1) +
            ": " +
            (pr2.a.firstName || "?") +
            " × " +
            (pr2.b.firstName || "?") +
            (pr2.pinNote ? " _(" + pr2.pinNote + ")_" : pr2.pinned ? " _(pinned)_" : ""),
        );
        lines.push("");
        lines.push("- **Drop slot:** " + (pr2.dropSlot || "WED"));
        lines.push("- **Score:** " + pr2.score);
        lines.push(
          "- **A:** " +
            esc(pr2.a.email) +
            " · " +
            esc(pr2.a.gender) +
            " · seeks " +
            esc(pr2.a.genderPreference) +
            " · intentions: " +
            esc(pr2.a.intentions) +
            " · vibe: " +
            esc(pr2.a.vibe) +
            " · photo: " +
            (pr2.a.photoUrl ? "yes" : "no"),
        );
        lines.push(
          "- **B:** " +
            esc(pr2.b.email) +
            " · " +
            esc(pr2.b.gender) +
            " · seeks " +
            esc(pr2.b.genderPreference) +
            " · intentions: " +
            esc(pr2.b.intentions) +
            " · vibe: " +
            esc(pr2.b.vibe) +
            " · photo: " +
            (pr2.b.photoUrl ? "yes" : "no"),
        );
        lines.push(
          "- **Ethnicity A:** " + esc(pr2.a.ethnicity || "—"),
        );
        lines.push(
          "- **Ethnicity B:** " + esc(pr2.b.ethnicity || "—"),
        );
        lines.push(
          "- **Interests A:** " +
            (pr2.a.interests && pr2.a.interests.length ? pr2.a.interests.join(", ") : "—"),
        );
        lines.push(
          "- **Interests B:** " +
            (pr2.b.interests && pr2.b.interests.length ? pr2.b.interests.join(", ") : "—"),
        );
        lines.push("");
      }
    }

    lines.push("## In pool but unmatched (" + unmatched.length + ")");
    lines.push("");
    if (unmatched.length === 0) {
      lines.push("_None._");
    } else {
      for (var uu = 0; uu < unmatched.length; uu++) {
        var x = unmatched[uu];
        lines.push(
          "- **" +
            esc(x.firstName || "?") +
            "** · " +
            esc(x.email) +
            " · " +
            esc(x.school || "—") +
            " · " +
            esc(x.gender) +
            " / seeks " +
            esc(x.genderPreference) +
            (x.photoUrl ? "" : " · **no photo**"),
        );
      }
    }
    lines.push("");

    lines.push("## Excluded from matching (" + excluded.length + ")");
    lines.push("");
    if (excluded.length === 0) {
      lines.push("_None._");
    } else {
      for (var ex = 0; ex < excluded.length; ex++) {
        var row = excluded[ex];
        lines.push(
          "- **" +
            esc(row.u.firstName || "?") +
            "** · " +
            esc(row.u.email) +
            " — _" +
            esc(row.why) +
            "_",
        );
      }
    }
    lines.push("");

    lines.push("## Not in pool (busy in active match)");
    lines.push("");
    lines.push(
      skippedBusy.length
        ? skippedBusy
            .map(function (u) {
              return "- **" + esc(u.firstName || "?") + "** · " + esc(u.email);
            })
            .join("\n")
        : "_None._",
    );
    lines.push("");
    lines.push(
      "- **Total phone-verified + onboarded (raw query):** " + users.length,
    );
    lines.push("");

    var out = path.resolve(__dirname, "..", "..", "matches.md");
    fs.writeFileSync(out, lines.join("\n"), "utf8");
    console.log("Wrote " + out);
    console.log("Pairs: " + pairs.length + ", unmatched: " + unmatched.length);
    return prisma.$disconnect();
  })
  .catch(function (err) {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
