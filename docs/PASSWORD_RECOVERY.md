# Firebase password recovery

`/forgot-password` sends Firebase's real password-reset email. `/reset-password`
requires a single `mode=resetPassword` and `oobCode` pair, verifies the code with
`verifyPasswordResetCode`, then completes the operation with
`confirmPasswordReset`. The screen reports success only after Firebase confirms
the write. Missing, expired, used, weak-password and network failures have an
accessible recovery state. Untrusted `continueUrl` values are never followed, and
the consumed one-time code is removed from browser history after success.

In Firebase Console, configure the password-reset email template's custom action
handler to `https://<your-client-domain>/reset-password`. Add the client domain to
authorized domains. Use the correct `NEXT_PUBLIC_FIREBASE_*` configuration and
test real delivery/code expiry in a non-production project before launch.
See [Firebase's custom email handler documentation](https://firebase.google.com/docs/auth/custom-email-handler).
Changing the email template is an operator setup step; this work does not send
emails or modify a Firebase project.

Firebase cannot reset a legacy MongoDB bcrypt password. Such accounts must first
link a verified Firebase identity using the protected account-linking policy, or
use a separately reviewed identity-recovery process. The UI explains that limit;
there is no fake legacy password-reset endpoint or invented delivery success.

Unit regressions cover malformed/duplicate action parameters, safe error mapping
and ignored continuation URLs. Browser smoke tests intercept Firebase's transport
to verify the real SDK/UI verify-confirm sequence and rejection states. Actual
email delivery, provider credentials and recovery of existing legacy identities
remain **NOT RUN** in this environment.
