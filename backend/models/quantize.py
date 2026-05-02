from onnxruntime.quantization import quantize_dynamic, QuantType

# Conv layers produce ConvInteger ops that onnxruntime CPU does not support.
# Quantize only Gemm/MatMul (the final FC layer) which is fully supported.
quantize_dynamic(
    model_input="artifacts/resnet50.onnx",
    model_output="artifacts/resnet50.quant.onnx",
    weight_type=QuantType.QInt8,
    op_types_to_quantize=["Gemm", "MatMul"],
)
print("Quantized model saved to artifacts/resnet50.quant.onnx")
