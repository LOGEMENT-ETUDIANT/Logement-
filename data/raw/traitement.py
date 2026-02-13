import pandas as pd


data = pd.read_csv("data/raw/data_recuperer.csv")

before_shape = data.shape

data = data.replace(r"^\s*$", pd.NA, regex=True).dropna(how="all").reset_index(drop=True)

after_shape = data.shape

print(f"before={before_shape} after={after_shape}")


print(f"shape={data.shape}")
print("\nhead:")
print(data.head())

print("\nmissing values per column:")
missing = data.isna().sum().sort_values(ascending=False)
print(missing)
print(f"\nmissing cells total: {int(missing.sum())}")

dup_count = int(data.duplicated().sum())
print(f"\nduplicate rows: {dup_count}")
if dup_count:
    print("duplicate rows (first 10):")
    print(data[data.duplicated(keep=False)].head(10))

print("\ndescribe:")
print(data.describe(include="all"))

print("\ninfo:")
data.info()
