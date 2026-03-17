import requests
import time
import csv
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
import re


# ======================================================= API =======================================================
url = "https://apidf-preprod.cerema.fr/dvf_opendata/mutations/"

params = {
    "code_insee": "75119",
    "anneemut_min": "2020",
    "codtypbien": "151",
    "page_size": 200
}

for attempt in range(3):
    try:
        response = requests.get(url, params=params, timeout=10)

        print("Status:", response.status_code)

        if response.status_code == 200:
            data = response.json()

            print("Total logements found:", data["count"])
            print("---- Logements ----")

            for sale in data["results"]:
                print(
                    f"{sale['datemut']} | "
                    f"{sale['valeurfonc']}€ | "
                    f"{sale['sbati']}m² | "
                    f"{sale['libtypbien']}"
                )
            break
        else:
            print("Server issue, retrying...")
            time.sleep(3)

    except requests.exceptions.Timeout:
        print("Timeout, retrying...")
        time.sleep(3)

# ======================================================= STUDAPART =======================================================

driver = webdriver.Chrome()

data = []
page = 1

# while True:
for page in range(2):
    driver.get(f"https://www.studapart.com/fr/logement-etudiant-paris?page={page}")
    time.sleep(3)

    cards = driver.find_elements(By.CSS_SELECTOR, "div[class='mb-20']")

    if not cards:
        print("No more pages found. Stopping.")
        break

    for card in cards:
        try:
            name = card.find_element(By.CSS_SELECTOR, "p[class='AccomodationBlock_title ft-bold ellipsis-2 mb-5']").text
        except:
            name = "N/A"

        try:
            price = card.find_element(By.CSS_SELECTOR, "p[class='ft-3xl line-1']>b").text
        except:
            price = "N/A"

        try:
            location_block = card.find_element(By.CSS_SELECTOR,"div.AccomodationBlock_location.mb-10.color-ft.ellipsis-1").text
            match = re.search(r'\d+\s*m²', location_block)
            surface = match.group(0) if match else "N/A"
        except:
            surface = "N/A"

        try:
            lieu_raw = card.find_element(By.CSS_SELECTOR,"div.AccomodationBlock_location.mt-10.ellipsis-1").get_attribute("textContent")
            lieu = lieu_raw.replace('"', '').strip()
        except:
            lieu = "N/A"

        try:
            chambres_raw = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÂÀâà','EEEEeeeeAAaa'),'chambr')]").text
            match = re.search(r'\d+\s*\w*chambre\w*', chambres_raw, re.IGNORECASE)
            chambres = match.group(0) if match else "N/A"
        except:
            chambres = "N/A"

        try:
            # pieces = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÎÏîï','EEEEeeeeIIii'),'piec')]").text
            pieces = "N/A"
        except:
            pieces = "N/A"

        try:
            etage = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëETAGE','EEEEeeeeetage'),'etage') or contains(text(),'RDC')]").text
        except:
            etage = "N/A"

        data.append([name, surface, price, lieu, chambres, pieces, etage])

    # page += 1

driver.quit()

with open("studapart_logements.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Surface" ,"Price" ,"Lieu" ,"Chambres" ,"Pièces" ,"Etage"])
    writer.writerows(data)

print("CSV saved successfully!")

# ======================================================= SE LOGER =======================================================

# driver = webdriver.Chrome()
# data = []

# page = 1

# while True:
# # for page in range(2):
#     driver.get(f"https://www.seloger.com/classified-search?distributionTypes=Rent&estateTypes=House,Apartment&locations=AD08FR31096&page={page}")
#     time.sleep(3)

#     cards = driver.find_elements(By.CSS_SELECTOR, "div[data-testid='serp-core-classified-card-testid']")

#     if not cards:
#         print("No more pages found. Stopping.")
#         break

#     for card in cards:
#         try:
#             name = card.find_element(By.CSS_SELECTOR, "div.css-1n0wsen").text
#         except:
#             name = "N/A"

#         try:
#             price = card.find_element(By.CSS_SELECTOR, "div.css-1u6e91c").text
#         except:
#             price = "N/A"

#         try:
#             surface = card.find_element(By.XPATH, ".//*[contains(text(),'m²')]").text
#         except:
#             surface = "N/A"

#         try:
#             lieu = card.find_element(By.CSS_SELECTOR, "div.css-oaskuq").text
#         except:
#             lieu = "N/A"

#         try:
#             chambres = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÂÀâà','EEEEeeeeAAaa'),'chambr')]").text
#         except:
#             chambres = "N/A"

#         try:
#             pieces = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÎÏîï','EEEEeeeeIIii'),'piec')]").text
#         except:
#             pieces = "N/A"

#         try:
#             etage = card.find_element(
#                 By.XPATH,
#                 ".//*[contains(translate(text(),'ÉÈÊËéèêëETAGE','EEEEeeeeetage'),'etage') or contains(text(),'RDC')]"
#             ).text
#         except:
#             etage = "N/A"

#         data.append([name, surface, price, lieu, chambres, pieces, etage])

#     page += 1

# driver.quit()

# with open("SeLoger_logements.csv", "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#     writer.writerow(["Name", "Surface", "Price", "Lieu", "Chambres", "Pièces", "Etage"])
#     writer.writerows(data)

