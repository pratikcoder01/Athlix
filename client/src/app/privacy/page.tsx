import { PolicyDocument, PolicySection } from '../../components/shared/PolicyDocument';

export default function PrivacyPage() {
  return (
    <PolicyDocument title="Privacy notice draft" reviewStatus="Legal review pending">
      <PolicySection id="information" title="1. Information the build handles">
        <p>ATHLIX supports combat-sports profiles, coaching bookings, club administration, tournaments, community posts, training records, and experimental video feedback. Some screens contain sample content. Use test information until the project owner has reviewed this draft and confirmed a real-data pilot.</p>
        <ul>
          <li>Account information: name, email or phone where provided, account role and status, sign-in identifiers, and session records. Firebase sign-in supplies an identity identifier and available account details. The separate email/password API stores a password hash.</li>
          <li>Profile and coach details: biography, discipline, belt rank, achievements, location, social links, image URL, and, for coaches, experience, certifications, prices, availability, and publishing settings.</li>
          <li>Activity records: coaching requests and booking notes, private coach-client notes, training dates, duration, effort, focus, notes, and saved training plans.</li>
          <li>Club and event records: academy listings and locations, member names and optional emails, member codes, ranks, membership notes, attendance, tournament entries, divisions, brackets, match results, and event administration records.</li>
          <li>Community information: text posts, comments, reactions, reports, moderation actions, and in-app notifications. Free-text fields may contain personal information you choose to enter.</li>
          <li>Video analysis: the video you submit with a processing confirmation, account and job identifiers, a video content hash, processing status, pose and movement measurements, and experimental feedback.</li>
        </ul>
        <p>Avoid sensitive medical details, unnecessary personal information, and information or videos about other people without their permission. A club owner can enter member records for people who do not have an ATHLIX account.</p>
      </PolicySection>

      <PolicySection id="use-and-visibility" title="2. Use and visibility">
        <p>The build uses these records to authenticate accounts, display directories, manage requests and events, maintain training history, operate the community, and return requested analysis. Request logs record a generated request ID, method, route pattern, response status, duration, and completion status; infrastructure logging still needs owner verification.</p>
        <p>Profile cards and published coach, academy, and tournament directory information are available to other signed-in members. Profile cards include names and the profile fields above; they do not include account email, phone, or Firebase identifiers. Community posts and comments are shared in the signed-in feed. Do not treat these areas as private storage.</p>
        <p>Bookings are scoped to the athlete, coach, and administrator workflows. Training history and saved plans are scoped to the account. Academy member and attendance records are scoped to the academy owner or administrator. Coach-client notes are a coach workspace, not a community post. Administrators have access to selected operational and moderation workflows. These controls do not establish a reviewed organizational access policy.</p>
        <p>External image URLs and social links can contact another website when an image loads or a link is opened. The other website then handles that connection under its own practices.</p>
      </PolicySection>

      <PolicySection id="providers" title="3. Sign-in, AI, and video processing">
        <p>When configured, Google Firebase handles sign-in, including the available email, Google, and phone flows. ATHLIX verifies the sign-in token and maintains its own account and session records. The database deployment, hosting providers, storage locations, provider agreements, and infrastructure logs must be confirmed before release.</p>
        <p>Experimental provider AI is disabled by default. If the operator explicitly enables it, requests may be sent to Featherless and, if configured as a fallback, OpenRouter. A failed attempt can mean both providers receive the same request.</p>
        <ul>
          <li>Training-plan generation sends the selected discipline, training goal, available days, free-text notes, and the account&apos;s belt rank.</li>
          <li>Coach suggestions send the search query, optional location, and a bounded roster of published coaches, including their identifiers, names, discipline, rank, location, experience, certifications, prices, and availability.</li>
          <li>Recovery reminders send the weekly training-hour figures submitted for that request.</li>
        </ul>
        <p>Provider retention, processing locations, and use of prompts for model training have not been verified in this draft. Do not enter medical details or other sensitive information into AI requests. A generated training plan is stored in the account database only when it is saved.</p>
        <p>Video analysis follows a separate path: after your processing confirmation, the API forwards the upload to the configured internal pose-analysis worker. That worker produces pose measurements, rule-based movement feedback, and a local coaching report. The video workflow does not send the upload to Featherless or OpenRouter. Results are owner-scoped and are experimental observations rather than a medical assessment, identity check, or verified competition score.</p>
      </PolicySection>

      <PolicySection id="retention" title="4. Browser storage and retention">
        <ul>
          <li>ATHLIX keeps its access token in browser memory with a 15-minute lifetime. Its HttpOnly refresh cookie and server session have a seven-day absolute expiry; refreshing does not extend that original expiry. Logout revokes the session. Expired database session records are removed by a MongoDB TTL index, whose cleanup may run after expiry.</li>
          <li>Firebase sign-in uses memory persistence in this client. The browser stores the selected theme in local storage. Hosting and Firebase behavior outside this code still needs deployment review.</li>
          <li>Most other database records have no automatic purge period in the current build. Removing a training entry or community post/comment hides it through a deletion flag while retaining its record. Archiving an academy retains its member and attendance records. Cancelling a booking does not erase its history.</li>
          <li>The video worker removes temporary raw uploads and temporary output files after completion or failure, and cleans abandoned files at startup and during periodic cleanup. Completed or failed job records and results expire 15 minutes after their terminal update and are removed by periodic cleanup. Cleanup can be delayed by a service interruption. You can request removal of a finished result while it remains available.</li>
        </ul>
        <p>These are application-level behaviors. They do not promise immediate physical erasure from disks, backups, infrastructure logs, or third-party systems. Backup, log, account, and provider retention schedules remain owner decisions.</p>
      </PolicySection>

      <PolicySection id="choices" title="5. Choices and requests">
        <p>You can edit supported profile fields, manage available training and community records, log out, and use the video result removal control after processing finishes. Removing a record from a screen does not mean the underlying data has been permanently erased.</p>
        <p>The build does not currently provide a complete self-service account export or account-erasure workflow. A verified contact, identity-check process, request handling procedure, and response schedule must be established by the owner. The SAMPLE support address above is inactive; use the available project contact paths to check whether a real contact has been configured. The contact page prepares a draft in your email app and does not send a message itself.</p>
        <p>The owner must review eligibility, minors&apos; information, the applicable privacy requirements, and this notice before collecting real customer data. The proposed age example above is not an implemented age check. This draft will need a real effective date and a reviewed update process before publication as an operative privacy policy.</p>
      </PolicySection>
    </PolicyDocument>
  );
}
