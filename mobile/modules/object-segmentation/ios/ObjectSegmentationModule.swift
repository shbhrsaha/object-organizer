import ExpoModulesCore
import Vision
import UIKit
import CoreImage
import CoreImage.CIFilterBuiltins

enum SegmentationError: Error {
  case invalidUri
  case invalidImage
  case invalidCGImage
  case requestFailed
  case maskFailed
  case outputFailed
}

public class ObjectSegmentationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ObjectSegmentation")

    AsyncFunction("segmentImage") { (uri: String) async throws -> String in
      return try await Segmenter.segmentImage(uri: uri)
    }
  }
}

enum Segmenter {
  static let context = CIContext()

  static func segmentImage(uri: String) async throws -> String {
    guard !uri.isEmpty else {
      throw SegmentationError.invalidUri
    }
    let url: URL
    if uri.hasPrefix("file://") {
      guard let fileUrl = URL(string: uri) else {
        throw SegmentationError.invalidUri
      }
      url = fileUrl
    } else {
      url = URL(fileURLWithPath: uri)
    }
    let data = try Data(contentsOf: url)
    guard let image = UIImage(data: data) else {
      throw SegmentationError.invalidImage
    }
    let normalized = image.normalizedImage()
    guard let cgImage = normalized.cgImage else {
      throw SegmentationError.invalidCGImage
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let outputCGImage: CGImage

    if #available(iOS 17.0, *) {
      let request = VNGenerateForegroundInstanceMaskRequest()
      try handler.perform([request])
      guard let observation = request.results?.first else {
        throw SegmentationError.requestFailed
      }
      let maskPixelBuffer = try observation.generateScaledMaskForImage(
        forInstances: observation.allInstances,
        from: handler
      )
      outputCGImage = try applyMask(maskPixelBuffer, to: cgImage)
    } else {
      let request = VNGenerateObjectnessBasedSaliencyImageRequest()
      try handler.perform([request])
      guard let observation = request.results?.first else {
        throw SegmentationError.requestFailed
      }
      outputCGImage = try applyMask(observation.pixelBuffer, to: cgImage)
    }

    let outputImage = UIImage(cgImage: outputCGImage, scale: normalized.scale, orientation: .up)
    guard let pngData = outputImage.pngData() else {
      throw SegmentationError.outputFailed
    }

    let outputUrl = FileManager.default.temporaryDirectory.appendingPathComponent(
      "cutout-\(UUID().uuidString).png"
    )
    try pngData.write(to: outputUrl, options: [.atomic])
    return outputUrl.absoluteString
  }

  static func applyMask(_ maskPixelBuffer: CVPixelBuffer, to image: CGImage) throws -> CGImage {
    let ciImage = CIImage(cgImage: image)
    let maskImage = CIImage(cvPixelBuffer: maskPixelBuffer)
    let scaledMask: CIImage
    if maskImage.extent.size != ciImage.extent.size {
      let scaleX = ciImage.extent.width / maskImage.extent.width
      let scaleY = ciImage.extent.height / maskImage.extent.height
      scaledMask = maskImage
        .transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
        .cropped(to: ciImage.extent)
    } else {
      scaledMask = maskImage
    }
    let background = CIImage(color: .clear).cropped(to: ciImage.extent)

    let filter = CIFilter.blendWithMask()
    filter.inputImage = ciImage
    filter.maskImage = scaledMask
    filter.backgroundImage = background

    guard let outputImage = filter.outputImage,
          let outputCGImage = context.createCGImage(outputImage, from: ciImage.extent) else {
      throw SegmentationError.maskFailed
    }

    return outputCGImage
  }
}

extension UIImage {
  func normalizedImage() -> UIImage {
    if imageOrientation == .up {
      return self
    }
    let format = UIGraphicsImageRendererFormat()
    format.scale = scale
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    return renderer.image { _ in
      draw(in: CGRect(origin: .zero, size: size))
    }
  }
}
