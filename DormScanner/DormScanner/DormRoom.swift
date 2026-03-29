import Foundation
import SwiftData

@Model
final class DormRoom {
    var id: UUID
    var dormName: String
    var roomNumber: String
    var scanDate: Date

    // Room dimensions extracted from RoomPlan (in meters)
    var roomLength: Double?
    var roomWidth: Double?
    var roomHeight: Double?
    var floorArea: Double?

    // Detected surfaces and objects summary
    var wallCount: Int
    var windowCount: Int
    var doorCount: Int
    var objectsSummary: String

    // File paths for exported data (relative to app documents directory)
    var usdzFilePath: String?
    var jsonFilePath: String?

    var notes: String

    init(
        dormName: String,
        roomNumber: String,
        scanDate: Date = .now,
        roomLength: Double? = nil,
        roomWidth: Double? = nil,
        roomHeight: Double? = nil,
        floorArea: Double? = nil,
        wallCount: Int = 0,
        windowCount: Int = 0,
        doorCount: Int = 0,
        objectsSummary: String = "",
        usdzFilePath: String? = nil,
        jsonFilePath: String? = nil,
        notes: String = ""
    ) {
        self.id = UUID()
        self.dormName = dormName
        self.roomNumber = roomNumber
        self.scanDate = scanDate
        self.roomLength = roomLength
        self.roomWidth = roomWidth
        self.roomHeight = roomHeight
        self.floorArea = floorArea
        self.wallCount = wallCount
        self.windowCount = windowCount
        self.doorCount = doorCount
        self.objectsSummary = objectsSummary
        self.usdzFilePath = usdzFilePath
        self.jsonFilePath = jsonFilePath
        self.notes = notes
    }

    var displayName: String {
        "\(dormName) - Room \(roomNumber)"
    }

    var dimensionsText: String {
        guard let length = roomLength, let width = roomWidth else {
            return "No dimensions captured"
        }
        let l = String(format: "%.1f", length * 3.28084) // meters to feet
        let w = String(format: "%.1f", width * 3.28084)
        if let height = roomHeight {
            let h = String(format: "%.1f", height * 3.28084)
            return "\(l)' × \(w)' × \(h)' H"
        }
        return "\(l)' × \(w)'"
    }

    var floorAreaText: String {
        guard let area = floorArea else { return "N/A" }
        let sqft = area * 10.7639 // sq meters to sq feet
        return String(format: "%.0f sq ft", sqft)
    }
}
