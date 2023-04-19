const puppeteer = require('puppeteer');
const readline = require('readline');

const questions = [
  "Enter the basepath of your website: ",
  "Enter the home page path or press enter to skip: ",
  "Enter the news page path or press enter to skip: ",
  "Enter the faq page path or press enter to skip: ",
  "Enter the projects page path or press enter to skip: ",
  "Enter the sponsor project page path or press enter to skip: ",
  "Enter the video gallery path or press enter to skip: ",
  "Enter the poster gallery page path or press enter to skip: ",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const getWebsiteData = async () => {
  const data = [];
  for (let i = 0; i < questions.length; i++) {
    const answer = await askQuestion(questions[i]);
    data.push(answer)
  }
  rl.close();
  return data;
};

(async () => {
    const responses = await getWebsiteData();
    console.log(responses);
    const browser = await puppeteer.launch({headless: false, args: ['--start-maximized']});
    const page = await browser.newPage();

    // Go to the login page of WordPress
    const basePath = responses.shift();
    await page.goto(basePath);


      // Set the viewport size to match the browser window size
    await page.setViewport({
        width: 0,
        height: 0,
        deviceScaleFactor: 1
    });

    
    // Wait for the page to finish loading
    await new Promise(resolve => setTimeout(resolve, 3000));

    await navbar(page);

    // Test loading the pages
    console.log('----Testing if pages given load----');
    for (const site of responses) {
        if (site !== '') {
            const url = `${basePath}/${site}`;
            await page.goto(url);
            const pageTitle = await page.title();
            if (pageTitle === '404 Page Not Found') {
                console.log(`\t \u2718 Error: ${site} not found.`);
            } else {
                console.log(`\t \u2714 ${site} loaded successfully!`);
            }
        }
    }
    // For example, take a screenshot
    await page.screenshot({path: 'screenshot.png'});

    // Close the browser
    await browser.close();
})();

// Test the Navbar class on the page
async function navbar(page) {
    console.log('----Navbar Test----');
    const navbar_text = await page.$('.navbar');
    if (navbar_text) {
        console.log('\t \u2714 Navbar is displayed');
         // Find the navigation menu and click the hamburger icon
        const navLinks = await page.$('.nav-links');
        const hamburger = await navLinks.$('.menu');
        await page.waitForSelector('.menu', {visible: true});
        await hamburger.click();

        // Wait for the dropdown menu to be visible
        await page.waitForSelector('.dropdown');

        // Find the menu items and check their href attributes
        const links = await navLinks.$$('a');

        let ret = '';
        for (let i = 0; i < links.length; i++) {
            const href = await links[i].getProperty('href');
            if (href) {
                const url = await href.jsonValue();
                ret = `\t \u2714 Navbar item ${i} ${url} is there`;
                console.log(ret);
            } else {
                console.log(`\t \u2718 Navbar item ${i} isn't there`);
            }

        }
    } else {
        console.log('\t \u2718 Navbar is not displayed');
    }
}