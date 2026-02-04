import requests
import time
import csv
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By

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

# url = "https://www.studapart.com/fr/logement-etudiant-paris"

# response = requests.get(url)

# if response.status_code == 200:
#     html_content = response.text
#     soup = BeautifulSoup(html_content, "html.parser")
#     products = soup.find_all(class_="AccomodationBlock AccomodationBlock--withDescription")
#     print("Success :")
#     for i,product in enumerate(products,start=1):
#         name = product.find("p", class_="AccomodationBlock_title ft-bold ellipsis-2 mb-5").get_text(strip=True)
#         type = product.find("p", class_="ft-xs")["class"][1]
#         print("Offre ",i,": Nom :",name,"| Type :",type)
# else :
#     print("Error :",{response.status_code})

driver = webdriver.Chrome()
driver.get("https://www.studapart.com/fr/logement-etudiant-paris")

data = []

for page in range(1, 6):
    driver.get(f"https://www.studapart.com/fr/logement-etudiant-paris?page={page}")
    time.sleep(3)
    driver.implicitly_wait(5)

    names = driver.find_elements(By.CSS_SELECTOR, "p[class='AccomodationBlock_title ft-bold ellipsis-2 mb-5']")
    types = driver.find_elements(By.CSS_SELECTOR, "p[class='ft-xs']")
    prices = driver.find_elements(By.CSS_SELECTOR, "p[class='ft-l color-ft ft-m@s']>b")
    surfaces = driver.find_elements(By.CSS_SELECTOR, "div[class='AccomodationBlock_location mb-10 color-ft ellipsis-1']")

    for i,(name,type,price,surface) in enumerate(zip(names,types,prices,surfaces),start=1):
        data.append([name.text, type.text, surface.text ,price.text])

driver.quit()

with open("studapart_logements.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Type", "Surface" ,"Price"])
    writer.writerows(data)

print("CSV saved successfully!")