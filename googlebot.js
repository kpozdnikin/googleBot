"use strict";

import webdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import chromedriver from 'chromedriver';
import fs from 'fs';
import settings from './settings.json';

const by = webdriver.By;
const By = webdriver.By;
let allLinks = [];
let customersLinks = [];
let globalIndex = 0;
let customersEmails = [];

const xpathSearchInput = '//*[@id="tsf"]/div[2]/div[1]/div[1]/div/div[2]/input';
const xpathSearchButton = '//*[@id="tsf"]/div[2]/div/div[3]/center/input[1]';


chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

const browser = new webdriver
    .Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

browser.manage().window().setSize(1024, 700);

getPage();
// readFileAsync('links.txt');
// finEmailsInLink();

async function getPage() {
  //логинимся
  browser.get('https://www.google.com/');
  browser.sleep(settings.sleep_delay);
  browser.findElement(by.xpath(xpathSearchInput)).sendKeys(settings.requests[globalIndex]);
  browser.sleep(settings.sleep_delay);
  browser.executeScript(`
    const dropDown = document.evaluate('//*[@id="tsf"]/div[2]/div/div[2]',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if(dropDown) {
        dropDown.style.display = 'none';
      }
    `);
  await browser.findElement(by.xpath(xpathSearchButton)).click();
  browser.sleep(settings.sleep_delay);

  // перебираем все страницы и все ссылки на сайт
  for (let j = 1; j < 10; j++) {
    const elementsBlock = await browser.findElement(by.id('rso'));
    const aLinks = await elementsBlock.findElements(By.css('.r a'));
    console.log('aLinks', aLinks.length);
    for (let i = 0; i < aLinks.length; i++) {
      await manageLink(aLinks[i]);
    }
    allLinks = allLinks.concat(customersLinks);
    // перебираем все сылки на сайты
    const pageLink = await browser.findElement(by.xpath(`//*[@id="nav"]/tbody/tr/td[${j + 2}]/a`));
    await pageLink.click();
    browser.sleep(settings.sleep_delay);
    console.log('clicked');
  }
  managePageLinks();
}

async function closeDropDown() {

}

async function findPageLinks(ind) {
  const pagesBlock = browser.findElement(by.id('nav'));
  const pageLinks = await pagesBlock.findElements(by.xpath(`'/*[@id="nav"]/tbody/tr/td[${ind + 2}]/a`));
  if (pageLinks && pageLinks[ind]) {
    console.log('pageLinks', pageLinks.length);
    return pageLinks[ind]
  }
  return null;
}

// собираем в массив те ссылки, которые содержат адреса кастомеров
async function manageLink(elem) {
  try {
    const elemLink = await elem.getAttribute("href");
    if (elemLink.indexOf('google') === -1) {
      customersLinks.push(elemLink);
    }
  }
  catch (err) {
    console.log('manageLink error', err);
  }
}

async function manageLinks(ind) {
  try {
    const elemLink = customersLinks[ind];
    browser.get(elemLink);
    browser.sleep(settings.sleep_delay);
    // .getText()
    const links = await browser.findElements(By.css('a'));
    for (let i = 0; i < links.length; i++) {
      await findEmail(links[i]);
    }
  } catch (e) {
    console.log('manageLinks error', e);
  }
}

async function findEmail(link) {
  try {
    const href = await link.getAttribute("href");
    if (href.indexOf('mailto:') !== -1) {
      if (customersEmails.indexOf(href) === -1) {
        customersEmails.push(href);
      }
    }
  }
  catch (err) {
    // console.log('findEmail error');
  }
}

// считываем данные из файла и работаем с ними
async function readFileAsync(fileName) {
  fs.readFile(fileName, "utf8", (error, data) => {
      console.log("Асинхронное чтение файла");
      if(error) throw error; // если возникла ошибка
      const emails = data.split(',');
      allLinks = [].concat(emails);
      console.log('allLinks', allLinks.length);
      getPage();
    });
}

// записываем данные в файл
async function writeFileAsync(memoryDataArray, fileName) {
  const data = memoryDataArray.join();
  fs.writeFile(fileName, data, (error) => {
    if(error) throw error; // если возникла ошибка
    console.log("Асинхронная запись файла завершена. Содержимое файла:");
  });
}

async function manageEmails() {
  const clearedEmails = [];
  customersEmails.forEach((elem) => {
    clearedEmails.push(elem.split(':')[1])
  });
  writeFileAsync(clearedEmails, 'emails.txt');
}

async function managePageLinks() {
  writeFileAsync(allLinks, 'links.txt');
  if (globalIndex < 7) {
    globalIndex++;
    readFileAsync('links.txt');
  }
}

// возвращает массив данных из файла и памяти без повторений
function checkForRepeats(fileDataString, memoryDataArray) {
  const fileDataArray = fileDataString.split(',');
  memoryDataArray.forEach((elem) => {
    if (fileDataString.indexOf(elem) === -1) {
      fileDataArray.push(elem);
    }
  });
  return fileDataArray;
}

// найдем emails по ссылке
function finEmailsInLink() {
  const str = 'hello sean@example.com how are you? do you know bob@example.com?';
  const emails = str.match(/\S+[a-z0-9]@[a-z0-9\.]+/img);
  console.log('emails', emails);
}