# print("CSV saved successfully!")

# ======================================================= BIENICI =======================================================

# driver = webdriver.Chrome()
# data = []

# page = 1

# while True:
# for page in range(2):
#     driver.get(f"https://www.bienici.com/recherche/location/paris-75000/appartement?page=1")
#     time.sleep(3)

#     cards = driver.find_elements(By.CSS_SELECTOR, "div[class='adOverview kimono-overlay-parent ad-overview-gallery__ad-overview']")

#     if not cards:
#         print("No more pages found. Stopping.")
#         break

#     for card in cards:
#         try:
#             name = card.find_element(By.CSS_SELECTOR, "span[class='ad-overview-details__ad-title ad-overview-details__ad-title--small']").text
#         except:
#             name = "N/A"

#         try:
#             price = card.find_element(By.CSS_SELECTOR, "span.ad-price__the-price").text
#         except:
#             price = "N/A"

#         try:
#             surface_text = card.find_element(By.XPATH, ".//*[contains(text(),'m²')]").text
#             match = re.search(r'\d+\s*m²', surface_text)
#             surface = match.group(0) if match else "N/A"
#         except:
#             surface = "N/A"


#         try:
#             lieu = card.find_element(By.CSS_SELECTOR, "span[class='ad-overview-details__address-title ad-overview-details__address-title--small']").text
#         except:
#             lieu = "N/A"

#         try:
#             chambres = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÂÀâà','EEEEeeeeAAaa'),'chambr')]").text
#         except:
#             chambres = "N/A"

#         try:
#             pieces_text = card.find_element(By.XPATH, ".//*[contains(translate(text(),'ÉÈÊËéèêëÎÏîï','EEEEeeeeIIii'),'piec')]").text
#             match = re.search(r'\d+\s*pièces?', pieces_text)
#             pieces = match.group(0) if match else "N/A"
#         except:
#             pieces = "N/A"

#         try:
#             etage = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëETAGE','EEEEeeeeetage'),'etage') or contains(text(),'RDC')]").text
#         except:
#             etage = "N/A"

#         data.append([name, surface, price, lieu, chambres, pieces, etage])

#     page += 1

# driver.quit()

# with open("BienIci_logements.csv", "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#     writer.writerow(["Name", "Surface", "Price", "Lieu", "Chambres", "Pieces", "Etage"])
#     writer.writerows(data)

# print("CSV saved successfully!")


# # ======================================================= 1JEUNE SOLUTION =======================================================


# driver = webdriver.Chrome()
# data = []

# page = 1

# while True:
# # for page in range(2):
#     driver.get(f"https://www.1jeune1solution.gouv.fr/logements/annonces?annonce-de-logement%5Bquery%5D=Paris&annonce-de-logement%5Brange%5D%5Bsurface%5D=0%3A500&annonce-de-logement%5Brange%5D%5Bprix%5D=0%3A3000&annonce-de-logement%5Bpage%5D={page}")
#     time.sleep(3)

#     cards = driver.find_elements(By.CSS_SELECTOR, "div[class='Card_cardComponent__Ui4Vy Annonce_Card__ReIfG']")

#     if not cards:
#         print("No more pages found. Stopping.")
#         break

#     for card in cards:
#         try:
#             name = card.find_element(By.CSS_SELECTOR, "h3[class='Card_cardTitle__u_Q2E Annonce_cardTextContent__XTJNf']").text
#         except:
#             name = "N/A"

#         try:
#             price = card.find_element(By.CSS_SELECTOR, "dl[class='Annonce_CardDescription__PxFAo']>dd:nth-child(4)").text
#         except:
#             price = "N/A"

#         try:
#             surface_text = card.find_element(By.XPATH, ".//*[contains(text(),'m²')]").text
#             match = re.search(r'\d+\s*m²', surface_text)
#             surface = match.group(0) if match else "N/A"
#         except:
#             surface = "N/A"


#         try:
#             lieu = card.find_element(By.CSS_SELECTOR, "span[class='TextIcon_textIcon__UPxpS TextIcon_spaceForLeftIcon__ozJB5 Annonce_localisation__5Xws1']>span").text
#         except:
#             lieu = "N/A"

#         try:
#             chambres = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëÂÀâà','EEEEeeeeAAaa'),'chambr')]").text
#         except:
#             chambres = "N/A"

#         try:
#             pieces_text = card.find_element(By.XPATH, ".//*[contains(translate(text(),'ÉÈÊËéèêëÎÏîï','EEEEeeeeIIii'),'piec')]").text
#             match = re.search(r'\d+\s*pièces?', pieces_text)
#             pieces = match.group(0) if match else "N/A"
#         except:
#             pieces = "N/A"

#         try:
#             etage = card.find_element(By.XPATH,".//*[contains(translate(text(),'ÉÈÊËéèêëETAGE','EEEEeeeeetage'),'etage') or contains(text(),'RDC')]").text
#         except:
#             etage = "N/A"

#         data.append([name, surface, price, lieu, chambres, pieces, etage])

#     page += 1

# driver.quit()

# with open("1jeune1solution_logements.csv", "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#     writer.writerow(["Name", "Surface", "Price", "Lieu", "Chambres", "Pieces", "Etage"])
#     writer.writerows(data)

# print("CSV saved successfully!")