"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { emptyBasics } from "@/lib/basics";
import ProfileForm, { type ProfileFormValues } from "@/components/ProfileForm";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
    });
    track("onboarding_viewed");
  }, [router]);

  async function handleSubmit(values: ProfileFormValues) {
    if (!userId) return;

    const { error: updateErr } = await supabase.from("profiles").update({
      name: values.name, age: Number(values.age), city: values.city, gender: values.gender,
      bio: values.bio, interests: values.interests, basics: values.basics,
      onboarding_status: "pending_verification",
    }).eq("id", userId);
    if (updateErr) throw updateErr;

    await supabase.from("profile_photos").delete().eq("profile_id", userId);
    await supabase.from("profile_photos").insert(values.photos.map((url, i) => ({ profile_id: userId, url, position: i })));

    await supabase.from("search_locations").delete().eq("profile_id", userId);
    await supabase.from("search_locations").insert({ profile_id: userId, city: values.city });

    track("profile_submitted", { interest_count: values.interests.length, photo_count: values.photos.length });
    router.push("/verify-identity");
  }

  if (!userId) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="pb-10">
      <p className="text-cyanDim text-xs tracking-widest font-mono">STEP 2 · BUILD YOUR PROFILE</p>
      <h2 className="text-2xl mt-2 mb-6">Tell the AI who you are.</h2>
      <ProfileForm
        userId={userId}
        initial={{ name: "", age: "", city: "", gender: "", bio: "", interests: [], basics: emptyBasics(), photos: [] }}
        submitLabel="Submit profile"
        savingLabel="Submitting…"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
