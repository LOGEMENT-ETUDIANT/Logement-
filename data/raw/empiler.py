import pandas as pd

data1 = pd.read_csv("data/raw/data_nettoyer.csv")
data2 = pd.read_csv("studapart_logements_clean.csv")

data_final = pd.concat([data1, data2], ignore_index=True)

print(data_final.shape)
data_final.to_csv("data/clean/data_empiler.csv", index=False)
