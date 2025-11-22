const wd = require('wd');

const username = process.env.LT_USERNAME;
const accessKey = process.env.LT_ACCESS_KEY;

// 🟢 Build name prefix injected by GitHub Actions
const buildPrefix = process.env.LT_BUILD_PREFIX;
const testName = "Sample Test NodeJS";

const desiredCapabilities = {
  "app": "lt://APP10160212031762415641469255",
  "build": `${buildPrefix} - ${testName}`,
  "name": testName,
  "deviceName": "Galaxy S21 5G",
  "platformName": "android",
  "platformVersion": "11",
  "visual": true,
  "network": true,
  "video": true,
  "isRealMobile": true,
  "console": true,
  "appProfiling": true,
  "accessibility": true,
  "devicelog": true,
  "autoGrantPermissions": true
};

const driver = wd.promiseRemote(
  `https://${username}:${accessKey}@mobile-hub.lambdatest.com/wd/hub`
);

async function waitForElement(selector, timeout = 10000) {
  await driver.waitForElementById(selector, timeout);
  return driver.elementById(selector);
}

async function runTest() {
  try {
    await driver.init(desiredCapabilities);
    await driver.setImplicitWaitTimeout(10000);

    const el1 = await waitForElement('color');
    await el1.click();

    const el2 = await waitForElement('Text');
    await el2.click();

    const el3 = await waitForElement('toast');
    await el3.click();

    await driver.execute("lambda-accessibility-scan");

    const el4 = await waitForElement('notification');
    await el4.click();

    const el5 = await waitForElement('geoLocation');
    await el5.click();

    await driver.execute("lambda-accessibility-scan");

    const el6 = await waitForElement('buttonPage');
    await el6.click();

    const el7 = await waitForElement('webview');
    await el7.click();

    const el8 = await waitForElement('url');
    await el8.type("https://www.lambdatest.com");

    await driver.execute('lambda-accessibility-scan');

    console.log('Test completed successfully.');

  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    await driver.quit();
  }
}

runTest();
