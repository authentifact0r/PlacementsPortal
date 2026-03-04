/**
 * PlacementPortal — Firebase Cloud Functions
 * ==========================================
 * Handles server-side Vapi outbound calls for the
 * Business Development / Social Values Call Agent.
 * Keeps API keys off the client.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "europe-west2" }); // London region

// ── Vapi System Prompt — Social Values / BD Key Manager ──────────────────────
function buildPlacementSystemPrompt(business) {
  return `You are Jordan, a Social Values and Business Development Manager calling on behalf of the Placement Portal, a graduate work placement initiative supporting underrepresented talent in London.

Your mission is to have a warm, professional conversation with ${business.name || "the business"} to explore whether they would welcome a motivated graduate student for a 7.5-month industrial work placement — at absolutely zero cost to their business.

KEY TALKING POINTS:
- Completely free: no salary, no fees, no cost whatsoever to the business
- The student is a mature graduate — ready to work independently with zero supervision needed
- They arrive eager to contribute to real, live projects from day one
- 7.5-month placement (June to January) — long enough to make a genuine impact
- London-based students, placing locally within the business's area
- We handle all university coordination, compliance, and paperwork
- A small optional travel stipend of £40/week is suggested but not mandatory
- Our Quality Assurance team will visit the business to ensure a great fit for both sides

OBJECTION HANDLING:
- "We can't afford staff" → "There's absolutely no cost — not even a salary. The student is fully funded through the university."
- "We don't have time to supervise" → "These are mature graduates who work independently. They won't need hand-holding — they need opportunity."
- "We're too busy" → "That's exactly why this works — a self-sufficient graduate handles tasks that free up your team."
- "We've done this before and it didn't work" → "Our QA team personally visits every business beforehand to make sure expectations are crystal clear on both sides."
- "Not the right time" → "The placement starts June 1st — that gives us time to find the perfect match for your specific needs."
- "Send me information" → "Absolutely — what's the best email? And while I have you, is there a specific skill gap in your team right now that a sharp graduate could help with?"

YOUR GOAL: Book a QA assessment visit or get an email address to send the partnership agreement.

Business context: ${business.industry || "business"} based in ${business.borough || "London"}.
${business.contact_name ? `Ask to speak with ${business.contact_name}.` : "Ask for the person responsible for staffing or operations."}

Keep calls warm, conversational, and under 5 minutes. Lead with social impact — you're offering them a chance to support a young person's career while getting real work done.`;
}

// ── Trigger Outbound Vapi Call ────────────────────────────────────────────────
exports.triggerPlacementCall = onCall(
  { secrets: ["VAPI_API_KEY", "VAPI_PLACEMENT_PHONE_NUMBER_ID"] },
  async (request) => {
    const { businessId } = request.data;

    if (!businessId) {
      throw new HttpsError("invalid-argument", "businessId is required");
    }

    // Fetch business from Firestore
    const doc = await db.collection("placement_businesses").doc(businessId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Business not found");
    }

    const business = { id: doc.id, ...doc.data() };

    if (!business.phone) {
      throw new HttpsError("failed-precondition", "Business has no phone number");
    }

    const vapiKey = process.env.VAPI_API_KEY;
    const phoneNumberId = process.env.VAPI_PLACEMENT_PHONE_NUMBER_ID;

    if (!vapiKey) {
      // No Vapi key — return tel link for manual call
      return {
        mode: "manual",
        phone: business.phone,
        message: "No Vapi API key configured. Call manually.",
      };
    }

    try {
      const response = await axios.post(
        "https://api.vapi.ai/call",
        {
          type: "outboundPhoneCall",
          phoneNumberId,
          customer: {
            number: business.phone.replace(/\s/g, ""),
            name: business.name,
          },
          assistant: {
            firstMessage: `Hi, good ${getTimeOfDay()}! Could I speak with ${business.contact_name || "whoever looks after staffing or business development"}? My name's Jordan — I'm calling from the Placement Portal about a graduate work placement opportunity that might be of interest.`,
            model: {
              provider: "openai",
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: buildPlacementSystemPrompt(business),
                },
              ],
            },
            voice: {
              provider: "11labs",
              voiceId: "EXAVITQu4vr4xnSDxMaL", // "Bella" — warm, professional British female
            },
            silenceTimeoutSeconds: 8,
            maxDurationSeconds: 360, // 6 min max
            endCallMessage: "Wonderful, I'll send that over right away. It was lovely speaking with you — have a great day!",
          },
          metadata: {
            business_id: businessId,
            business_name: business.name,
            portal: "placement",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${vapiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const callData = response.data;

      // Update Firestore
      await db.collection("placement_businesses").doc(businessId).update({
        vapi_call_id: callData.id,
        outreach_stage: "call_attempted",
        last_contacted_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        mode: "vapi",
        call_id: callData.id,
        status: callData.status,
        message: `Call initiated to ${business.name}`,
      };
    } catch (err) {
      console.error("Vapi call error:", err.response?.data || err.message);
      return {
        mode: "manual",
        phone: business.phone,
        message: "Vapi call failed — use manual call.",
        error: err.message,
      };
    }
  }
);

// ── Log Call Outcome (called after call ends) ─────────────────────────────────
exports.logPlacementCall = onCall(async (request) => {
  const { businessId, outcome, sentiment, durationMins, summary, nextAction, qaBooked } = request.data;

  if (!businessId) throw new HttpsError("invalid-argument", "businessId required");

  const docRef = db.collection("placement_businesses").doc(businessId);
  const doc = await docRef.get();
  if (!doc.exists) throw new HttpsError("not-found", "Business not found");

  const existing = doc.data().call_notes ? JSON.parse(doc.data().call_notes) : [];
  const newEntry = {
    id: `log_${Date.now()}`,
    logged_at: new Date().toISOString(),
    outcome: outcome || "answered",
    sentiment: sentiment || "neutral",
    duration_mins: durationMins || 0,
    summary: summary || "",
    next_action: nextAction || "follow_up",
    qa_booked: qaBooked || false,
  };

  const updates = {
    call_notes: JSON.stringify([newEntry, ...existing]),
    call_sentiment: sentiment || "neutral",
    last_contacted_at: admin.firestore.FieldValue.serverTimestamp(),
    outreach_stage: qaBooked ? "qa_booked" : "call_attempted",
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (qaBooked) updates.status = "qa_scheduled";

  await docRef.update(updates);
  return { success: true };
});

// ── Send Welcome Email via Resend when business status → active ───────────────
exports.onBusinessActivated = onDocumentCreated(
  "placement_businesses/{businessId}",
  async (event) => {
    const business = event.data.data();
    if (!business.email) return;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    try {
      await axios.post(
        "https://api.resend.com/emails",
        {
          from: "Jordan at Placement Portal <placements@clarityconduct.co.uk>",
          to: business.email,
          subject: `Welcome to the Placement Portal — ${business.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
              <h2 style="color:#6366f1;">Welcome, ${business.contact_name || business.name}!</h2>
              <p>Thank you for expressing interest in our Industrial Work Placement programme.</p>
              <p>Here's a quick reminder of what's included:</p>
              <ul>
                <li>✅ <strong>Zero cost</strong> — no salary, no fees</li>
                <li>✅ <strong>Self-sufficient graduates</strong> — minimal supervision needed</li>
                <li>✅ <strong>7.5-month commitment</strong> — June to January</li>
                <li>✅ <strong>London-based students</strong> ready to contribute to live projects</li>
              </ul>
              <p>Our Quality Assurance team will be in touch shortly to arrange a visit and confirm your placement.</p>
              <p style="color:#6366f1;font-weight:bold;">The Placement Portal Team</p>
            </div>
          `,
        },
        { headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Welcome email error:", err.message);
    }
  }
);

// ── Helper ────────────────────────────────────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
