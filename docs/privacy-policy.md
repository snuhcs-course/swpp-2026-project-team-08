<!-- AI-generated with GPT-6, 2026-11-12, reviewed by Seoyeon Heo -->
<!-- Changed: Apply retention, deletion, and caregiver account policies -->

# NurtureBites Privacy Policy

> Effective date: 2026. 11. 12.

## 1. Who we are

NurtureBites helps caregivers record meals, understand food responses, and explore personalized
meal ideas for children with sensory-selective eating.

The service is operated by **Team 8, Principles and Practices of Software Development,
Seoul National University (서울대학교 소프트웨어 개발의 원리와 실습 과목 8조)**,
comprising 김도연, 김재민, 정해찬, and 허서연 (the “NurtureBites team,” “we,” “us”).
This identifies the student project team; it does not identify Seoul National University itself as
the service operator or imply university endorsement.

- Privacy contact: **best3487@snu.ac.kr**
- Privacy requests are handled by the NurtureBites team through the contact email above.

This policy covers the NurtureBites Android and iOS apps and their supporting API.
If a web version is offered, the additional photo handling described below also applies.

## 2. Information we process

We receive information you enter, information stored by the app on your device, and information
processed when your device communicates with our service providers.

| Category | Information | Purpose and storage |
| --- | --- | --- |
| Account information | Name, email address, internal account ID, password hash, account creation and update times | Account registration, authentication, account management, and support; stored on the server. Passwords are processed for authentication and stored as hashes rather than readable passwords. |
| Child profile | Child name or nickname, age group, allergies, dietary restrictions, dietary pattern, familiar or safe foods, preparation and presentation notes | Maintain a child profile and personalize meal ideas; stored on the server and cached on the device. Allergies and related information can be sensitive health information. |
| Meal records | Meal date, meal type, selected meal setting, food names, ingredients, cooking methods, food and ingredient outcomes, difficulty reasons, and information you enter in supported notes fields | Record and display meal history and personalize suggestions; stored on the server and in local drafts or caches. A selected meal setting is not GPS location. |
| Suggestions and feedback | Generated suggestions, saved or dismissed suggestions, dismissal reasons, and records of trying a suggestion | Display suggestions, avoid repeating dismissed ideas, and connect suggestions to meal records; stored on the server. |
| Optional photos and photo references | Before- and after-meal photos and their URI/path references | Display meal photos. In the native mobile apps, photo files are copied to app storage on the device; photo URI/path strings are also submitted to the API and stored with the meal record. |
| Consent records | Consent category, choice, document version, and time recorded | Record the choices submitted during onboarding; stored on the server. |
| Authentication and local app data | Access and refresh tokens, cached account/profile information, unfinished records, and language preference | Maintain your session and restore your work on your device. On supported native devices, tokens use the operating system's secure storage. |
| Technical connection and operational data | IP address, request metadata, timestamps, response status, and diagnostic information where generated or logged | Deliver API requests and maintain service security and reliability. Logging and retention depend on the deployed infrastructure; see Section 6. |
| Privacy and support correspondence | Your email address, request, and the minimum information needed to verify your authority, including information submitted through our Google Forms deletion request form | Respond to questions and rights requests. Do not submit passwords or unnecessary information about a child. |

Please use a nickname where possible and avoid entering identifying information in food names or
free-text notes. We do not need a child's exact date of birth, government identifier, medical record
number, or diagnosis document for the current meal-recording features.

### Photos

Adding a photo is optional. The current version does not analyze photos with AI or send photos to
the recommendation model for training or inference. Native photo URI strings can contain local
file-path information; they are not the photo bytes themselves.

In a web version, a photo URI can be a data URL containing the actual image. If submitted as a meal
photo reference, that image data is transmitted to and stored by the API. The mobile-only statement
that photo bytes remain on the device does not apply to those web submissions.

Photos may contain personal information such as faces, documents, or location metadata. Avoid
including people or identifying details. We do not promise that all embedded metadata is removed.

## 3. How we use information

We use the information described above to:

- Create and authenticate accounts and support account management.
- Save child profiles, meal records, and food responses.
- Generate and display personalized meal suggestions and record your feedback.
- Restore unfinished work and apply your language preference.
- Maintain service security, investigate errors, and respond to support and privacy requests.
- Meet applicable legal obligations and address valid legal requests.

