import requests
import time
import csv
from pathlib import Path
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
import re

# ======================================================= SE LOGER =======================================================
driver = webdriver.Chrome()
data = []

page = 1

while True:
# for page in range(2):
    driver.get(f"https://www.seloger.com/classified-search?distributionTypes=Rent&estateTypes=House,Apartment&locations=AD08FR31096&page={page}")
    time.sleep(3)

    cards = driver.find_elements(By.CSS_SELECTOR, "div[data-testid='serp-core-classified-card-testid']")

    if not cards:
        print("No more pages found. Stopping.")
        break

    for card in cards:
        try:
            name = card.find_element(By.CSS_SELECTOR, "div.css-1n0wsen").text
        except:
            name = "N/A"

        try:
            price = card.find_element(By.CSS_SELECTOR, "div.css-1u6e91c").text
        except:
            price = "N/A"

        try:
            surface = card.find_element(By.XPATH, ".//*[contains(text(),'m²')]").text
        except:
            surface = "N/A"

        try:
            lieu = card.find_element(By.CSS_SELECTOR, "div.css-oaskuq").text
        except:
            lieu = "N/A"

        try:
            chambres = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÂÀâà','EEEEeeeeAAaa'),'chambr')]").text
        except:
            chambres = "N/A"

        try:
            pieces = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÎÏîï','EEEEeeeeIIii'),'piec')]").text
        except:
            pieces = "N/A"

        try:
            etage = card.find_element(
                By.XPATH,
                ".//*[contains(translate(text(),'ÉÈÊËéèêëETAGE','EEEEeeeeetage'),'etage') or contains(text(),'RDC')]"
            ).text
        except:
            etage = "N/A"

        data.append([name, surface, price, lieu, chambres, pieces, etage])

    page += 1

driver.quit()

repo_root = Path(__file__).resolve().parents[1]
out_dir = repo_root / "data" / "raw"
out_dir.mkdir(parents=True, exist_ok=True)
out_file = out_dir / "data_recuperer.csv"

