import torch
from transformers import ResNetForImageClassification

model = ResNetForImageClassification.from_pretrained("artifacts/resnet50_pytorch")
model.eval()

dummy_input = torch.randn(1, 3, 224, 224)

torch.onnx.export(
    model,
    dummy_input,
    "artifacts/resnet50.onnx",
    input_names=["pixel_values"],
    output_names=["logits"],
    dynamic_axes={"pixel_values": {0: "batch_size"}},
    opset_version=14,
)
print("Exported to artifacts/resnet50.onnx")
