"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { INTEREST_CATEGORIES, MIN_INTERESTS, MIN_BIO_WORDS } from "@/lib/constants";
import { isBasicsComplete, type Basics } from "@/lib/basics";
import { compressImage } from "@/lib/compressImage";
import BasicsFields from "@/components/BasicsFields";

const MIN_PHOTOS = 6;
const MAX_PHOTOS = 8;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type ProfileFormValues = {
  name: string; age: string; city: string; gender: string; bio: string;
  interests: string[]; basics: Basics; photos: string[];
};

export default function ProfileForm({
  userId, initial, submitLabel, savingLabel, onSubmit,
}: {
  userId: string;
  initial: ProfileFormValues;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [age, setAge] = useState(initial.age);
  const [city, setCity] = useState(initial.city);
  const [gender, setGender] = useState(initial.gender);
  const [bio, setBio] = useState(initial.bio);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [basics, setBasics] = useState<Basics>(initial.basics);
  const [photos, setPhotos] = useState<string[]>(initial.photos);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleInterest(tag: string) {
    setInterests((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      return prev.length >= 40 ? prev : [...prev, tag];
    });
  }

  async function addPhoto(file: File | undefined) {
    if (!file || photos.length >= MAX_PHOTOS) return;
    if (file.size > 8 * 1024 * 1024) { setError("That photo is over 8MB — try a smaller file."); return; }
    setUploading(true);
    setError("");
    const compressed = await compressImage(file);
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadErr } = await supabase.storage.from("profile-photos").upload(path, compressed);
    setUploading(false);
    if (uploadErr) { setError("Couldn't upload that photo — please try again."); return; }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    setPhotos((prev) => [...prev, data.publicUrl]);
  }

  const bioWords = wordCount(bio);
  const ageNum = Number(age);
  const ageValid = age !== "" && ageNum >= 18 && ageNum <= 100;
  const canSubmit = name.trim() && ageValid && city.trim() && gender && bioWords >= MIN_BIO_WORDS
    && interests.length >= MIN_INTERESTS && photos.length >= MIN_PHOTOS && photos.length <= MAX_PHOTOS
    && isBasicsComplete(basics);

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), age, city: city.trim(), gender, bio, interests, basics, photos });
    } catch (e: any) {
      setError("Couldn't save your profile — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs text-muted">Photos</label>
          <span className={`text-xs font-mono ${photos.length >= MIN_PHOTOS ? "text-cyan" : "text-red"}`}>{photos.length}/8 · {MIN_PHOTOS} min</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "3/4" }}>
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-void/80 text-sm text-white flex items-center justify-center">×</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="rounded-lg border border-dashed border-line bg-surface flex items-center justify-center cursor-pointer" style={{ aspectRatio: "3/4" }}>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto(e.target.files?.[0])} />
              <span className="text-muted text-xs">{uploading ? "…" : "+ Add"}</span>
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-1">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoComplete="given-name" className="rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]" />
        <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Age" inputMode="numeric" className="rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" autoComplete="address-level2" className="rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none col-span-2 min-h-[44px]" />
      </div>
      {age !== "" && !ageValid && <p className="text-red text-[11px] font-mono mb-4">Must be 18 or older to use Perfect Match.</p>}
      {(age === "" || ageValid) && <div className="mb-5" />}

      <div className="mb-5">
        <label className="text-xs text-muted block mb-1.5">Gender</label>
        <div className="flex gap-2">
          {["Woman", "Man", "Non-binary", "Other"].map((g) => (
            <button key={g} onClick={() => setGender(g)} className={`rounded-full px-3 py-1.5 text-xs border ${gender === g ? "bg-cyan text-void border-cyan" : "bg-surface text-bone border-line"}`}>{g}</button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs text-muted">Your bio</label>
          <span className={`text-xs font-mono ${bioWords >= MIN_BIO_WORDS ? "text-cyan" : "text-red"}`}>{bioWords}/{MIN_BIO_WORDS} words min</span>
        </div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={7} placeholder="Skip 'I love to laugh and travel.' Tell it something true." className="w-full rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none resize-none" />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-muted">Interests</label>
          <span className={`text-xs font-mono ${interests.length >= MIN_INTERESTS ? "text-cyan" : "text-red"}`}>{interests.length} selected — {MIN_INTERESTS} min</span>
        </div>
        <div className="space-y-2">
          {INTEREST_CATEGORIES.map((cat) => {
            const count = cat.options.filter((o) => interests.includes(o)).length;
            const isOpen = openCategory === cat.name;
            return (
              <div key={cat.name} className="rounded-lg border border-line bg-surface overflow-hidden">
                <button onClick={() => setOpenCategory(isOpen ? null : cat.name)} className="w-full flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-cyanDim font-mono">{cat.name.toUpperCase()} {count > 0 && <span className="text-cyan">({count})</span>}</span>
                  <span className="text-muted text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {cat.options.map((tag) => (
                      <button key={tag} onClick={() => toggleInterest(tag)} className={`rounded-full px-3 py-1.5 text-xs border ${interests.includes(tag) ? "bg-cyan text-void border-cyan" : "bg-raised text-bone border-line"}`}>{tag}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-cyanDim font-mono mb-1">THE BASICS</p>
        <p className="text-[11px] text-muted mb-4">School, job, and company are optional — everything else helps the AI find real overlap.</p>
        <BasicsFields basics={basics} onChange={setBasics} />
      </div>

      {error && <p className="text-red text-xs mb-3 font-mono">{error}</p>}
      <button disabled={!canSubmit || saving} onClick={submit} className="w-full rounded-full py-4 font-semibold text-base bg-cyan text-void disabled:opacity-40 disabled:bg-raised disabled:text-muted min-h-[44px]">
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}
