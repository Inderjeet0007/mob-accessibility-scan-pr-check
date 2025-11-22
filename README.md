# Mobile Accessibility PR Check

This repository provides a **CI/CD workflow** for running **mobile app tests** on LambdaTest and automatically checking **accessibility issues**. It ensures that pull requests cannot be merged if any accessibility violations are detected.

---

## **Table of Contents**

- [Features](#features)  
- [Folder Structure](#folder-structure)  
- [Prerequisites](#prerequisites)  
- [Configuration](#configuration)  
- [Usage](#usage)  
- [GitHub Actions CI](#github-actions-ci)  
- [How it works](#how-it-works)  
- [Contributing](#contributing)  

---

## **Features**

- Run mobile automation tests using `wd` (Node.js WebDriver) on LambdaTest.  
- Automatically poll for accessibility reports after test completion.  
- Fail the PR if any accessibility issues are found or the report is unavailable.  
- Parallel polling of multiple sessions to minimize CI time.  
- Configurable LambdaTest build prefix per PR.

---

## **Folder Structure**
```
├── tests/
│ └── mobile-test.js # Sample mobile test script
├── scripts/
│ ├── run-lt-accessibility-check.js # Unified accessibility check script
├── package.json
├── .gitignore
└── .github/
  └── workflows/
   └── ci.yml # GitHub Actions workflow
```

---

## **Prerequisites**

- Node.js >= 18  
- npm  
- LambdaTest account with **username** and **access key**  
- GitHub repository with **secrets configured**:
  - `LT_USERNAME`
  - `LT_ACCESS_KEY`

---

## **Configuration**

1. Clone the repository:

```bash
git clone https://github.com/Inderjeet0007/mob-accessibility-scan-pr-check
cd mob-accessibility-scan-pr-check
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in GitHub Actions (or locally in .env):
```bash
LT_USERNAME=<your-lambdatest-username>
LT_ACCESS_KEY=<your-lambdatest-access-key>
```

## **GitHub Actions CI**

1. Triggered on pull_request events.

2. Workflow steps:
    - Checkout code
    - Install dependencies
    - Run mobile test (`tests/mobile-test.js`)
    - Generate a unique build prefix
    - Run accessibility checks (`scripts/run-lt-accessibility-check.js`) 

3. If any accessibility violations are detected, the PR cannot be merged.

## **How it works**

1. Mobile test script (`mobile-test.js`) runs on LambdaTest real devices.

2. Each build is tagged with a unique prefix for the PR.

3. After the build finishes:

    - Run `lt-accessibility-check.js` fetches all sessions for the build.

    - Polls accessibility API for each session.

    - Retries until reports are available (configurable timeout).

4. Logs issues per session.

5. Exits with code 1 if any issues are found → blocks PR merge.