import Foundation
import RoomPlan

struct RoomScanResult {
    var length: Double?
    var width: Double?
    var height: Double?
    var floorArea: Double?
    var wallCount: Int
    var windowCount: Int
    var doorCount: Int
    var objectsSummary: String
    var capturedRoom: CapturedRoom?
}

@MainActor
class RoomCaptureController: NSObject, ObservableObject {
    @Published var scanResult: RoomScanResult?
    @Published var isScanning = false
    @Published var errorMessage: String?

    private var captureSession: RoomCaptureSession?
    private var captureView: RoomCaptureView?

    func setupCaptureView() -> RoomCaptureView {
        let view = RoomCaptureView(frame: .zero)
        view.captureSession.delegate = self
        view.delegate = self
        self.captureView = view
        self.captureSession = view.captureSession
        return view
    }

    func startSession() {
        guard let captureSession else { return }
        let config = RoomCaptureSession.Configuration()
        captureSession.run(configuration: config)
        isScanning = true
        errorMessage = nil
    }

    func stopSession() {
        captureSession?.stop()
    }

    func exportUSDZ(to url: URL) async -> Bool {
        guard let capturedRoom = scanResult?.capturedRoom else { return false }
        do {
            try capturedRoom.export(to: url)
            return true
        } catch {
            errorMessage = "Failed to export USDZ: \(error.localizedDescription)"
            return false
        }
    }

    private func extractDimensions(from room: CapturedRoom) -> RoomScanResult {
        let walls = room.walls
        let windows = room.windows
        let doors = room.doors

        // Extract room dimensions from floor
        var length: Double?
        var width: Double?
        var height: Double?
        var floorArea: Double?

        if let floor = room.floors.first {
            let dims = floor.dimensions
            length = Double(dims.x)
            width = Double(dims.z)
            floorArea = Double(dims.x * dims.z)
        }

        // Get ceiling height from walls
        if let firstWall = walls.first {
            height = Double(firstWall.dimensions.y)
        }

        // Build objects summary
        var objects: [String] = []
        let objectCounts = room.objects.reduce(into: [CapturedRoom.Object.Category: Int]()) { counts, obj in
            counts[obj.category, default: 0] += 1
        }
        for (category, count) in objectCounts.sorted(by: { $0.key.rawValue < $1.key.rawValue }) {
            let name = categoryName(category)
            objects.append("\(count)x \(name)")
        }

        return RoomScanResult(
            length: length,
            width: width,
            height: height,
            floorArea: floorArea,
            wallCount: walls.count,
            windowCount: windows.count,
            doorCount: doors.count,
            objectsSummary: objects.joined(separator: ", "),
            capturedRoom: room
        )
    }

    private func categoryName(_ category: CapturedRoom.Object.Category) -> String {
        switch category {
        case .storage: return "Storage"
        case .refrigerator: return "Refrigerator"
        case .stove: return "Stove"
        case .bed: return "Bed"
        case .sink: return "Sink"
        case .washerDryer: return "Washer/Dryer"
        case .toilet: return "Toilet"
        case .bathtub: return "Bathtub"
        case .oven: return "Oven"
        case .dishwasher: return "Dishwasher"
        case .table: return "Table"
        case .sofa: return "Sofa"
        case .chair: return "Chair"
        case .fireplace: return "Fireplace"
        case .television: return "Television"
        case .stairs: return "Stairs"
        @unknown default: return "Other"
        }
    }
}

extension RoomCaptureController: RoomCaptureSessionDelegate {
    nonisolated func captureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) {
        // Real-time updates during scanning - handled by RoomCaptureView automatically
    }

    nonisolated func captureSession(_ session: RoomCaptureSession, didEndWith data: CapturedRoomData, error: (any Error)?) {
        Task { @MainActor in
            isScanning = false
            if let error {
                errorMessage = "Scan error: \(error.localizedDescription)"
            }
        }
    }
}

extension RoomCaptureController: RoomCaptureViewDelegate {
    nonisolated func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: (any Error)?) -> Bool {
        return true
    }

    nonisolated func captureView(didPresent processedResult: CapturedRoom, error: (any Error)?) {
        Task { @MainActor in
            if let error {
                errorMessage = "Processing error: \(error.localizedDescription)"
            } else {
                scanResult = extractDimensions(from: processedResult)
            }
        }
    }
}
