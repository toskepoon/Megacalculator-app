
const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) =>
    k === "class" ? (n.className = v) :
    k === "for"   ? n.setAttribute("for", v) :
                    (n[k] = v)
  );
  [].concat(children).forEach(c => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return n;
};

const $ = sel => document.querySelector(sel);
const mode = () => (document.querySelector('input[name="mode"]:checked')?.value || "deg");
const toRad = x => mode() === "deg" ? (x * Math.PI / 180) : x;
const toNum = id => Number($("#" + id).value);

const factorial = n => {
  if (!Number.isInteger(n) || n < 0) return NaN;
  if (n > 170) return Infinity; // JS Number overflow beyond ~170!
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

const safeDiv = (a, b) => (b === 0 ? NaN : a / b);

const KM_PER_MILE = 1.609344;
const R_EARTH_KM = 6371; // mean Earth radius

// Registry of calculations
const CALCS = {
  // --- Algebra ---
  quadraticRoots: {
    label: "Quadratic Roots (ax²+bx+c=0)",
    fields: [
      { id:"a", label:"a", placeholder:"e.g. 1" },
      { id:"b", label:"b", placeholder:"e.g. -3" },
      { id:"c", label:"c", placeholder:"e.g. 2" }
    ],
    run: () => {
      const a = toNum("a"), b = toNum("b"), c = toNum("c");
      if (a === 0) return "a = 0 → not quadratic. Try linearSolve.";
      const D = b*b - 4*a*c;
      const twoA = 2*a;
      let out = `Discriminant D = ${D}\n`;
      if (D > 0) {
        const r1 = (-b + Math.sqrt(D))/twoA;
        const r2 = (-b - Math.sqrt(D))/twoA;
        out += `Two real roots:\n  x₁ = ${r1}\n  x₂ = ${r2}`;
      } else if (D === 0) {
        const r = -b/twoA;
        out += `Repeated real root:\n  x = ${r}`;
      } else {
        const real = (-b)/twoA;
        const imag = Math.sqrt(-D)/twoA;
        out += `Complex roots:\n  x = ${real} ± ${imag}i`;
      }
      return out;
    }
  },
  discriminant: {
    label: "Discriminant (b² − 4ac)",
    fields: [
      { id:"a", label:"a" }, { id:"b", label:"b" }, { id:"c", label:"c" }
    ],
    run: () => {
      const a = toNum("a"), b = toNum("b"), c = toNum("c");
      return `D = b² − 4ac = ${b*b - 4*a*c}`;
    }
  },
  linearSolve: {
    label: "Solve ax + b = 0",
    fields: [{id:"a",label:"a"}, {id:"b",label:"b"}],
    run: () => {
      const a = toNum("a"), b = toNum("b");
      if (a === 0) return (b === 0) ? "All real x are solutions." : "No solution.";
      return `x = ${-b/a}`;
    }
  },
  power: {
    label: "Power a^b",
    fields: [{id:"base",label:"a (base)"}, {id:"exp",label:"b (exponent)"}],
    run: () => {
      const a = toNum("base"), b = toNum("exp");
      return `a^b = ${a ** b}`;
    }
  },

  // --- Geometry / Coordinate ---
  distance2D: {
    label: "Distance between two points",
    fields: [
      {id:"x1",label:"x₁"}, {id:"y1",label:"y₁"},
      {id:"x2",label:"x₂"}, {id:"y2",label:"y₂"}
    ],
    run: () => {
      const x1=toNum("x1"), y1=toNum("y1"), x2=toNum("x2"), y2=toNum("y2");
      const dx = x2 - x1, dy = y2 - y1;
      return `√((x₂−x₁)² + (y₂−y₁)²) = ${Math.hypot(dx,dy)}`;
    }
  },
  slope2D: {
    label: "Slope between two points",
    fields: [
      {id:"x1",label:"x₁"}, {id:"y1",label:"y₁"},
      {id:"x2",label:"x₂"}, {id:"y2",label:"y₂"}
    ],
    run: () => {
      const x1=toNum("x1"), y1=toNum("y1"), x2=toNum("x2"), y2=toNum("y2");
      return `m = (y₂−y₁)/(x₂−x₁) = ${safeDiv(y2 - y1, x2 - x1)}`;
    }
  },
  pythagHyp: {
    label: "Pythagorean (hypotenuse)",
    fields: [{id:"a",label:"a (leg)"},{id:"b",label:"b (leg)"}],
    run: () => {
      const a = toNum("a"), b = toNum("b");
      return `c = √(a² + b²) = ${Math.hypot(a,b)}`;
    }
  },
  lawCosineSide: {
    label: "Law of Cosines (side c from a,b,C)",
    fields: [
      {id:"a",label:"a"}, {id:"b",label:"b"}, {id:"C",label:"C (angle)"}
    ],
    run: () => {
      const a=toNum("a"), b=toNum("b"), C=toNum("C");
      const c = Math.sqrt(a*a + b*b - 2*a*b*Math.cos(toRad(C)));
      return `c = √(a² + b² − 2ab·cos(C)) = ${c}`;
    }
  },
  heron: {
    label: "Triangle area (Heron)",
    fields: [{id:"a",label:"a"},{id:"b",label:"b"},{id:"c",label:"c"}],
    run: () => {
      const a=toNum("a"), b=toNum("b"), c=toNum("c");
      const s = (a+b+c)/2;
      const area = Math.sqrt(Math.max(0, s*(s-a)*(s-b)*(s-c)));
      return `s = ${(s)}\nArea = √(s(s−a)(s−b)(s−c)) = ${area}`;
    }
  },

  // --- Trig (classic) ---
  lawSinesSide: {
    label: "Law of Sines (solve side: a / sin A = b / sin B)",
    fields: [{id:"a",label:"Known side a"},{id:"A",label:"Angle A"},{id:"B",label:"Angle B"}],
    run: () => {
      const a=toNum("a"), A=toNum("A"), B=toNum("B");
      const val = a * Math.sin(toRad(B)) / Math.sin(toRad(A));
      return `b = a·sin(B)/sin(A) = ${val}`;
    }
  },
  lawSinesAngle: {
    label: "Law of Sines (solve angle: A from a,b,B)",
    fields: [{id:"a",label:"a"},{id:"b",label:"b"},{id:"B",label:"B (angle)"}],
    run: () => {
      const a=toNum("a"), b=toNum("b"), B=toNum("B");
      const ratio = (a*Math.sin(toRad(B)))/b;
      if (ratio < -1 || ratio > 1) return "No solution (domain error).";
      const A = Math.asin(ratio);
      const Aout = mode()==="deg" ? (A*180/Math.PI) : A;
      return `A = arcsin(a·sin(B)/b) = ${Aout}`;
    }
  },

  // --- Trig (historical / “dead”) ---
  deadTrigSet: {
    label: "Dead trig function set (input angle θ)",
    fields: [{id:"theta",label:"θ"}],
    run: () => {
      const th = toNum("theta");
      const t = toRad(th);
      const s = Math.sin(t), c = Math.cos(t);
      const sec = 1/c, csc = 1/s;

      const versin = 1 - c;
      const coversin = 1 - s;
      const haversin = (1 - c)/2;
      const hacoversin = (1 - s)/2;
      const exsec = sec - 1;
      const excsc = csc - 1;
      const chord = 2 * Math.sin(t/2);

      return [
        `θ = ${th} (${mode()})`,
        `versin(θ) = 1 − cosθ = ${versin}`,
        `coversin(θ) = 1 − sinθ = ${coversin}`,
        `haversin(θ) = (1 − cosθ)/2 = ${haversin}`,
        `hacoversin(θ) = (1 − sinθ)/2 = ${hacoversin}`,
        `exsec(θ) = secθ − 1 = ${exsec}`,
        `excsc(θ) = cscθ − 1 = ${excsc}`,
        `chord(θ) = 2·sin(θ/2) = ${chord}`
      ].join("\n");
    }
  },
  haversineDistance: {
    label: "Great-circle distance (haversine) — Earth",
    fields: [
      {id:"lat1",label:"Lat₁ (deg)"}, {id:"lon1",label:"Lon₁ (deg)"},
      {id:"lat2",label:"Lat₂ (deg)"}, {id:"lon2",label:"Lon₂ (deg)"}
    ],
    run: () => {
      // Always interpret lat/lon as degrees for input convenience
      const lat1=toNum("lat1")*Math.PI/180, lon1=toNum("lon1")*Math.PI/180;
      const lat2=toNum("lat2")*Math.PI/180, lon2=toNum("lon2")*Math.PI/180;
      const dφ = lat2 - lat1;
      const dλ = lon2 - lon1;
      const hav = (x)=> Math.sin(x/2)**2;
      const a = hav(dφ) + Math.cos(lat1)*Math.cos(lat2)*hav(dλ);
      const c = 2*Math.asin(Math.min(1, Math.sqrt(a)));
      const km = R_EARTH_KM * c;
      const miles = km / KM_PER_MILE;
      return `Distance ≈ ${km.toFixed(6)} km (${miles.toFixed(6)} mi)`;
    }
  },

  // --- Logs & Exponentials ---
  ln: {
    label: "Natural log ln(x)",
    fields: [{id:"x",label:"x (>0)"}],
    run: () => {
      const x = toNum("x");
      return Number.isFinite(x) && x>0 ? `ln(${x}) = ${Math.log(x)}` : "Domain error: x must be > 0.";
    }
  },
  logBase: {
    label: "Log base b of x",
    fields: [{id:"x",label:"x (>0)"},{id:"b",label:"base b (>0, ≠1)"}],
    run: () => {
      const x=toNum("x"), b=toNum("b");
      if (!(x>0) || !(b>0) || b===1) return "Domain error: x>0, b>0, b≠1.";
      return `log_${b}(${x}) = ${Math.log(x)/Math.log(b)}`;
    }
  },
  exp: {
    label: "e^x",
    fields: [{id:"x",label:"x"}],
    run: () => `e^x = ${Math.exp(toNum("x"))}`
  },

  // --- Discrete / Combinatorics ---
  factorial: {
    label: "Factorial n!",
    fields: [{id:"n",label:"n (integer ≥ 0)"}],
    run: () => {
      const n = toNum("n");
      const f = factorial(n);
      return Number.isFinite(f) ? `${n}! = ${f}` : "Overflow or invalid n (try n ≤ 170).";
    }
  },
  nCr: {
    label: "Combinations nCr",
    fields: [{id:"n",label:"n"},{id:"r",label:"r"}],
    run: () => {
      const n=toNum("n"), r=toNum("r");
      if (!Number.isInteger(n) || !Number.isInteger(r) || r<0 || n<0 || r>n) return "Require integers with 0 ≤ r ≤ n.";
      const val = factorial(n) / (factorial(r)*factorial(n-r));
      return `C(${n},${r}) = ${val}`;
    }
  },
  nPr: {
    label: "Permutations nPr",
    fields: [{id:"n",label:"n"},{id:"r",label:"r"}],
    run: () => {
      const n=toNum("n"), r=toNum("r");
      if (!Number.isInteger(n) || !Number.isInteger(r) || r<0 || n<0 || r>n) return "Require integers with 0 ≤ r ≤ n.";
      const val = factorial(n) / factorial(n-r);
      return `P(${n},${r}) = ${val}`;
    }
  }
};

// UI Wiring
const inputsHost = $("#inputs");
const resultBox = $("#result");
const select = $("#calc-select");

function renderFields(key){
  inputsHost.innerHTML = "";
  const cfg = CALCS[key];
  (cfg.fields || []).forEach(f => {
    const row = el("div", {class:"row"}, [
      el("label", {for:f.id}, [f.label]),
      el("input", {id:f.id, type:"number", step:"any", placeholder:f.placeholder || ""})
    ]);
    inputsHost.appendChild(row);
  });
  resultBox.textContent = "";
}

function compute(){
  const key = select.value;
  const cfg = CALCS[key];
  try{
    const out = cfg.run();
    resultBox.textContent = String(out);
  }catch(err){
    resultBox.textContent = "Error: " + err.message;
  }
}

select.addEventListener("change", e => renderFields(e.target.value));
document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener("change", () => {
  // angle mode only affects trig; no rerender needed
}));
$("#compute").addEventListener("click", compute);

renderFields(select.value);
