export interface ContactDraft {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const getContactEmail = (): string | null => {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return email && /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) ? email : null;
};

/** Opens a draft for the user to review and send; this does not deliver mail. */
export const buildContactMailto = (recipient: string, draft: ContactDraft): string => {
  const body = `Name: ${draft.name}\nReply email: ${draft.email}\n\n${draft.message}`;
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(body)}`;
};
