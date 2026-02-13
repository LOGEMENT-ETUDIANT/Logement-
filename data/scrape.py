import requests
import time
import csv
from pathlib import Path
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
import re


# ======================================================= API =======================================================
# url = "https://apidf-preprod.cerema.fr/dvf_opendata/mutations/"

# params = {
#     "code_insee": "75119",
#     "anneemut_min": "2020",
#     "codtypbien": "151",
#     "page_size": 200
# }

# for attempt in range(3):
#     try:
#         response = requests.get(url, params=params, timeout=10)

#         print("Status:", response.status_code)

#         if response.status_code == 200:
#             data = response.json()

#             print("Total logements found:", data["count"])
#             print("---- Logements ----")

#             for sale in data["results"]:
#                 print(
#                     f"{sale['datemut']} | "
#                     f"{sale['valeurfonc']}€ | "
#                     f"{sale['sbati']}m² | "
#                     f"{sale['libtypbien']}"
#                 )
#             break
#         else:
#             print("Server issue, retrying...")
#             time.sleep(3)

#     except requests.exceptions.Timeout:
#         print("Timeout, retrying...")
#         time.sleep(3)

# ======================================================= STUDAPART =======================================================

# driver = webdriver.Chrome()

# data = []
# page = 1
# # for page in range(1, 6):
# while True:
#     driver.get(f"https://www.studapart.com/fr/logement-etudiant-paris?page={page}")
#     time.sleep(3)
#     driver.implicitly_wait(5)

#     names = driver.find_elements(By.CSS_SELECTOR, "p[class='AccomodationBlock_title ft-bold ellipsis-2 mb-5']")
#     types = driver.find_elements(By.CSS_SELECTOR, "p[class='ft-xs']")
#     prices = driver.find_elements(By.CSS_SELECTOR, "p[class='ft-l color-ft ft-m@s']>b")
#     surfaces = driver.find_elements(By.CSS_SELECTOR, "div[class='AccomodationBlock_location mb-10 color-ft ellipsis-1']")

#     for i,(name,type,price,surface) in enumerate(zip(names,types,prices,surfaces),start=1):
#         data.append([name.text, type.text, surface.text ,price.text])

#     page += 1
    

# driver.quit()

# with open("studapart_logements.csv", "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#     writer.writerow(["Name", "Type", "Surface" ,"Price"])
#     writer.writerows(data)

# print("CSV saved successfully!")

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

with open(out_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Surface", "Price", "Lieu", "Chambres", "Pièces", "Etage"])
    writer.writerows(data)

print(f"CSV saved successfully: {out_file}")
