import time
import csv
import re
from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()

data = []
updatedata = []
page = 1

# ===== OPEN LISTING PAGE =====
while True :
    driver.get(f"https://www.studapart.com/fr/logement-etudiant-paris?page={page}")
    time.sleep(3)

    # ===== GET ALL OFFER LINKS FIRST (IMPORTANT) =====
    cards = driver.find_elements(By.CSS_SELECTOR, "div.mb-20")


    links = []

    for card in cards:
        try:
            link = card.find_element(By.TAG_NAME, "a").get_attribute("href")
            if link:
                links.append(link)
        except:
            continue

    if not links:
        print("No more offers found. Stopping.")
        break


    print(f"Found {len(links)} offers")

    for link in links:
        driver.get(link)
        time.sleep(3)
        type_loge = driver.find_element(By.CSS_SELECTOR,"p.ft-s.ft-medium.mb-3").text
        offers = driver.find_elements(By.CSS_SELECTOR, "div.PropertyBlock_body")
        # -------- PAGE TITLE (parent offer) --------
        try:
            parent_name = driver.find_element(By.CSS_SELECTOR, "h1.ft-2xl").text.strip()
        except:
            parent_name = "N/A"

        # ============================
        # CASE 1 → RESIDENCE
        # ============================
        if "résidence" in type_loge.lower() :
            for offer in offers:
                try:
                    type = offer.find_element(By.CSS_SELECTOR,"h4.Title.d-block.color-ft").text
                except:
                    type = "N/A"

                try:
                    unit_name = offer.find_element(By.CSS_SELECTOR, "h3").text.strip()
                except:
                    unit_name = "N/A"

                try:
                    price = offer.find_element(By.CSS_SELECTOR,"div.d-flex.fx-align-center").text.strip()
                except:
                    price = "N/A"

                try:
                    lieu = driver.find_element(By.CSS_SELECTOR,"div.PropertyPage_location div.icon-highlight p.ft-s").text.strip()       
                except:
                    lieu = "N/A"

                try:
                    surface_text = offer.text if "offer" in locals() else driver.find_element(By.TAG_NAME, "body").text
                    matches = re.findall(r'(\d+)\s*m(?:²|2)', surface_text, re.IGNORECASE)

                    if len(matches) >= 2:
                        surface = f"{matches[0]}-{matches[1]} m²"
                    elif len(matches) == 1:
                        surface = f"{matches[0]} m²"
                    else:
                        surface = "N/A"
                except:
                    surface = "N/A"

                data.append([type_loge,parent_name,type,surface,price,lieu,"N/A","N/A","N/A"])

        # ============================
        # CASE 2 → COLOCATION
        # ============================
        elif "colocation" in type_loge.lower() :
            for offer in offers:

                try:
                    type = offer.find_element(By.CSS_SELECTOR,"h4.Title.d-block.color-ft").text
                except:
                    type = "N/A"

                try:
                    unit_name = offer.find_element(By.CSS_SELECTOR, "h3").text.strip()
                except:
                    unit_name = "N/A"

                try:
                    price = offer.find_element(By.CSS_SELECTOR,"div.d-flex.fx-align-center").text.strip()
                except:
                    price = "N/A"

                try:
                    lieu = driver.find_element(By.CSS_SELECTOR,"div.PropertyPage_location div.icon-highlight p.ft-s").text.strip()       
                except:
                    lieu = "N/A"

                try:
                    surface_text = offer.text if "offer" in locals() else driver.find_element(By.TAG_NAME, "body").text
                    matches = re.findall(r'(\d+)\s*m(?:²|2)', surface_text, re.IGNORECASE)

                    if len(matches) >= 2:
                        surface = f"{matches[0]}-{matches[1]} m²"
                    elif len(matches) == 1:
                        surface = f"{matches[0]} m²"
                    else:
                        surface = "N/A"
                except:
                    surface = "N/A"

                data.append([type_loge,parent_name,type,surface,price,lieu,"N/A","N/A","N/A"])


        # ============================
        # CASE 3 → ENTIER
        # ============================
        else:

            try:
                type = driver.find_element(By.CSS_SELECTOR,"p.ft-s.ft-medium.mb-3").text
            except:
                type = "N/A"

            try:
                price = driver.find_element(By.CSS_SELECTOR,"div.ft-3xl.line-1.b").text
            except:
                price = "N/A"

            try:
                lieu = driver.find_element(By.CSS_SELECTOR,"div.PropertyPage_location div.icon-highlight p.ft-s").text.strip()       
            except:
                lieu = "N/A"

            try:
                info_line = driver.find_element(By.CSS_SELECTOR,"p.ft-s.mb-10").text
                match = re.search(r'(\d+)\s*m(?:²|2)', info_line, re.IGNORECASE)
                surface = f"{match.group(1)} m²" if match else "N/A"

            except:
                surface = "N/A"

            data.append([type_loge,parent_name,type,surface,price,lieu,"N/A","N/A","N/A"])
        # updatedata.append([source, source_url, scraped_at, title, property_type_raw, parent_offer, unit_name, is_residence, price_min_eur, price_max_eur, surface_min_m2, surface_max_m2, rooms_count, bedrooms_count, address_raw, city, postal_code, furnished, floor, elevator, parking])
    page += 1

# ===== CLOSE DRIVER =====
driver.quit()

# ===== SAVE CSV =====
with open("studapart_logements.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Logement", "Name", "Type", "Surface", "Price", "Lieu", "Chambres", "Pièces", "Etage"])
    writer.writerows(data)

# with open("studapart_logements_updated.csv", "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#     writer.writerow(["source", "source_url", "scraped_at", "title", "property_type_raw", "parent_offer", "unit_name", "is_residence", "price_raw", "price_min_eur", "price_max_eur", "surface_raw", "surface_min_m2", "surface_max_m2", "rooms_raw", "rooms_count", "bedrooms_count", "address_raw", "city", "postal_code", "furnished", "floor", "elevator", "parking"])
#     writer.writerows(data)

print("CSV saved successfully!")