We do not sell personal information, operate targeted advertising, or use child or health information
for advertising. The current app does not integrate advertising or third-party analytics SDKs.
We do not access contacts, precise GPS location, microphone recordings, HealthKit, or Health Connect
for the current features.

## 4. AI suggestions and external processing

When a recommendation request is made, our server uses **OpenRouter** to route a text request to an
external model provider. The request can include:

- Food names, cooking methods, ingredients, and internal food record identifiers.
- Food and ingredient outcomes and reasons the child found a food difficult.
- Familiar foods, previously eaten foods, preparation notes, and presentation notes.
- Previous suggestions and dismissal reasons when generating alternative suggestions.
- A list of ingredients permitted by the profile's restrictions.

The permitted ingredient list reflects the child's dietary restrictions, even when the raw restriction
list is not included. Free-text fields may disclose personal or health information if you enter it.
The recommendation prompt does not intentionally include account email addresses, passwords,
child names, or photo files. This is data minimization, not a guarantee of anonymization.

OpenRouter forwards the request to the model provider. The generated response returns through
OpenRouter and is saved as a suggestion linked to your account.

- Routing provider: **OpenRouter, Inc.** — [Privacy Policy](https://openrouter.ai/privacy).
- Model providers and processing locations are listed in Section 5; retention is described in Section 6.

OpenRouter states that it does not use API inputs or outputs for model training, but model-provider
practices vary. Our policy requires approved model routes that do not use prompts or responses for
training, with zero retention of prompt and response content where supported. Routes that do not
meet the approved data-handling requirements must not receive personal or sensitive information.
The actual provider commitments, any exceptions, and metadata retention must be confirmed in
Sections 5 and 6 before AI processing is enabled under this policy.

We do not currently run our own training or research program using your meal records or photos.
An optional onboarding choice labelled “AI training and model research” does not by itself authorize
an unspecified future research project or explain downstream provider practices.

Before personal or sensitive data is sent to external AI providers, the app must explain the recipients,
data, purpose, and applicable retention and obtain explicit permission. Declining or withdrawing
permission must prevent future AI transfers. You may request withdrawal through the privacy contact
in Section 7.

Suggestions are generated automatically and may be incorrect. They are informational meal ideas,
not a diagnosis, treatment, or a substitute for professional allergy or medical advice.

## 5. Service providers, disclosures, and international transfers

| Recipient | Role and information processed | Location and retention |
| --- | --- | --- |
| Amazon Web Services, under the operator's AWS account | API hosting on EC2, database storage on RDS, and request delivery through CloudFront; account, profile, meal, suggestion, consent, and technical information as necessary for these services | Deployment documents specify Sydney, Australia (`ap-southeast-2`) for EC2/RDS. CloudFront uses global infrastructure. Retention is described in Section 6. |
| OpenRouter, Inc. | Route recommendation prompts and responses to model providers; the text described in Section 4 | Retention is described in Section 6. |
| Selected external model provider(s) | Generate recommendations using the text described in Section 4 | Retention is described in Section 6. |
| Support email provider | Deliver and store correspondence sent to `best3487@snu.ac.kr` | Retention is described in Section 6. |
| Google, through Google Forms | Receive account deletion requests and store submitted responses; email address, request details, and submission metadata | See [Google's Privacy Policy](https://policies.google.com/privacy). Retention of team-controlled responses is described in Section 6. |

Our team operates from South Korea. Information may therefore be accessed in South Korea as well
as processed in the locations above. Overseas laws and government-access rules can differ from
those in your country.

We disclose information to these providers only for the described functions, and may disclose the
minimum necessary information when required by applicable law or a valid legal process.
We do not publish your profile or meal records to other users.

Where required, we obtain separate consent or implement another valid legal basis and appropriate
transfer safeguards before an international transfer. Transfers occur electronically when the relevant
feature is used; hosted records remain with the hosting provider during the applicable retention period.
You may request withdrawal through the privacy contact in Section 7. Stopping transfers needed to
provide a feature may make that feature unavailable.
An acceptance of this policy alone is not a blanket authorization for all overseas processing.

## 6. Retention and deletion

| Information | Retention rule |
| --- | --- |
| Active account and associated server records | Kept to provide the service while the account is active. A successful account deletion removes the account and associated profile, meals, suggestions, consent records, and email-change attempts from the active application database. |
| Backups and replicas | Backup and replica copies expire or are deleted within 7 days after deletion from the active database. Until then, retained backup copies are restricted to recovery purposes; deletion requests are reapplied before restored data is returned to active use. |
| Infrastructure and security logs | Operational and security logs are retained for up to 30 days to investigate errors, protect the service, and detect abuse. |
| AI-provider requests and responses | Deleting a NurtureBites account is not a guarantee of immediate deletion from every provider's logs. |
| Support and privacy requests, including deletion form responses | Support correspondence and privacy-request records are deleted within 90 days after resolution. This period allows follow-up and confirmation that a request was handled. It includes team-controlled Google Forms responses, linked response spreadsheets, exported copies, and mailbox copies. |
| Local drafts, caches, and photo files | Remain until cleared through implemented app/device controls or deletion of app data. Account deletion clears account-related local records, but the current implementation does not establish that copied photo files are erased. See Appendix A before publication. |

If applicable law requires information to be retained after deletion, we limit retention to the
information and period required for that purpose and explain any applicable exception when
responding to the deletion request.

Information is removed from active systems using deletion procedures; retained backups expire
under the confirmed schedule above. App deletion or logout alone does not delete a server account.
Photos originally held in your camera roll or other user-controlled storage are not removed by
deleting your NurtureBites account.

## 7. Your choices and rights

You can edit supported account and child-profile fields through the app. For access, a copy of your
information, correction, deletion, withdrawal of consent, or restriction of processing, contact
**best3487@snu.ac.kr**. Depending on applicable law, you may also have portability and objection
rights and a right to complain to a competent privacy regulator. We do not charge for ordinary
rights requests or discriminate against you for making one, subject to exceptions allowed by law.

We verify identity and authority using proportionate information and respond within the deadline
required by applicable law. Do not send identity documents unless a secure and necessary verification
method has been agreed. Withdrawing consent does not change the lawfulness of earlier processing.

### Delete your account

- In the app: open **My Page → Delete Account** and complete the confirmation.
- Without the app: submit the [NurtureBites account deletion request form](https://docs.google.com/forms/d/e/1FAIpQLSe9Og5lM9Ab2BwP34J3olsUTffhNVmB18HA7xJkCYBEaeifeA/viewform).
- You may also email **best3487@snu.ac.kr**, with “NurtureBites account deletion” as the subject,
  from your registered email address. Never include your password.

An authorized parent or guardian may request review or deletion of a child's information and ask us
to stop further collection. We may need to verify parental authority.

We complete verified external deletion requests within 7 days after verification, or sooner where
applicable law requires. Backup copies then expire within the additional period described in
Section 6. We notify you when the request has been completed and explain any lawful retention.

## 8. Children and sensitive information

NurtureBites accounts are for caregivers aged 18 or older. Children do not create or use accounts
directly. The service supports caregiving for children of different ages; an all-ages content rating
does not change the account eligibility requirement.
Allergies, dietary restrictions, and food-response records can reveal sensitive information about a
child even when a caregiver enters them.

Only provide information about a child when you have the required legal authority. When the law
requires parental authorization, verifiable parental consent, or the child's own valid consent,
that authorization must be obtained before the relevant collection or disclosure. A caregiver
checkbox alone does not necessarily establish parental authority.

If you believe information about a child has been collected without the required authorization,
contact **best3487@snu.ac.kr**. We will investigate, stop unauthorized processing, and arrange
deletion as appropriate. This policy does not claim that age verification or a verified parental
consent system already exists.

## 9. Device permissions and security

The app requests camera access when you choose to take a meal photo and photo-library access
where required when you select an existing image. A file picker accesses the image you select.
You can decline or revoke permissions in device settings; meal records can be entered without photos.

We hash account passwords and restrict account data through authenticated API access.
The documented production API uses HTTPS between your device and CloudFront.
We do not claim end-to-end encryption or that every local cache is encrypted.

No system can guarantee absolute security. If a personal-data incident occurs, we investigate,
take containment measures, and provide notifications required by applicable law.

## 10. Changes and contact

We update this policy and its effective date when our privacy practices change. Where required,
we provide additional notice before material changes take effect. A new use, sensitive-data use,
or external disclosure requiring consent will not rely solely on an updated policy or continued app use.

For questions, complaints, or rights requests, contact **best3487@snu.ac.kr**.
