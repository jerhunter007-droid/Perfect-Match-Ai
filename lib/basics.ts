const CURRENT_YEAR = new Date().getFullYear();
export const GRAD_YEAR_OPTIONS = Array.from({ length: 55 }, (_, i) => String(CURRENT_YEAR + 6 - i));
export const PETS_OPTIONS = ["Dog", "Cat", "Bird", "Fish", "Reptile", "Amphibian", "Rabbit", "Other Pet", "Pet-Free", "Want a Pet", "Allergic to Pets"];
export const DRINKING_OPTIONS = ["Yes", "Sometimes", "Rarely", "Never"];
export const SMOKING_OPTIONS = ["Yes", "Sometimes", "Socially", "Never"];
export const CANNABIS_OPTIONS = ["Yes", "Sometimes", "Rarely", "Never"];
export const WORKOUT_OPTIONS = ["Everyday", "Often", "Sometimes", "Never"];
export const ORIENTATION_OPTIONS = ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Asexual", "Queer", "Questioning", "Other"];
export const RELATIONSHIP_GOALS_OPTIONS = ["Long-term relationship", "Long-term, open to short", "Short-term, open to long", "Short-term fun", "New friends", "Still figuring it out"];
export const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Mandarin", "Cantonese", "Arabic", "Hindi", "Portuguese", "Russian", "German", "Italian", "Japanese", "Korean", "Vietnamese", "Tagalog", "Polish", "Turkish", "Urdu", "Persian/Farsi", "Swahili"];
export const ZODIAC_OPTIONS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
export const FAMILY_PLANS_OPTIONS = ["Want kids", "Don't want kids", "Open to kids", "Have kids & want more", "Have kids & don't want more", "Not sure yet"];
export const EDUCATION_OPTIONS = ["High school", "Some college", "Associate's degree", "Bachelor's degree", "Master's degree", "PhD / Doctorate", "Trade / Vocational school", "Prefer not to say"];

export type Basics = {
  school: string; gradYear: string; jobTitle: string; company: string;
  orientation: string[]; relationshipGoals: string;
  languages: string[]; zodiac: string; familyPlans: string; education: string;
  pets: string[]; drinking: string; smoking: string; cannabis: string; workingOut: string;
};

export function emptyBasics(): Basics {
  return {
    school: "", gradYear: "", jobTitle: "", company: "",
    orientation: [], relationshipGoals: "",
    languages: [], zodiac: "", familyPlans: "", education: "",
    pets: [], drinking: "", smoking: "", cannabis: "", workingOut: "",
  };
}

export function isBasicsComplete(b: Basics) {
  return !!(b.relationshipGoals && b.zodiac && b.familyPlans && b.education &&
    b.drinking && b.smoking && b.cannabis && b.workingOut &&
    b.orientation.length > 0 && b.languages.length > 0 && b.pets.length > 0);
}
