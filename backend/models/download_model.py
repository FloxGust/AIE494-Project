from transformers import AutoFeatureExtractor, ResNetForImageClassification

MODEL_ID = "microsoft/resnet-50"

print(f"Downloading {MODEL_ID}...")
AutoFeatureExtractor.from_pretrained(MODEL_ID)
model = ResNetForImageClassification.from_pretrained(MODEL_ID)
model.save_pretrained("artifacts/resnet50_pytorch")
print("Done — saved to artifacts/resnet50_pytorch")
