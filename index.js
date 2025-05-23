const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();

app.get('/', (req, res) => {
  res.send("✅ pti-check API მუშაობს!");
});

const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/check-vin', async (req, res) => {
  const plate = req.query.plate;
  if (!plate) return res.status(400).json({ error: 'Plate is required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://pti.ge/check', { waitUntil: 'networkidle2' });

    await page.type('input[name="plate"]', plate);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const resultText = await page.evaluate(() => {
      const el = document.querySelector('.result-wrapper');
      return el ? el.innerText : null;
    });

    if (resultText) {
      res.json({ plate, result: resultText });
    } else {
      res.json({ plate, result: 'შედეგი ვერ მოიძებნა' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'შიდა შეცდომა' });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
