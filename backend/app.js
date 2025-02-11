const express = require("express");

const { scrape,scrapeWebsite, scrapeWebsite2 } = require("./services/scraperService");
const { default: puppeteer } = require("puppeteer");

const app = express();
const port = 8000;

const cors = require('cors');

app.use(cors());

app.use(express.json());


app.get("/api/home", (req,res)=>{
  res.status(200).send(
    {
      message:"Hello World",
      people: ["Andrew","Jet","Andy",]
    }
  );
});

app.post("/log-link", async (req, res) => {
  const { link } = req.body;

  if(!link){
    return res.status(400).send('Link is required');
  }
  // console.log(link);
  // res.send(`${link} received`);

  try {
    const data = await scrapeWebsite2(link);
    console.log(`Scraped data: ${JSON.stringify(data)}`);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost: ${port}`);
});
