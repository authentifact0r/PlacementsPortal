/**
 * PlacementPortal — Firebase Cloud Functions  (v2.1 — JobsPikr ES query fix)
 * ==========================================
 * Handles server-side Vapi outbound calls for the
 * Business Development / Social Values Call Agent.
 * Keeps API keys off the client.
 */

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

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
  { region: "europe-west2" },
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

// ══════════════════════════════════════════════════════════════════════════════
// ── Reed Jobs API Proxy (CORS-safe) ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// The Reed API does not allow browser-side (CORS) requests.
// This Cloud Function acts as a server-side proxy so the React app can fetch
// real, live graduate jobs from Reed UK without CORS issues.
//
// Usage from frontend:
//   fetch("https://europe-west2-placementsportal-81608.cloudfunctions.net/reedJobsProxy?keywords=graduate&locationName=London")
// ══════════════════════════════════════════════════════════════════════════════

exports.reedJobsProxy = onRequest(
  {
    region: "europe-west2",
    cors: true,                  // Allow all origins (or lock to your domain later)
    maxInstances: 5,             // Keep costs low on free tier
  },
  async (req, res) => {
    // Only allow GET
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const reedKey = process.env.REED_API_KEY;
    if (!reedKey) {
      console.error("REED_API_KEY secret is not configured");
      return res.status(500).json({ error: "Reed API key not configured" });
    }

    // Forward query params to Reed
    const params = new URLSearchParams({
      keywords:         req.query.keywords       || "graduate",
      locationName:     req.query.locationName    || "United Kingdom",
      resultsToTake:    req.query.resultsToTake   || "25",
    });

    // Optional filters
    if (req.query.distanceFromLocation) params.set("distanceFromLocation", req.query.distanceFromLocation);
    if (req.query.permanent)            params.set("permanent", req.query.permanent);
    if (req.query.minimumSalary)        params.set("minimumSalary", req.query.minimumSalary);

    // Only fetch jobs posted in the last 3 days (avoids stale/closed listings)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const postedAfter = threeDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD
    params.set("postedAfterDate", postedAfter);

    // Ask for more results so we have enough after filtering expired ones
    params.set("resultsToTake", String(Math.min(Number(req.query.resultsToTake || 25) * 2, 100)));

    const reedUrl = `https://www.reed.co.uk/api/1.0/search?${params}`;

    try {
      const credentials = Buffer.from(`${reedKey}:`).toString("base64");

      const response = await axios.get(reedUrl, {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      let results = response.data.results || [];

      // Filter out jobs whose expirationDate has passed
      const now = new Date();
      results = results.filter((job) => {
        if (!job.expirationDate) return true; // keep if no expiry
        return new Date(job.expirationDate) > now;
      });

      // Trim to requested limit
      const requestedLimit = Number(req.query.resultsToTake || 25);
      results = results.slice(0, requestedLimit);

      return res.status(200).json({
        results,
        totalResults: results.length,
        source: "reed_api_live",
        fetched_at: new Date().toISOString(),
        filters_applied: { postedAfterDate: postedAfter, expiredRemoved: true },
      });
    } catch (err) {
      console.error("Reed API error:", err.response?.status, err.message);
      return res.status(502).json({
        error: "Failed to fetch jobs from Reed",
        details: err.message,
      });
    }
  }
);


// ══════════════════════════════════════════════════════════════════════════════
// ── Scheduled Job Sync (runs every 24 hours) ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Fetches jobs from configured APIs (Reed, SerpApi, JobsPikr), deduplicates,
// normalises to our JobListing schema, and writes to the `jobs` collection.
// ══════════════════════════════════════════════════════════════════════════════

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { syncJobsFromApi } = require("./jobSync");

exports.scheduledJobSync = onSchedule(
  {
    schedule: "0 3 * * *",       // Every day at 03:00
    timeZone: "Europe/London",
    region:   "europe-west2",
    timeoutSeconds: 540,
    memory:   "1GiB",
  },
  async (_event) => {
    console.log("[scheduledJobSync] Starting daily job sync...");
    try {
      const result = await syncJobsFromApi();
      console.log("[scheduledJobSync] Completed:", JSON.stringify(result));
      if (result.errors && result.errors.length > 0) {
        console.error("[scheduledJobSync] Partial failure:", result.errors);
      }
    } catch (err) {
      console.error("[scheduledJobSync] CRITICAL:", err.message, err.stack);
      try {
        await db.doc("api_cache/job_sync_meta").set({
          lastRunAt:  admin.firestore.FieldValue.serverTimestamp(),
          status:     "critical_failure",
          errorCount: 1,
          errors:     [err.message],
        }, { merge: true });
      } catch (_) {}
    }
  }
);

// ── Manual trigger for admin-initiated syncs ──────────────────────────────────
exports.triggerJobSync = onCall(
  { region: "europe-west2" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

    const userSnap = await db.collection("users").doc(request.auth.uid).get();
    const role = userSnap.data()?.role;
    if (role !== "admin") throw new HttpsError("permission-denied", "Admin access required");

    console.log(`[triggerJobSync] Manual sync triggered by ${request.auth.uid}`);
    try {
      const result = await syncJobsFromApi();
      return { success: true, ...result };
    } catch (err) {
      console.error("[triggerJobSync] Sync failed:", err.message);
      throw new HttpsError("internal", `Sync failed: ${err.message}`);
    }
  }
);

// ── Simple HTTP trigger for first-time sync ──────────────────────────────────
// URL: https://europe-west2-placementsportal-81608.cloudfunctions.net/initialJobSync?secret=placementsportal2026
// Add &reset=true to wipe all existing jobs and re-fetch fresh from all providers
exports.initialJobSync = onRequest(
  { region: "europe-west2", cors: true, timeoutSeconds: 540, memory: "1GiB" },
  async (req, res) => {
    const secret = req.query.secret;
    if (secret !== "placementsportal2026") {
      return res.status(403).json({ error: "Invalid secret. Add ?secret=placementsportal2026" });
    }

    const doReset = req.query.reset === "true";

    console.log(`[initialJobSync] Sync triggered via HTTP (reset=${doReset})`);
    try {
      // ── If reset=true, wipe the entire jobs collection + sync metadata ──
      if (doReset) {
        console.log("[initialJobSync] RESETTING: Deleting all jobs...");
        const jobsRef = db.collection("jobs");
        let deleted = 0;

        // Delete in batches of 400 (Firestore batch limit is 500)
        while (true) {
          const snapshot = await jobsRef.limit(400).get();
          if (snapshot.empty) break;

          const batch = db.batch();
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          deleted += snapshot.size;
          console.log(`[initialJobSync] Deleted batch of ${snapshot.size} (total: ${deleted})`);
        }

        console.log(`[initialJobSync] Wiped ${deleted} jobs from Firestore`);
      }

      // Clear cooldown so sync runs immediately
      await db.doc("api_cache/job_sync_meta").delete().catch(() => {});

      const result = await syncJobsFromApi();
      console.log("[initialJobSync] Result:", JSON.stringify(result));
      return res.status(200).json({
        success: true,
        reset: doReset,
        ...(doReset ? { message: "All jobs wiped and re-synced fresh" } : {}),
        ...result,
      });
    } catch (err) {
      console.error("[initialJobSync] Failed:", err.message, err.stack);
      return res.status(500).json({ error: err.message });
    }
  }
);
