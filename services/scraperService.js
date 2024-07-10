const puppeteer = require("puppeteer");
const puppeteerextra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { logToFile } = require('../utils/logger');
const fs = require('fs');


async function scrape(link) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(link, { waitUntil: 'networkidle2'});

  const data = await page.evaluate((link) => {
  const bookPods = Array.from(document.querySelectorAll('.product_pod'));

  return Array.from(bookPods).map(book => ({
      title : book.querySelector('h3 a') ? book.querySelector('h3 a').getAttribute('title') : null,
      price : book.querySelector('.price_color') ? book.querySelector('.price_color').innerText : null,
      img   : book.querySelector('img') ? link + book.querySelector('img').getAttribute('src') : null,
      rating: book.querySelector('.star-rating') ? book.querySelector('.star-rating').classList[1] : null,
  // img   : book.querySelector('img') ? link + book.querySelector('img').getAttribute('src') : null,
    }));
  }, link);

  
  await browser.close();
  return data;

}


async function scrapeWebsite(link){
  puppeteerextra.use(StealthPlugin());

  const browser = await puppeteerextra.launch({headless: false});

  const page = await browser.newPage();

  try{

    await page.goto(link, {waitUntil: 'networkidle2'});

    // await page.screenshot({path: '/screenshot/screenshot.png', fullPage: true});

    const frames = page.frames();
    const allTitles = [];

    for(const frame of frames){
      const titleDivs = await frame.$$('h2.dish-category-title');
      for(const titleDiv of titleDivs){
        const innerText = await frame.evaluate(element=> element.innerText,titleDiv);

        const spanData = await frame.evaluate(()=>{
          const spanElement = document.querySelector('span.vertical-align-middle[data-testid="menu-product-name]');
          return spanElement ? spanElement.innerText.trim() : null;
        });

        if (spanData){
          console.log('Found span with data-testid="menu-product-name":', spanData);
        }

        allTitles.push({title: innerText.trim(),
          spanData: spanData
        });
      }
    }

    logToFile('Collected titles','app.log',{allTitles});
    console.log('Scraped titles:', allTitles);
    return allTitles;

  } catch (error){
    console.error('Error:', error);
    await browser.close();
    return [];
  }
 
}

async function scrapeWebsite2(link){
  puppeteerextra.use(StealthPlugin());

  const browser = await puppeteerextra.launch({headless: false});

  const page = await browser.newPage();

  try {
    await page.goto(link, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const elements = document.querySelectorAll('div.box-flex.dish-category-section');
      return Array.from(elements).map(element => element.innerText.trim());
    });

    const structuredData = data.map(section => {
      const lines = section.split('\n').filter(line => line.trim() !== '');
      const category = lines.shift();
      const description = lines.shift();
      const items = [];

      while (lines.length){
        const name = lines.shift();
        const price = lines.shift();
        const popularity = lines.shift();

        items.push({name, price, popularity});
      }

      return { category, description, items};
    });

    console.log('Scraped Data:', structuredData);

    fs.writeFileSync('scraped_data.json', JSON.stringify(structuredData, null, 2));

    await browser.close();
    return structuredData;
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
    return [];
  }
  
}

module.exports = { 
  scrape,
  scrapeWebsite,
  scrapeWebsite2
};
