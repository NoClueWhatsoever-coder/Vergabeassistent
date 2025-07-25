import requests
res = requests.post(
    "http://localhost:6333/collections/leistungsdokumente/points/scroll",
    json={"limit": 1, "with_payload": True}
)
print(res.json())