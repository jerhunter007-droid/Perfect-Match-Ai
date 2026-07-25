"use client";
import {
  GRAD_YEAR_OPTIONS, PETS_OPTIONS, DRINKING_OPTIONS, SMOKING_OPTIONS, CANNABIS_OPTIONS, WORKOUT_OPTIONS,
  ORIENTATION_OPTIONS, RELATIONSHIP_GOALS_OPTIONS, LANGUAGE_OPTIONS, ZODIAC_OPTIONS, FAMILY_PLANS_OPTIONS, EDUCATION_OPTIONS,
  type Basics,
} from "@/lib/basics";

// These sub-components MUST live outside BasicsFields (module scope), not
// defined inside its function body. A component defined inside another
// component's render is a fresh function identity on every render, so React
// treats it as a brand-new component type each time -- it unmounts the old
// DOM node and mounts a new one instead of just updating it. For a text
// input, losing the DOM node loses focus, which on mobile means the
// keyboard drops after every single keystroke. Same root cause as the
// earlier Shell/Mono remount bug, just showing up here as a typing bug
// instead of a visual flicker.
function chip(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs border ${active ? "bg-cyan text-void border-cyan" : "bg-raised text-bone border-line"}`;
}

function SingleField({ label, options, value, onSelect }: { label: string; options: string[]; value: string; onSelect: (opt: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onSelect(opt)} className={chip(value === opt)}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

function MultiField({ label, options, max, value, onToggle }: { label: string; options: string[]; max?: number; value: string[]; onToggle: (opt: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs text-muted">{label}</label>
        {max && <span className="text-[10px] text-cyanDim font-mono">({value.length}/{max})</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onToggle(opt)} className={chip(value.includes(opt))}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label} <span className="text-[10px] text-muted">(optional)</span></label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]"
      />
    </div>
  );
}

export default function BasicsFields({ basics, onChange }: { basics: Basics; onChange: (b: Basics) => void }) {
  function set<K extends keyof Basics>(key: K, value: Basics[K]) {
    onChange({ ...basics, [key]: value });
  }
  function toggleMulti(key: "orientation" | "languages" | "pets", value: string, max?: number) {
    const arr = basics[key];
    if (arr.includes(value)) { set(key, arr.filter((v) => v !== value) as Basics[typeof key]); return; }
    if (max && arr.length >= max) return;
    set(key, [...arr, value] as Basics[typeof key]);
  }

  return (
    <div className="space-y-5">
      <TextField label="School" placeholder="e.g. University of Michigan" value={basics.school} onChange={(v) => set("school", v)} />
      <div>
        <label className="text-xs text-muted block mb-1.5">Graduation year <span className="text-[10px] text-muted">(optional)</span></label>
        <select value={basics.gradYear} onChange={(e) => set("gradYear", e.target.value)} className="w-full rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]">
          <option value="">Select a year</option>
          {GRAD_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <TextField label="Job title" placeholder="e.g. Product Designer" value={basics.jobTitle} onChange={(v) => set("jobTitle", v)} />
      <TextField label="Company" placeholder="e.g. Freelance" value={basics.company} onChange={(v) => set("company", v)} />
      <MultiField label="Sexual orientation" options={ORIENTATION_OPTIONS} max={3} value={basics.orientation} onToggle={(opt) => toggleMulti("orientation", opt, 3)} />
      <SingleField label="Relationship goals" options={RELATIONSHIP_GOALS_OPTIONS} value={basics.relationshipGoals} onSelect={(opt) => set("relationshipGoals", opt)} />
      <MultiField label="Languages I know" options={LANGUAGE_OPTIONS} max={6} value={basics.languages} onToggle={(opt) => toggleMulti("languages", opt, 6)} />
      <SingleField label="Zodiac" options={ZODIAC_OPTIONS} value={basics.zodiac} onSelect={(opt) => set("zodiac", opt)} />
      <SingleField label="Family plans" options={FAMILY_PLANS_OPTIONS} value={basics.familyPlans} onSelect={(opt) => set("familyPlans", opt)} />
      <SingleField label="Education" options={EDUCATION_OPTIONS} value={basics.education} onSelect={(opt) => set("education", opt)} />
      <MultiField label="Pets" options={PETS_OPTIONS} max={5} value={basics.pets} onToggle={(opt) => toggleMulti("pets", opt, 5)} />
      <SingleField label="Drinking" options={DRINKING_OPTIONS} value={basics.drinking} onSelect={(opt) => set("drinking", opt)} />
      <SingleField label="Smoking" options={SMOKING_OPTIONS} value={basics.smoking} onSelect={(opt) => set("smoking", opt)} />
      <SingleField label="Cannabis" options={CANNABIS_OPTIONS} value={basics.cannabis} onSelect={(opt) => set("cannabis", opt)} />
      <SingleField label="Working out" options={WORKOUT_OPTIONS} value={basics.workingOut} onSelect={(opt) => set("workingOut", opt)} />
    </div>
  );
}
