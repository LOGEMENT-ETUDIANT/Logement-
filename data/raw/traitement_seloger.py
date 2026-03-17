import pandas as pd
import numpy as np
from pathlib import Path

data = pd.read_csv("data/raw/data_recuperer.csv")

print(data.head())
print(data.shape)
print(data.info())
print(data.isnull().sum())
data = data.dropna(how="all")
data = data.drop(columns=["Chambres","Etage"])

#nettoyer les colonnes
data["Surface"] = (data["Surface"].str.replace(" m²", "", regex=False).str.replace(",", ".", regex=False))
data["Surface"] = pd.to_numeric(data["Surface"], errors="coerce")
data["Price"] = data["Price"].str.replace(r"[^\d]", "", regex=True)
data["Price"] = pd.to_numeric(data["Price"], errors="coerce")
data["Pièces"] = data["Pièces"].str.extract(r"(\d+)")
data["Pièces"] = pd.to_numeric(data["Pièces"], errors="coerce")

#extraire des info depuis Lieu
data["Code_postal"] = data["Lieu"].str.extract(r"\((\d{5})\)")
data.loc[data["Lieu"] == "Bassin de la Villette", "Code_postal"] = "75019"
data.loc[data["Lieu"] == "Clignancourt-Jules Joffrin", "Code_postal"] = "75018"
data["Code_postal"] = pd.to_numeric(data["Code_postal"], errors="coerce")

#remplir les vides dans piece 
data.loc[data["Pièces"].isna(), "Pièces"] = 1

data = data[data["Price"] <= 1200]
print(data.shape)
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

print(data.isnull().sum())

data.to_csv("data/raw/data_nettoyer.csv", index=False)












