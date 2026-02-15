import pandas as pd
import numpy as np

data = pd.read_csv("data_recuperer.csv")

print(data.head())

print(data.head())
print(data.shape)
print(data.info())
print(data.isnull().sum())
data = data.dropna(how="all")

#nettoyer les colonnes
data["Surface"] = (
    data["Surface"]
    .str.replace(" m²", "", regex=False)
    .str.replace(",", ".", regex=False)
)

data["Surface"] = pd.to_numeric(data["Surface"], errors="coerce")
data["Price"] = data["Price"].str.replace(r"[^\d]", "", regex=True)
data["Price"] = pd.to_numeric(data["Price"], errors="coerce")
data["Chambres"] = data["Chambres"].str.extract(r"(\d+)")
data["Chambres"] = pd.to_numeric(data["Chambres"], errors="coerce")
data["Pièces"] = data["Pièces"].str.extract(r"(\d+)")
data["Pièces"] = pd.to_numeric(data["Pièces"], errors="coerce")
data["Etage"] = data["Etage"].str.extract(r"(\d+)")
data["Etage"] = pd.to_numeric(data["Etage"], errors="coerce")

#extraire des info depuis Lieu


data["Code_postal"] = data["Lieu"].str.extract(r"\((\d{5})\)")
data.loc[data["Lieu"] == "Bassin de la Villette", "Code_postal"] = "75019"
data.loc[data["Lieu"] == "Clignancourt-Jules Joffrin", "Code_postal"] = "75018"
data["Code_postal"] = pd.to_numeric(data["Code_postal"], errors="coerce")

#remplir les vide dans chabre par 0 car il y a des annonce de studio 
data["Chambres"] = data["Chambres"].fillna(0)
print(data.dtypes)
#remplir les vides dans piece 
data.loc[data["Pièces"].isna(), "Pièces"] = data["Chambres"] + 1


print(data.isnull().sum())
data.to_csv("data_nettoyer.csv", index=False)











