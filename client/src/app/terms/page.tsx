import Link from 'next/link';
import { PolicyDocument, PolicySection } from '../../components/shared/PolicyDocument';

export default function TermsPage() {
  return (
    <PolicyDocument title="Service terms draft" reviewStatus="Legal review pending">
      <PolicySection id="scope" title="1. Development service and draft status">
        <p>ATHLIX is a development project for combat-sports clubs, coaching requests, local events, training history, community activity, and experimental kata feedback. Availability depends on configured services and the pilot setup. Some screens contain illustrative sample content.</p>
        <p>This page is a working draft for owner and legal review. The SAMPLE operator, country, contact, and age details above are editable examples. They do not establish a real contracting party, governing law, dispute venue, age rule, or effective agreement. Before a real-data pilot, the owner must finalize those decisions and publish reviewed terms and a privacy notice.</p>
      </PolicySection>

      <PolicySection id="accounts" title="2. Accounts and access">
        <p>Use an account you control and keep sign-in credentials private. Provide accurate information you are permitted to share. Public registration creates an athlete account; coach, academy owner, organizer, and administrator access require separate provisioning. A displayed role or profile does not by itself verify identity, qualifications, coaching credentials, or sporting ability.</p>
        <p>Registration currently has no age gate. The proposed age example above is unconfirmed. The project owner must define who can join and how minors&apos; participation and guardian permissions will be handled before inviting real participants.</p>
        <p>Do not attempt to access another person&apos;s account or private records, bypass access controls, overload the service, or submit malicious files. Log out on shared devices and use session controls when available.</p>
      </PolicySection>

      <PolicySection id="content" title="3. Profiles, community, and club records">
        <p>Share only content you own or have permission to use, including videos, photographs, names, and club records. Do not post harassment, threats, impersonation, private contact details about other people, or misleading qualifications. Profile and directory information and community content can be visible to other signed-in members.</p>
        <p>Academy owners must confirm permission before creating a member record and should limit notes to information needed for club administration. Do not use free-text fields for unnecessary medical or other sensitive details. This confirmation is not a substitute for the owner&apos;s review of the process.</p>
        <p>Authors can edit or remove supported posts and comments, and signed-in members can report community content. Moderators can hide content, dismiss reports, and record review actions. Removal changes visibility and retains underlying records. The owner still needs to finalize content-use permissions, moderation standards, escalation, and appeal procedures.</p>
      </PolicySection>

      <PolicySection id="bookings-events" title="4. Coaching, bookings, and events">
        <p>Coach listings describe coach-entered experience, credentials, rates, and availability. Confirm suitability, timing, location, equipment, and any off-platform arrangements directly with the coach or organizer. A request, confirmed booking, or tournament entry records a workflow status; it does not prove that a session or event occurred.</p>
        <p>Paid subscriptions, checkout, and automatic billing are not available. Displayed coach prices or event entry fees do not mean ATHLIX has collected payment. Cancellation and status controls maintain operational records. Any payment, refund, cancellation, or event participation rules for a future paid service need a separate reviewed decision before launch.</p>
        <p>Tournament brackets, match results, and training entries depend on information entered by participants or authorized organizers. Check relevant records with the responsible coach, club, or organizer. The build does not certify competition results or guarantee an event&apos;s operation.</p>
      </PolicySection>

      <PolicySection id="experimental" title="5. Experimental feedback and AI">
        <p>Video feedback uses experimental two-dimensional pose measurements and movement heuristics. Camera position, visibility, recording quality, and the movement performed affect the result. Scores and coaching comments are practice observations, not validated accuracy measures, official judging, medical advice, diagnosis, or a promise of injury prevention. Discuss training decisions with a qualified coach and use suitable supervision.</p>
        <p>Provider AI coaching is disabled by default. If enabled, generated plans, recovery reminders, and coach suggestions can be incomplete or wrong and need human review. A match score is a suggestion, not credential verification or a measured sporting skill. Do not rely on automated output for medical or emergency decisions.</p>
        <p>Before submitting a video, confirm that you have permission for everyone shown and agree to the server-side processing described in the upload flow. The internal video worker is separate from the optional Featherless/OpenRouter text-AI path. Review the <Link href="/privacy#providers">privacy draft&apos;s provider and video details</Link> before using those features.</p>
      </PolicySection>

      <PolicySection id="records" title="6. Data, removal, and contact">
        <p>The <Link href="/privacy">privacy draft</Link> explains the current data flows and application retention behavior. Most database records have no automatic purge. Training and community removal preserve underlying records, academy archive preserves member and attendance history, and booking cancellation preserves its record. Video results have a separate short expiry and a finished-result removal control.</p>
        <p>There is no complete self-service account export or account-erasure workflow in this build. The owner must establish a verified support contact and a request process before release. The SAMPLE email above is inactive. The <Link href="/contact">project contact page</Link> shows whether a real contact has been configured and prepares email drafts; ATHLIX does not send that message.</p>
      </PolicySection>

      <PolicySection id="release-review" title="7. Decisions required before release">
        <p>The owner must review service availability, support responsibilities, permitted use, content permissions, eligibility, suspension and termination, record handling, and how future changes will be communicated. Any warranty, liability, consumer, payment, governing-law, or dispute provisions require a real operator and appropriate review; this technical draft does not resolve them.</p>
        <p>No effective date or acceptance mechanism is asserted here. Keep the pending-review notice in place until the real details, supporting operations, and final documents have been approved by the responsible owner and reviewer.</p>
      </PolicySection>
    </PolicyDocument>
  );
}
