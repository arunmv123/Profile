const calculateCompletionPercentage = (profile: any): number => {
  let percentage = 0;

  // Personal Information (30%)
  if (profile.name && profile.address && profile.phoneNumber) {
    percentage += 30;
  }

  // Education (25%)
  if (profile.education && profile.education.length > 0) {
    percentage += 25;
  }

  // Work History (25%)
  if (profile.workHistory && profile.workHistory.length > 0) {
    percentage += 25;
  }

  // Skills (20%)
  if (profile.skills && profile.skills.length > 0) {
    percentage += 20;
  }

  return percentage;
};

export default calculateCompletionPercentage;
