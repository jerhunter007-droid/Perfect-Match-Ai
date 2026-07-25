"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { emptyBasics, type Basics } from "@/lib/basics";
import ProfileForm, { type ProfileFormValues } from "@/components/ProfileForm";

export default function EditProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [initial, setInitial] = useState<ProfileFormValues | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);
      track("edit_profile_viewed");

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      const { data: photos } = await supabase.from("profile_photos").select("url").eq("profile_id", session.user.id).order("position");

      if (!profile) { router.push("/onboarding"); return; }
      setInitial({
        name: profile.name || "",
        age: profile.age ? String(profile.age) : "",
        city: profile.city || "",
        gender: profile.gender || "",
        bio: profile.bio || "",
        interests: profile.interests || [],
        basics: (profile.basics as Basics) || emptyBasics(),
        photos: (photos ?? []).map((p) => p.url),
      });
    })();
  }, [router]);

  async function handleSubmit(values: ProfileFormValues) {
    if (!userId) return;

    // deliberately does NOT touch onboarding_status or identity_verified —
    // editing a bio shouldn't send someone back through photo verification
    const { error: updateErr } = await supabase.from("profiles").update({
      name: values.name, age: Number(values.age), city: values.city, gender: values.gender,
      bio: values.bio, interests: values.interests, basics: values.basics,
    }).eq("id", userId);
    if (updateErr) throw updateErr;

    await supabase.from("profile_photos").delete().eq("profile_id", userId);
    await supabase.from("profile_photos").insert(values.photos.map((url, i) => ({ profile_id: userId, url, position: i })));

    // search_locations is now independently managed on the Filters page —
    // editing your bio/photos here shouldn't wipe out extra locations a
    // premium user has added there.

    track("profile_updated", { interest_count: values.interests.length, photo_count: values.photos.length });
    router.push("/account");
  }

  if (!initial || !userId) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="pb-10">
      <button onClick={() => router.push("/account")} className="text-muted text-xl mb-4 w-9 h-9 flex items-center justify-center -ml-2">←</button>
      <p className="text-cyanDim text-xs tracking-widest font-mono">EDIT PROFILE</p>
      <h2 className="text-2xl mt-2 mb-6">Keep it current.</h2>
      <ProfileForm
        userId={userId}
        initial={initial}
        submitLabel="Save changes"
        savingLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
