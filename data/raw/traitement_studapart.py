import pandas as pd
import numpy as np
from pathlib import Path
import re

data = pd.read_csv("data/raw/studapart_logements.csv")
print(data.isnull().sum())
print(data.duplicated().sum())
print("###########")
#nettoyer les colonnes

data = data.drop_duplicates()
print(data.duplicated().sum())

data["Price"] = data["Price"].str.replace("\n", " ", regex=False)

data = data.drop(columns=["Type", "Logement","Chambres","Etage"])

data["Pièces"] = data["Pièces"].fillna(1)

def moyenne_surface(val):
    if pd.isna(val):
        return None
    nombres = re.findall(r"\d+", val)#trouver tous les nombres dans la chaîne de caractères
    nombres = [int(n) for n in nombres]#convertir les nombres en entiers = 2nombres
    return sum(nombres) / len(nombres)
data["Surface"] = data["Surface"].apply(moyenne_surface)

def moyenne_price(val):
    if pd.isna(val):
        return None
    nombres = re.findall(r"\d+", val)#trouver tous les nombres dans la chaîne de caractères
    nombres = [int(n) for n in nombres]#convertir les nombres en entiers = 2nombres
    return sum(nombres) / len(nombres)
data["Price"] = data["Price"].apply(moyenne_price).round(2).astype(float)

#extraire des info depuis Lieu ####CODE POSTAL###########################################################

data["Code_postal"] = (data["Lieu"].astype(str).str.extract(r"\b(\d{5})\b", expand=False))
#récupérer le numéro d'arrondissement dans Lieu
arr = data["Lieu"].astype(str).str.extract(r"\b(\d{1,2})\s*(?:er|e|eme|ème)?\s*Arrondissement\b",expand=False)
arr = pd.to_numeric(arr, errors="coerce")
#garder seulement les arrondissements valides de Paris
arr = arr.where(arr.between(1, 20))
data["Code_postal"] = data["Code_postal"].fillna(75000 + arr)
data["Code_postal"] = pd.to_numeric(data["Code_postal"],errors="coerce")
data["Code_postal"] = data["Code_postal"].astype("Int64")

data.loc[data["Lieu"] == "192 Avenue Jean Jaurès, Pantin, France", "Code_postal"] = 93500
data.loc[data["Lieu"] == "19-21 Rue Emile Duclaux, Suresnes, France", "Code_postal"] = 92150
data.loc[data["Lieu"] == "60 Avenue du Général de Gaulle, Puteaux, France", "Code_postal"] = 92800
data.loc[data["Lieu"] == "48 Avenue des Champs Pierreux, Nanterre, France", "Code_postal"] = 92000
data.loc[data["Lieu"] == "6-22 Rue de Vouillé, Paris, France", "Code_postal"] = 75015
data.loc[data["Lieu"] == "172-178 Rue d'Aubervilliers, Paris, France", "Code_postal"] = 75019
data.loc[data["Lieu"] == "37 Rue de la Saussière, Boulogne-Billancourt, France", "Code_postal"] = 92100
data["Code_postal"] = pd.to_numeric(data["Code_postal"], errors="coerce")

print('###########')
##1) Utiliser un modèle de machine learning pour prédire les surfaces manquantes
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
# lignes utilisables pour entraîner
train_mask = data["Surface"].notna() & data["Price"].notna() & data["Code_postal"].notna()
X_train = data.loc[train_mask, ["Price", "Code_postal"]].copy()
y_train = data.loc[train_mask, "Surface"].copy()

# lignes à prédire
pred_mask = data["Surface"].isna() & data["Price"].notna() & data["Code_postal"].notna()
X_pred = data.loc[pred_mask, ["Price", "Code_postal"]].copy()

preprocess = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), ["Price"]),
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["Code_postal"]),
    ]
)

model = Pipeline(
    steps=[
        ("prep", preprocess),
        ("reg", RandomForestRegressor(n_estimators=300, random_state=42)),
    ]
)

if len(X_train) > 0 and len(X_pred) > 0:
    model.fit(X_train, y_train)
    data.loc[pred_mask, "Surface"] = model.predict(X_pred)

print(data.loc[pred_mask, ["Price", "Code_postal", "Surface"]].head(10))

##3) Utiliser un modèle de machine learning pour prédire les PRIX manquant
data["Price"] = pd.to_numeric(data["Price"], errors="coerce")
# lignes utilisables pour entraîner
train_mask = data["Surface"].notna() & data["Price"].notna() & data["Code_postal"].notna()
X_train = data.loc[train_mask, ["Surface", "Code_postal"]].copy()
y_train = data.loc[train_mask, "Price"].copy()

# lignes à prédire
pred_mask = data["Price"].isna() & data["Surface"].notna() & data["Code_postal"].notna()
X_pred = data.loc[pred_mask, ["Surface", "Code_postal"]].copy()

preprocess = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), ["Surface"]),
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["Code_postal"]),
    ]
)

model = Pipeline(
    steps=[
        ("prep", preprocess),
        ("reg", RandomForestRegressor(n_estimators=300, random_state=42)),
    ]
)

if len(X_train) > 0 and len(X_pred) > 0:
    model.fit(X_train, y_train)
    data.loc[pred_mask, "Price"] = model.predict(X_pred).round(2)

print(data.loc[pred_mask, ["Price", "Code_postal", "Surface"]].head(10))


print(data.isnull().sum())
print(data.duplicated().sum())

data.to_csv("data/raw/studapart_logements_clean.csv", index=False)


