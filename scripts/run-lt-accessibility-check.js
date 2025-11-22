const axios = require("axios");

const username = process.env.LT_USERNAME;
const accessKey = process.env.LT_ACCESS_KEY;
const prefix = process.env.LT_BUILD_PREFIX;

if (!username || !accessKey || !prefix) {
  console.error("Missing LT_USERNAME, LT_ACCESS_KEY, or LT_BUILD_PREFIX");
  process.exit(1);
}

// Construct Basic Auth
const token = Buffer.from(`${username}:${accessKey}`).toString("base64");
const authHeader = { Authorization: `Basic ${token}` };

// STEP 1 — FIND BUILD ID
async function findBuildId() {
  try {
    const res = await axios.get(
      "https://mobile-api.lambdatest.com/mobile-automation/api/v1/builds?limit=10",
      { headers: authHeader }
    );

    const builds = res.data.data;

    for (const b of builds) {
      if (b.name && b.name.startsWith(prefix)) {
        console.log(`✓ Build matched: ${b.build_id} (${b.name})`);
        return b.build_id;
      }
    }

    return null;

  } catch (err) {
    console.error("Error fetching build list:", err.message);
    return null;
  }
}


// STEP 2 — POLL UNTIL BUILD IS NOT RUNNING
async function pollBuildStatus(buildId) {
  console.log(`Polling build ${buildId} until completion...`);

  while (true) {
    const res = await axios.get(
      `https://mobile-api.lambdatest.com/mobile-automation/api/v1/builds/${buildId}`,
      { headers: authHeader }
    );

    const status = res.data.data.status_ind;

    console.log(`Build status: ${status}`);

    if (status !== "running") {
      console.log("✓ Build completed.");
      return;
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}

// STEP 3 — GET ALL SESSIONS FOR THE BUILD
async function getSessions(buildId) {
  const res = await axios.get(
    `https://mobile-api.lambdatest.com/mobile-automation/api/v1/sessions?build_id=${buildId}`,
    { headers: authHeader }
  );

  return res.data.data;
}

// STEP 4 — CHECK ACCESSIBILITY RESULTS FOR EACH SESSION
async function checkAccessibilityForSession(sessionId, sessionName) {
  // Prepend RDAUT_
  const scanId = `RDAUT_${sessionId}`;
  const url = `https://api.lambdatest.com/accessibility/api/v1/test-issue/${scanId}`;
  const accessibilityUrl = `https://accessibility.lambdatest.com/automation/test/${scanId}`;
  const automationUrl = `https://appautomation.lambdatest.com/test?testID=${sessionId}&selectedTab=accessibility`;
  const maxRetries = 12;       // 12 retries × 5s = 60 seconds
  const interval = 5000;       // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(url, { headers: authHeader });
      const info = res.data.test_info;
      const totalIssues = info.total_issues || 0;

      console.log(`\n🔎 Session: ${sessionName} (${sessionId})`);
      console.log(`   • Accessibility issues: ${totalIssues}`);
      console.log(`   • Accessibility Report: ${accessibilityUrl}`);
      console.log(`   • App Automation Dashboard: ${automationUrl}\n`);

      return totalIssues;

    } catch (err) {
      if (attempt === maxRetries) {
        console.error(
          `❌ Accessibility report for session ${sessionId} not available after ${maxRetries} attempts. Failing PR.`
        );
        return Infinity;  // ensures PR fails
      }
      console.log(
        `Accessibility report for session ${sessionId} not ready (attempt ${attempt}). Retrying in ${interval/1000}s...`
      );
      await new Promise((r) => setTimeout(r, interval));
    }
  }
}

// MAIN FLOW
(async function main() {
  console.log(`Searching for build with prefix: ${prefix}`);

  let buildId = null;

  // Give LT some time to register the build
  for (let i = 0; i < 10; i++) {
    buildId = await findBuildId();
    if (buildId) break;
    console.log("Build not found yet. Retrying in 5 sec...");
    await new Promise((r) => setTimeout(r, 5000));
  }

  if (!buildId) {
    console.error("ERROR: No build found matching prefix:", prefix);
    process.exit(1);
  }

  // Poll LT until build finishes
  await pollBuildStatus(buildId);

  // Fetch sessions under this build
  const sessions = await getSessions(buildId);
  console.log(`Found ${sessions.length} session(s) under build.`);

  let issueFound = false;

  // Loop through all sessions
  for (const s of sessions) {
    const sessionId = s.test_id;
    const sessionName = s.name;
    const issues = await checkAccessibilityForSession(sessionId, sessionName);

    if (issues > 0) {
      issueFound = true;
    }
  }

  // FINAL RESULT
  if (issueFound) {
    console.error("❌ Accessibility violations found. Failing PR.");
    process.exit(1);
  } else {
    console.log("✓ No accessibility issues found.");
    process.exit(0);
  }
})();
