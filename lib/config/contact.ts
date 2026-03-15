export const CONTACT_CONFIG = {
    RECIPIENT_EMAIL: process.env.CONTACT_TO_EMAIL || "shayanfaghani@gmail.com",
    FROM_EMAIL: process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev",
    MAX_MESSAGE_CHARS: 500,
} as const;

export const REQUEST_TYPES = [
    { value: "enhancement", label: "Request Enhancement" },
    { value: "bug", label: "Report a Bug" },
    { value: "other", label: "Something Else" },
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number]["value"];
